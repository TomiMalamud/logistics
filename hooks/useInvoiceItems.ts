import useSWR from 'swr'
import { InvoiceData } from '@/types/types'

const fetcher = async (url: string): Promise<InvoiceData> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
}

export const useInvoiceItems = (invoice_id: number | null) => {
  const { data, error, mutate } = useSWR<InvoiceData>(
    invoice_id ? `/api/invoices/${invoice_id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  )

  const items = data?.Items.map(item => ({
    ...item,
  })) || []

  return {
    items,
    data,
    isLoading: !error && !data,
    isError: error,
    mutate
  }
}