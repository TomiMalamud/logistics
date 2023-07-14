import { sql } from '@vercel/postgres'
import { timeAgo } from '@/lib/utils'
import { seed } from '@/lib/seed'

export default async function Entregas() {
  let data
  let startTime = Date.now()

  try {
    data = await sql`SELECT * FROM Entrega`
  } catch (e: any) {
    if (e.message === `relation "Entrega" does not exist`) {
      console.log(
        'Table does not exist, creating and seeding it with dummy data now...'
      )
      // Table is not created yet
      await seed()
      startTime = Date.now()
      data = await sql`SELECT * FROM Entrega`
    } else {
      throw e
    }
  }

  const { rows: entregas } = data
  const duration = Date.now() - startTime

  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Recent Entregas</h2>
          <p className="text-sm text-gray-500">
            Fetched {entregas.length} entregas in {duration}ms
          </p>
        </div>
      </div>
      <div className="divide-y divide-gray-900/5">
        {entregas.map((entrega, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-3"
          >
            <div className="space-y-1">
              <p className="font-medium leading-none">{entrega.nombre}</p>
              <p className="text-sm text-gray-500">{entrega.celular}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
