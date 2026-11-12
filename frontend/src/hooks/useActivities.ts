import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { activitiesApi, type ActivityQuery } from '../api/activities'

export function useActivities(query: ActivityQuery) {
  return useQuery({
    queryKey: ['activities', query],
    queryFn: () => activitiesApi.list(query),
    placeholderData: keepPreviousData,
    retry: false, // the gateway already answers 503 quickly via its circuit breaker
  })
}
