

import { useMemo, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import BarcodeScanner from "../components/BarcodeScanner"

export default function Ventas() {
  const [carrito, setCarrito] = useState([]) // {codigo_barra, nombre, precio_unit, cantidad}
  const [scanOpen, setScanOpen] = useState(false)

  const addByCode = async (code) => {
    setScanOpen(false)
    const { data: prod } = await supabase.from("productos").select("*").eq("codigo_barra", code).single()
    if (!prod) return alert("Producto no encontrado")

    setCarrito(prev => {
      const i = prev.findIndex(x => x.codigo_barra === code)
      if (i >= 0) {
        const copy = [...prev]; copy[i].cantidad += 1; return copy
      }
      return [...prev, { codigo_barra: code, nombre: prod.nombre, precio_unit: Number(prod.precio_unit), cantidad: 1 }]
    })
  }

  const total = useMemo(
    () => carrito.reduce((acc, it) => acc + it.cantidad * it.precio_unit, 0),
    [carrito]
  )

  const confirmar = async () => {
    if (carrito.length === 0) return
    const { data: vta, error } = await supabase.from("ventas").insert({ total }).select().single()
    if (error) return alert("❌ " + error.message)

    const items = carrito.map(it => ({
      venta_id: vta.id,
      codigo_barra: it.codigo_barra,
      cantidad: it.cantidad,
      precio_unit: it.precio_unit
    }))
    const { error: errItems } = await supabase.from("ventas_items").insert(items)
    if (errItems) return alert("❌ " + errItems.message)

    alert("✅ Venta registrada")
    setCarrito([])
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3 justify-center">
        <button className="px-4 py-2 bg-indigo-600 text-white rounded" onClick={()=>setScanOpen(true)}>Escanear producto</button>
        <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setCarrito([])}>Vaciar</button>
      </div>

      {scanOpen && (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-4">
          <BarcodeScanner onDetected={addByCode} onError={(e)=>alert(e.message)} />
          <div className="text-center mt-3">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setScanOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto w-full max-w-6xl shadow rounded bg-white mx-auto">
        <table className="w-full border-collapse text-center">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Cant.</th>
              <th className="px-3 py-2">Subtotal</th>
              <th className="px-3 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((it,i)=>(
              <tr key={it.codigo_barra} className={`${i%2===0?"bg-gray-50":"bg-white"}`}>
                <td className="px-3 py-2">{it.codigo_barra}</td>
                <td className="px-3 py-2">{it.nombre}</td>
                <td className="px-3 py-2">${it.precio_unit.toFixed(2)}</td>
                <td className="px-3 py-2">
                  <input type="number" min="1" className="border rounded w-20 text-center"
                    value={it.cantidad}
                    onChange={e=>{
                      const v = Math.max(1, Number(e.target.value||1))
                      setCarrito(prev=>{
                        const copy=[...prev]; copy[i]={...copy[i], cantidad:v}; return copy
                      })
                    }} />
                </td>
                <td className="px-3 py-2">${(it.cantidad*it.precio_unit).toFixed(2)}</td>
                <td className="px-3 py-2">
                  <button className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={()=>setCarrito(prev=>prev.filter(x=>x.codigo_barra!==it.codigo_barra))}
                  >Quitar</button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100">
              <td colSpan="4" className="text-right font-semibold px-3 py-2">Total</td>
              <td className="font-semibold">${total.toFixed(2)}</td>
              <td className="px-3 py-2">
                <button disabled={!carrito.length} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50" onClick={confirmar}>
                  Confirmar venta
                </button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
