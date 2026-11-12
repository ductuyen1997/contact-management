import { Link } from 'react-router'
import { EmptyState } from '../components/States'

export function NotFoundPage() {
  return (
    <EmptyState>
      <h1>Not found</h1>
      <p>That page or contact doesn't exist, or it has been deleted.</p>
      <Link className="btn btn-primary" to="/contacts">Back to contacts</Link>
    </EmptyState>
  )
}
