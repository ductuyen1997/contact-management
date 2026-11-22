import { useSearchParams } from 'react-router'
import { ActivityFeed } from '../components/ActivityFeed'
import { parsePage } from '../lib/params'

/** /activity: every change to any contact, newest first. The page number lives in the URL (?page=2). */
export function ActivityPage() {
  const [params, setParams] = useSearchParams()
  const page = parsePage(params.get('page'))

  // Page 0 is the default, so leave it out of the URL
  const goToPage = (next: number) => setParams(next > 0 ? { page: String(next) } : {}, { replace: true })

  return (
    <div className="narrow">
      <h1>Activity</h1>
      <p className="muted">Every change to your contacts, recorded by the activity service.</p>
      <section className="card section">
        <ActivityFeed page={page} size={20} onPageChange={goToPage} />
      </section>
    </div>
  )
}
