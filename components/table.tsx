import { sql } from '@vercel/postgres'
import { seed } from '@/lib/seed'

export default async function Entregas() {
  let data

  try {
    data = await sql`SELECT * FROM Entrega`
  } catch (e: any) {
    if (e.message === `relation "Entrega" does not exist`) {
      console.log(
        'Table does not exist, creating and seeding it with dummy data now...'
      )
      // Table is not created yet
      await seed()
      data = await sql`SELECT * FROM Entrega`
    } else {
      throw e
    }
  }

  const { rows: entregas } = data

  return (
    <div className="bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 rounded-lg backdrop-blur-lg max-w-xl mx-auto w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Entregas</h2>        
        </div>
      </div>
      <div className="divide-y divide-gray-900/5">
        {entregas.map((entrega, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-3"
          >
            <div className="space-y-1">
            <p className="text-sm text-gray-500">Vendido en {entrega.punto_de_venta} el {entrega.fecha.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</p>
            <p className="font-medium leading-none">{entrega.producto}</p>
              <p className=" text-gray-500">{entrega.nombre}</p>
              <a href={`tel:${entrega.celular}`}>Llamar</a>

      <p className=" text-gray-500">{entrega.domcilio}</p>
              <p className=" text-gray-500">{entrega.notas}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
