

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Reportes() {
  const [umbral, setUmbral] = useState(3)
  const [bajo, setBajo] = useState([])
  const [cero, setCero] = useState([])

  useEffect(() => {
    (async () => {
      const { data: low } = await supabase
        .from("v_stock")
        .select("*")
        .lte("stock_unit", umbral)
        .gt("stock_unit", 0)
        .order("stock_unit", { ascending: true })

      const { data: out } = await supabase
        .from("v_stock")
        .select("*")
        .eq("stock_unit", 0)
        .order("nombre")

      setBajo(low || [])
      setCero(out || [])
    })()
  }, [umbral])

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-3">
        <span className="font-medium">Umbral bajo stock:</span>
        <input
          type="number"
          min="1"
          className="border rounded px-3 py-2 w-24 text-center"
          value={umbral}
          onChange={e => setUmbral(Number(e.target.value || 1))}
        />
      </div>

      <section className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-3 text-center text-yellow-700">
          Bajo stock (≤ {umbral})
        </h2>
        <Tabla data={bajo} umbral={umbral}/>
      </section>

      <section className="bg-white shadow rounded p-4">
        <h2 className="text-xl font-semibold mb-3 text-center text-red-700">
          Sin stock (= 0)
        </h2>
        <Tabla data={cero} umbral={umbral}/>
      </section>
    </div>
  )
}

function Tabla({ data, umbral }) {
  if (!data.length) return <p className="text-center text-gray-500">No hay registros</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-center">
        <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="px-3 py-2">Código</th>
            <th className="px-3 py-2">Nombre</th>
            <th className="px-3 py-2">Stock U.</th>
            <th className="px-3 py-2">Stock C.</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => {
            let color = "bg-green-100"
            if (p.stock_unit === 0) color = "bg-red-100"
            else if (p.stock_unit <= umbral) color = "bg-yellow-100"

            return (
              <tr
                key={p.codigo_barra}
                className={`${i % 2 === 0 ? "bg-gray-50" : "bg-white"} ${color}`}
              >
                <td className="px-3 py-2 font-mono">{p.codigo_barra}</td>
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2">{p.stock_unit}</td>
                <td className="px-3 py-2">{p.stock_cajas}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}


