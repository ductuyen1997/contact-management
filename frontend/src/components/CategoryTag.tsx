import type { Category } from '../api/types'
import { CATEGORY_LABELS } from '../lib/contact'

export function CategoryTag({ category }: { category: Category }) {
  return <span className={`tag tag-${category.toLowerCase()}`}>{CATEGORY_LABELS[category]}</span>
}
