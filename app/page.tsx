import { Suspense } from 'react'
import Table from '@/components/table'
import TablePlaceholder from '@/components/table-placeholder'


export const runtime = 'edge'
export const preferredRegion = 'home'
export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center">
      <Suspense fallback={<TablePlaceholder />}>
        {/* @ts-expect-error Async Server Component */}
        <Table />
      </Suspense>
      
    </main>
  )
}
