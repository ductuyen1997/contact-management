import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { contactsApi } from '../api/contacts'
import type { ContactFilter, ContactInput } from '../api/types'

export const contactKeys = {
  all: ['contacts'] as const,
  list: (filter: ContactFilter) => ['contacts', 'list', filter] as const,
  stats: () => ['contacts', 'stats'] as const,
  detail: (id: number) => ['contacts', 'detail', id] as const,
}

export function useContactList(filter: ContactFilter) {
  return useQuery({
    queryKey: contactKeys.list(filter),
    queryFn: () => contactsApi.list(filter),
    placeholderData: keepPreviousData,
  })
}

export function useContactStats() {
  return useQuery({ queryKey: contactKeys.stats(), queryFn: contactsApi.stats })
}

export function useContact(id: number) {
  return useQuery({ queryKey: contactKeys.detail(id), queryFn: () => contactsApi.get(id) })
}

/**
 * Contact changes reach activity-service asynchronously via RabbitMQ, so the activity feed is
 * refreshed once immediately and once more shortly after (eventual consistency).
 */
function useInvalidateAfterChange() {
  const queryClient = useQueryClient()
  return () => {
    void queryClient.invalidateQueries({ queryKey: contactKeys.all })
    void queryClient.invalidateQueries({ queryKey: ['activities'] })
    setTimeout(() => void queryClient.invalidateQueries({ queryKey: ['activities'] }), 1000)
  }
}

export function useSaveContact(id?: number) {
  const invalidate = useInvalidateAfterChange()
  return useMutation({
    mutationFn: (input: ContactInput) => (id ? contactsApi.update(id, input) : contactsApi.create(input)),
    onSuccess: invalidate,
  })
}

export function useToggleFavorite() {
  const invalidate = useInvalidateAfterChange()
  return useMutation({ mutationFn: contactsApi.toggleFavorite, onSuccess: invalidate })
}

export function useDeleteContact() {
  const invalidate = useInvalidateAfterChange()
  return useMutation({ mutationFn: contactsApi.remove, onSuccess: invalidate })
}
