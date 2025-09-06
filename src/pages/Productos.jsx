

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import BarcodeScanner from "../components/BarcodeScanner"

export default function Productos() {
  const [productos, setProductos] = useState([])
  const [q, setQ] = useState("")
  const [showScanner, setShowScanner] = useState(false)
  const [form, setForm] = useState({
    codigo_barra: "", nombre: "", precio_unit: "", costo_unit: "", factor_caja: 1, activo: true
  })

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("v_stock").select("*").order("nombre")
      setProductos(data || [])
    })()
  }, [])

  const filtrados = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return productos
    return productos.filter(p =>
      p.nombre?.toLowerCase().includes(s) || p.codigo_barra?.includes(s)
    )
  }, [q, productos])

  const onScan = async (code) => {
    setShowScanner(false)
    setForm(f => ({ ...f, codigo_barra: code }))

    // Si existe el producto, precarga datos para editar
    const { data } = await supabase.from("productos").select("*").eq("codigo_barra", code).single()
    if (data) {
      setForm({
        codigo_barra: data.codigo_barra,
        nombre: data.nombre || "",
        precio_unit: data.precio_unit ?? "",
        costo_unit: data.costo_unit ?? "",
        factor_caja: data.factor_caja ?? 1,
        activo: data.activo ?? true
      })
    }
  }

  const save = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      precio_unit: Number(form.precio_unit || 0).toFixed(2),
      costo_unit:  Number(form.costo_unit  || 0).toFixed(2),
      factor_caja: Number(form.factor_caja || 1),
    }

    // upsert por PK (codigo_barra)
    const { error } = await supabase.from("productos").upsert(payload, { onConflict: "codigo_barra" })
    if (!error) {
      // refrescar vista
      const { data } = await supabase.from("v_stock").select("*").order("nombre")
      setProductos(data || [])
      setForm({ codigo_barra:"", nombre:"", precio_unit:"", costo_unit:"", factor_caja:1, activo:true })
      alert("✅ Guardado")
    } else {
      alert("❌ " + error.message)
    }
  }

  return (
    <div className="space-y-8">
      {/* Buscador */}
      <div className="flex items-center gap-3 justify-center">
        <input
          className="border rounded px-3 py-2 w-80"
          placeholder="Buscar por nombre o código..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="px-3 py-2 bg-gray-200 rounded" onClick={() => setQ("")}>Limpiar</button>
      </div>

      {/* Formulario alta/edición */}
      <form onSubmit={save} className="bg-white rounded-lg shadow p-4 space-y-3 max-w-3xl mx-auto">
        <h2 className="text-xl font-semibold text-center">Producto</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="flex gap-2">
            <input
              className="border rounded px-3 py-2 flex-1"
              placeholder="Código de barras"
              value={form.codigo_barra}
              onChange={(e)=>setForm({...form, codigo_barra:e.target.value})}
              required
            />
            <button type="button" className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={()=>setShowScanner(true)}>
              Escanear
            </button>
          </div>
          <input
            className="border rounded px-3 py-2"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e)=>setForm({...form, nombre:e.target.value})}
            required
          />
          <input
            className="border rounded px-3 py-2"
            type="number" step="0.01" min="0"
            placeholder="Precio (ej. 1.00)"
            value={form.precio_unit}
            onChange={(e)=>setForm({...form, precio_unit:e.target.value})}
          />
          <input
            className="border rounded px-3 py-2"
            type="number" step="0.01" min="0"
            placeholder="Costo (ej. 0.45)"
            value={form.costo_unit}
            onChange={(e)=>setForm({...form, costo_unit:e.target.value})}
          />
          <input
            className="border rounded px-3 py-2"
            type="number" min="1"
            placeholder="Factor por caja"
            value={form.factor_caja}
            onChange={(e)=>setForm({...form, factor_caja:e.target.value})}
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.activo} onChange={e=>setForm({...form, activo:e.target.checked})}/>
            Activo
          </label>
        </div>
        <div className="text-center">
          <button className="px-5 py-2 bg-green-600 text-white rounded">Guardar</button>
        </div>
      </form>

      {showScanner && (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-4">
          <BarcodeScanner onDetected={onScan} onError={(e)=>alert("Escáner: " + e.message)} />
          <div className="text-center mt-3">
            <button className="px-4 py-2 bg-gray-200 rounded" onClick={()=>setShowScanner(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto w-full max-w-6xl shadow-lg rounded-lg mx-auto">
        <table className="w-full border-collapse bg-white text-center">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Stock</th>
              <th className="px-3 py-2">Activo</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p,i)=>(
              <tr key={p.codigo_barra} className={`${i%2===0?"bg-gray-50":"bg-white"} hover:bg-gray-100`}>
                <td className="px-3 py-2">{p.codigo_barra}</td>
                <td className="px-3 py-2">{p.nombre}</td>
                <td className="px-3 py-2">${Number(p.precio_unit).toFixed(2)}</td>
                <td className="px-3 py-2">{p.stock_unit}</td>
                <td className="px-3 py-2">{p.activo ? "✅" : "❌"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
