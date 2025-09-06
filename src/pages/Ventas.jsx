

import { useState, useMemo, useEffect } from "react"
import { supabase } from "../lib/supabaseClient"
import BarcodeScanner from "../components/BarcodeScanner"

export default function Ventas() {
  const [carrito, setCarrito] = useState([])
  const [scanOpen, setScanOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const [resultados, setResultados] = useState([])

  // 👉 Función para agregar al carrito por producto (ya encontrado)
  const addProducto = (prod) => {
    setCarrito((prev) => {
      const i = prev.findIndex(
        (x) => x.codigo_barra === prod.codigo_barra && x.por_cajas === false
      )
      if (i >= 0) {
        const copy = [...prev]
        copy[i].cantidad += 1
        return copy
      }
      return [
        ...prev,
        {
          codigo_barra: prod.codigo_barra,
          nombre: prod.nombre,
          precio_unit: Number(prod.precio_unit),
          precio_caja: Number(prod.precio_caja),
          factor_caja: prod.factor_caja,
          cantidad: 1,
          por_cajas: false,
        },
      ]
    })
  }

  // 👉 Buscar en la BD por nombre o código
  useEffect(() => {
    const buscar = async () => {
      if (!busqueda) {
        setResultados([])
        return
      }
      const { data, error } = await supabase
        .from("v_stock")
        .select("*")
        .or(`nombre.ilike.%${busqueda}%,codigo_barra.ilike.%${busqueda}%`)
        .limit(10)

      if (!error) setResultados(data || [])
    }
    buscar()
  }, [busqueda])

  // 👉 Escanear y agregar por código
  const addByCode = async (code) => {
    setScanOpen(false)
    const { data: prod, error } = await supabase
      .from("v_stock")
      .select("*")
      .eq("codigo_barra", code)
      .single()

    if (error || !prod) return alert("Producto no encontrado")
    addProducto(prod)
  }

  // 👉 Hook para escuchar escáner móvil
  useEffect(() => {
    const channel = supabase
      .channel("realtime:escaneos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escaneos" },
        async (payload) => {
          const code = payload.new.codigo_barra
          await addByCode(code)
          await supabase.from("escaneos").delete().eq("id", payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 👉 Calcular total
  const total = useMemo(
    () =>
      carrito.reduce(
        (acc, it) =>
          acc +
          (it.por_cajas
            ? it.cantidad * it.precio_caja
            : it.cantidad * it.precio_unit),
        0
      ),
    [carrito]
  )

  // 👉 Confirmar venta
  const confirmar = async () => {
    if (carrito.length === 0) return

    const { data: vta, error } = await supabase
      .from("ventas")
      .insert({ total })
      .select()
      .single()

    if (error) return alert("❌ " + error.message)

    const items = carrito.map((it) => ({
      venta_id: vta.id,
      codigo_barra: it.codigo_barra,
      cantidad: it.cantidad,
      por_cajas: it.por_cajas,
      precio_unit: it.precio_unit,
      precio_caja: it.precio_caja,
    }))

    const { error: errItems } = await supabase
      .from("ventas_items")
      .insert(items)

    if (errItems) return alert("❌ " + errItems.message)

    alert("✅ Venta registrada")
    setCarrito([])
  }

  return (
    <div className="space-y-6">
      {/* Botones superiores */}
      <div className="flex gap-3 justify-center">
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={() => setScanOpen(true)}
        >
          Escanear producto
        </button>
        <button
          className="px-4 py-2 bg-gray-200 rounded"
          onClick={() => setCarrito([])}
        >
          Vaciar
        </button>
      </div>

      {/* Buscador por nombre o código */}
      <div className="max-w-md mx-auto">
        <input
          type="text"
          placeholder="Buscar producto por nombre o código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border px-4 py-2 rounded w-full"
        />
        {resultados.length > 0 && (
          <div className="bg-white border rounded shadow mt-1 max-h-60 overflow-y-auto">
            {resultados.map((prod) => (
              <div
                key={prod.codigo_barra}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  addProducto(prod)
                  setBusqueda("")
                  setResultados([])
                }}
              >
                {prod.nombre} —{" "}
                <span className="text-sm text-gray-500">
                  {prod.codigo_barra}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Escáner en PC */}
      {scanOpen && (
        <div className="max-w-md mx-auto bg-white rounded-lg shadow p-4">
          <BarcodeScanner
            onDetected={addByCode}
            onError={(e) => alert(e.message)}
          />
          <div className="text-center mt-3">
            <button
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={() => setScanOpen(false)}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Tabla carrito */}
      <div className="overflow-x-auto w-full max-w-6xl shadow rounded bg-white mx-auto">
        <table className="w-full border-collapse text-center">
          <thead className="bg-indigo-600 text-white">
            <tr>
              <th className="px-3 py-2">Código</th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Modo</th>
              <th className="px-3 py-2">Precio</th>
              <th className="px-3 py-2">Cant.</th>
              <th className="px-3 py-2">Subtotal</th>
              <th className="px-3 py-2">Acción</th>
            </tr>
          </thead>
          <tbody>
            {carrito.map((it, i) => (
              <tr
                key={i}
                className={i % 2 === 0 ? "bg-gray-50" : "bg-white"}
              >
                <td className="px-3 py-2">{it.codigo_barra}</td>
                <td className="px-3 py-2">{it.nombre}</td>
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={it.por_cajas ? "caja" : "unidad"}
                    onChange={(e) => {
                      const porCajas = e.target.value === "caja"
                      setCarrito((prev) => {
                        const copy = [...prev]
                        copy[i] = { ...copy[i], por_cajas: porCajas }
                        return copy
                      })
                    }}
                  >
                    <option value="unidad">Unidad</option>
                    <option value="caja">Caja</option>
                  </select>
                </td>
                <td className="px-3 py-2">
                  {it.por_cajas
                    ? `$${it.precio_caja.toFixed(2)}`
                    : `$${it.precio_unit.toFixed(2)}`}
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    min="1"
                    className="border rounded w-20 text-center"
                    value={it.cantidad}
                    onChange={(e) => {
                      const v = Math.max(1, Number(e.target.value || 1))
                      setCarrito((prev) => {
                        const copy = [...prev]
                        copy[i] = { ...copy[i], cantidad: v }
                        return copy
                      })
                    }}
                  />
                </td>
                <td className="px-3 py-2">
                  {it.por_cajas
                    ? `$${(it.cantidad * it.precio_caja).toFixed(2)}`
                    : `$${(it.cantidad * it.precio_unit).toFixed(2)}`}
                </td>
                <td className="px-3 py-2">
                  <button
                    className="px-3 py-1 bg-red-600 text-white rounded"
                    onClick={() =>
                      setCarrito((prev) => prev.filter((_, j) => j !== i))
                    }
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100">
              <td colSpan="5" className="text-right font-semibold px-3 py-2">
                Total
              </td>
              <td className="font-semibold">${total.toFixed(2)}</td>
              <td className="px-3 py-2">
                <button
                  disabled={!carrito.length}
                  className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                  onClick={confirmar}
                >
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


