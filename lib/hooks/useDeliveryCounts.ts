// lib/useDeliveryCounts.ts
import useSWR from 'swr'

interface CountResponse {
  pending: number
  delivered: number
}

export const useDeliveryCounts = () => {
  const { data, error } = useSWR<CountResponse>('/api/delivery-counts', (url) => 
    fetch(url).then(res => res.json())
  )

  return {
    counts: data,
    isLoading: !error && !data,
    isError: error
  }
}