import { SESSION_STATUSES, STATUS_LABELS } from './types'
import type { SessionStatus } from './types'

export type StatusFilterValue = SessionStatus | 'all'

function isFilterValue(value: string): value is StatusFilterValue {
  return value === 'all' || (SESSION_STATUSES as readonly string[]).includes(value)
}

export function StatusFilter({
  value,
  onChange,
}: {
  value: StatusFilterValue
  onChange: (value: StatusFilterValue) => void
}) {
  return (
    <label className="status-filter">
      Status{' '}
      <select
        name="status"
        value={value}
        onChange={(event) => {
          if (isFilterValue(event.target.value)) onChange(event.target.value)
        }}
      >
        <option value="all">All</option>
        {SESSION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>
    </label>
  )
}
