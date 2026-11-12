import { request, toQueryString } from './http'
import type { Activity, Page } from './types'

export interface ActivityQuery {
  contactId?: number
  page?: number
  size?: number
}

export const activitiesApi = {
  list: (query: ActivityQuery) => request<Page<Activity>>('/api/v1/activities' + toQueryString({ ...query })),
}
