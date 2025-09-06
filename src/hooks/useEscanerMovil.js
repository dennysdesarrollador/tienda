
// src/hooks/useEscanerMovil.js
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"

export function useEscanerMovil() {
  const [codigo, setCodigo] = useState("")

  useEffect(() => {
    const channel = supabase
      .channel("realtime:escaneos")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "escaneos" },
        async (payload) => {
          const code = payload.new.codigo_barra
          setCodigo(code)

          // Opcional: limpiar la tabla después de procesar
          await supabase.from("escaneos").delete().eq("id", payload.new.id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return codigo
}
