

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import BarcodeScanner from "../components/BarcodeScanner"

export default function Ingresos() {
  const [codigo, setCodigo] = useState("")
  const [producto, setProducto] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [porCajas, setPorCajas] = useState(false)

  useEffect(() => {
    (async () => {
      if (codigo) {
        const { data } = await supabase.from("productos").select("*").eq("codigo_barra", codigo).single()
        setProducto(data || null)
      } else {
        setProducto(null)
      }
    })()
  }, [codigo])

  const onScan = (code) => setCodigo(code)

  const ingresar = async () => {
    if (!codigo || cantidad <= 0) return alert("Completa código y cantidad")
    const factor = producto?.factor_caja ?? 1

    // Si no existe, fuerza crear con datos mínimos
    if (!producto) {
      const { error } = await supabase.from("productos").insert({
        codigo_barra: codigo,
        nombre: "(Nuevo) " + codigo,
        precio_unit: 0,
        costo_unit: 0,
        factor_caja: 1,
        activo: true
      })
      if (error) return alert("❌ " + error.message)
    }

    const { error: errMov } = await supabase.from("inventario_movimientos").insert({
      codigo_barra: codigo,
      tipo: "ENTRADA",
      cantidad: Number(cantidad),
      por_cajas: porCajas,
      factor_caja: porCajas ? factor : 1,
      comentario: "Ingreso manual"
    })
    if (errMov) return alert("❌ " + errMov.message)

    alert("✅ Ingreso registrado")
    setCantidad(1)
    setPorCajas(false)
    setCodigo("")
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Escanear</h2>
        <BarcodeScanner onDetected={onScan} onError={(e)=>alert(e.message)} />
        <div className="mt-4 space-y-2">
          <input className="border rounded px-3 py-2 w-full" placeholder="Código" value={codigo} onChange={e=>setCodigo(e.target.value)} />
          <div className="flex gap-3 items-center">
            <input type="number" min="1" className="border rounded px-3 py-2 w-32" value={cantidad} onChange={e=>setCantidad(e.target.value)} />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={porCajas} onChange={e=>setPorCajas(e.target.checked)} />
              ¿Cantidad en cajas?
            </label>
          </div>
          <button className="px-5 py-2 bg-green-600 text-white rounded" onClick={ingresar}>Registrar ingreso</button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4 text-center">Producto</h2>
        {!codigo ? <p className="text-gray-500 text-center">Escanea o escribe un código…</p> :
          producto ? (
            <ul className="space-y-1">
              <li><b>Código:</b> {producto.codigo_barra}</li>
              <li><b>Nombre:</b> {producto.nombre}</li>
              <li><b>Precio:</b> ${Number(producto.precio_unit).toFixed(2)}</li>
              <li><b>Factor caja:</b> {producto.factor_caja}</li>
              <li><b>Activo:</b> {producto.activo ? "Sí" : "No"}</li>
            </ul>
          ) : <p className="text-orange-600">No existe, se creará al ingresar.</p>
        }
      </div>
    </div>
  )
}
