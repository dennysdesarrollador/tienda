

import { useState, useRef } from "react"
import { supabase } from "../lib/supabaseClient"
import BarcodeScanner from "../components/BarcodeScanner"

export default function EscanerMovil() {
  const [ultimo, setUltimo] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const lastScanRef = useRef("")

  const onScan = async (code) => {
    if (!code) return
    if (code === lastScanRef.current) return // evitar duplicados inmediatos
    lastScanRef.current = code

    setUltimo(code)
    setErrorMsg("")

    const { error } = await supabase.from("escaneos").insert({ codigo_barra: code })
    if (error) {
      setErrorMsg("❌ Error al enviar: " + error.message)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-2xl font-bold mb-4">📱 Escáner móvil</h1>

      {/* Escáner */}
      <div className="bg-white p-4 rounded shadow w-full max-w-md">
        <BarcodeScanner onDetected={onScan} onError={(e) => setErrorMsg("❌ " + e.message)} />
      </div>

      {/* Último código */}
      {ultimo && (
        <p className="mt-6 text-lg">
          Último enviado:{" "}
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded font-semibold">
            {ultimo}
          </span>
        </p>
      )}

      {/* Mensaje de error */}
      {errorMsg && (
        <p className="mt-4 text-red-600 font-medium">{errorMsg}</p>
      )}
    </div>
  )
}
