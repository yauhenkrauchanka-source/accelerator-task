import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import App from '../App'
import { server } from '../mocks/node'

const SEED_TITLES = [
  'Onboarding fundamentals',
  'Advanced React patterns',
  'Accessibility basics',
  'Testing with Vitest',
  'Performance clinic',
]

function trackRequests() {
  const requests: { method: string; pathname: string }[] = []
  server.events.on('request:start', ({ request }) => {
    requests.push({ method: request.method, pathname: new URL(request.url).pathname })
  })
  return {
    count: (method: string) =>
      requests.filter((r) => r.method === method && r.pathname === '/api/sessions').length,
  }
}

// datetime-local expects local wall-clock time, so do not build it with toISOString().
function toLocalInputValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}

const DAY_MS = 24 * 60 * 60 * 1000

async function renderLoaded() {
  const user = userEvent.setup()
  render(<App />)
  const list = await screen.findByRole('list', { name: 'Sessions' })
  return { user, list }
}

afterEach(() => {
  server.events.removeAllListeners()
})

describe('Training sessions workspace', () => {
  it('filters the loaded list by status without refetching', async () => {
    const requests = trackRequests()
    const { user } = await renderLoaded()
    expect(screen.queryByText('Loading sessions…')).not.toBeInTheDocument()
    const getsAfterLoad = requests.count('GET')

    await user.selectOptions(screen.getByLabelText('Status'), 'Completed')

    const rows = within(screen.getByRole('list', { name: 'Sessions' })).getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    for (const row of rows) {
      expect(within(row).getByText('Completed')).toBeInTheDocument()
    }
    expect(screen.queryByText('Onboarding fundamentals')).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Status'), 'All')
    for (const title of SEED_TITLES) {
      expect(screen.getByText(title)).toBeInTheDocument()
    }
    expect(requests.count('GET')).toBe(getsAfterLoad)
  })

  it('creates a session with a trimmed title and shows it in the list', async () => {
    const requests = trackRequests()
    const { user } = await renderLoaded()

    await user.click(screen.getByRole('button', { name: 'New session' }))
    await user.type(screen.getByLabelText('Title'), '  Team retro  ')
    fireEvent.change(screen.getByLabelText('Start date and time'), {
      target: { value: toLocalInputValue(new Date(Date.now() + DAY_MS)) },
    })
    await user.click(screen.getByRole('button', { name: 'Create session' }))

    const list = screen.getByRole('list', { name: 'Sessions' })
    expect(await within(list).findByText('Team retro')).toBeInTheDocument()
    expect(screen.queryByRole('form', { name: 'New session' })).not.toBeInTheDocument()
    expect(requests.count('POST')).toBe(1)
  })

  it('shows a recoverable error when loading fails and recovers on retry', async () => {
    server.use(
      http.get('/api/sessions', () => HttpResponse.json({ message: 'x' }, { status: 500 }), {
        once: true,
      }),
    )
    render(<App />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load sessions.')
    expect(screen.queryByText('Loading sessions…')).not.toBeInTheDocument()

    // Synchronous click: the loading state is asserted before the mocked response settles.
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(screen.getByText('Loading sessions…')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    expect(await screen.findByRole('list', { name: 'Sessions' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Onboarding fundamentals')).toBeInTheDocument()
  })

  it('blocks submission and shows field messages for invalid input', async () => {
    const requests = trackRequests()
    const { user } = await renderLoaded()

    await user.click(screen.getByRole('button', { name: 'New session' }))
    await user.type(screen.getByLabelText('Title'), '   ')
    fireEvent.change(screen.getByLabelText('Start date and time'), {
      target: { value: toLocalInputValue(new Date(Date.now() - DAY_MS)) },
    })
    await user.click(screen.getByRole('button', { name: 'Create session' }))

    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription('Title is required.')
    expect(screen.getByLabelText('Start date and time')).toHaveAccessibleDescription(
      'Start time must be in the future.',
    )
    expect(requests.count('POST')).toBe(0)
  })

  it('sends only one request while a submission is pending', async () => {
    server.use(
      http.post('/api/sessions', async ({ request }) => {
        await delay(200)
        const body = (await request.json()) as { title: string; startsAt: string }
        return HttpResponse.json(
          { id: 'created-1', title: body.title, status: 'scheduled', startsAt: body.startsAt },
          { status: 201 },
        )
      }),
    )
    const requests = trackRequests()
    const { user } = await renderLoaded()

    await user.click(screen.getByRole('button', { name: 'New session' }))
    await user.type(screen.getByLabelText('Title'), 'Pairing session')
    fireEvent.change(screen.getByLabelText('Start date and time'), {
      target: { value: toLocalInputValue(new Date(Date.now() + DAY_MS)) },
    })
    const submit = screen.getByRole('button', { name: 'Create session' })
    await user.dblClick(submit)
    await user.type(screen.getByLabelText('Title'), '{Enter}')

    const pending = screen.getByRole('button', { name: 'Creating…' })
    expect(pending).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'New session' })).toBeDisabled()

    expect(await screen.findByText('Pairing session')).toBeInTheDocument()
    await waitFor(() => expect(requests.count('POST')).toBe(1))
    expect(screen.getByRole('button', { name: 'New session' })).toBeEnabled()
  })
})
