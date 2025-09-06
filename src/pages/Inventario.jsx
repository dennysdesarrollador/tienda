

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export default function Inventario() {
  const [codigo, setCodigo] = useState("")
  const [producto, setProducto] = useState(null)
  const [cantidad, setCantidad] = useState(1)
  const [porCajas, setPorCajas] = useState(false)

  // campos para producto nuevo
  const [nombre, setNombre] = useState("")
  const [precio, setPrecio] = useState(0)
  const [costo, setCosto] = useState(0)
  const [factorCaja, setFactorCaja] = useState(1)

  // escuchar escaneos desde el móvil
  useEffect(() => {
    const channel = supabase
      .channel("realtime:escaneos-inventario")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escaneos" },
        async (payload) => {
          const code = payload.new.codigo_barra
          setCodigo(code)
          await buscarProducto(code)
          // opcional: limpiar escaneo ya procesado
          await supabase.from("escaneos").delete().eq("id", payload.new.id)
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // buscar producto por código
  const buscarProducto = async (code) => {
    const { data } = await supabase
      .from("productos")
      .select("*")
      .eq("codigo_barra", code)
      .single()

    if (data) {
      setProducto(data)
      setNombre(data.nombre)
      setPrecio(data.precio_unit)
      setCosto(data.costo_unit)
      setFactorCaja(data.factor_caja)
    } else {
      setProducto(null)
      setNombre("")
      setPrecio(0)
      setCosto(0)
      setFactorCaja(1)
    }
  }

  // guardar ingreso
  const guardar = async () => {
    if (!codigo) return alert("❌ Escanea o escribe un código de barras")

    let prodId = producto?.id

    if (!producto) {
      // crear nuevo
      const { data, error } = await supabase.from("productos").insert({
        codigo_barra: codigo,
        nombre,
        precio_unit: Number(precio),
        costo_unit: Number(costo),
        factor_caja: Number(factorCaja),
        activo: true
      }).select().single()

      if (error) return alert("❌ " + error.message)
      prodId = data.id
    } else {
      // actualizar info del producto existente
      const { error } = await supabase.from("productos").update({
        nombre,
        precio_unit: Number(precio),
        costo_unit: Number(costo),
        factor_caja: Number(factorCaja)
      }).eq("id", producto.id)
      if (error) return alert("❌ " + error.message)
    }

    // registrar movimiento de inventario
    const { error: errMov } = await supabase.from("inventario_movimientos").insert({
      codigo_barra: codigo,
      tipo: "ENTRADA",
      cantidad: Number(cantidad),
      por_cajas: porCajas,
      factor_caja: porCajas ? factorCaja : 1,
      comentario: producto ? "Reposición stock" : "Nuevo producto"
    })
    if (errMov) return alert("❌ " + errMov.message)

    alert("✅ Inventario actualizado")
    setCodigo("")
    setProducto(null)
    setCantidad(1)
    setPorCajas(false)
    setNombre("")
    setPrecio(0)
    setCosto(0)
    setFactorCaja(1)
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow space-y-4">
      <h2 className="text-2xl font-bold text-center">📦 Inventario</h2>

      <div>
        <label className="block text-sm font-medium">Código de barras</label>
        <input
          className="border rounded w-full px-3 py-2"
          value={codigo}
          onChange={(e) => {
            setCodigo(e.target.value)
            buscarProducto(e.target.value)
          }}
          placeholder="Escanea o escribe código"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          className="border rounded w-full px-3 py-2"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Precio unitario</label>
          <input
            type="number"
            className="border rounded w-full px-3 py-2"
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Costo unitario</label>
          <input
            type="number"
            className="border rounded w-full px-3 py-2"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Factor caja</label>
        <input
          type="number"
          className="border rounded w-full px-3 py-2"
          value={factorCaja}
          onChange={(e) => setFactorCaja(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-4">
        <input
          type="number"
          min="1"
          className="border rounded px-3 py-2 w-28"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={porCajas}
            onChange={(e) => setPorCajas(e.target.checked)}
          />
          ¿Cantidad en cajas?
        </label>
      </div>

      <button
        className="w-full bg-green-600 text-white py-2 rounded"
        onClick={guardar}
      >
        Guardar
      </button>
    </div>
  )
}

