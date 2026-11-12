import { useSearchParams } from 'react-router'
import { ActivityFeed } from '../components/ActivityFeed'

export function ActivityPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(Number(params.get('page') ?? 0) || 0, 0)

  return (
    <div className="narrow">
      <h1>Activity</h1>
      <p className="muted">Every change to your contacts, recorded by the activity service.</p>
      <section className="card section">
        <ActivityFeed
          page={page}
          size={20}
          onPageChange={(p) => setParams(p ? { page: String(p) } : {}, { replace: true })}
        />
      </section>
    </div>
  )
}
