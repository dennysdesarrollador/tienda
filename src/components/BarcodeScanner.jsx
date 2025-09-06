
import { useEffect, useRef } from "react"
import { BrowserMultiFormatReader } from "@zxing/browser"

export default function BarcodeScanner({ onDetected, onError }) {
  const videoRef = useRef(null)
  const codeReaderRef = useRef(null)

  useEffect(() => {
    const start = async () => {
      try {
        codeReaderRef.current = new BrowserMultiFormatReader()
        const devices = await BrowserMultiFormatReader.listVideoInputDevices()
        const deviceId = devices?.[0]?.deviceId
        await codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result) onDetected?.(result.getText())
            if (err && !(err?.name === "NotFoundException")) onError?.(err)
          }
        )
      } catch (e) {
        onError?.(e)
      }
    }
    start()
    return () => {
      codeReaderRef.current?.reset()
    }
  }, [])

  return (
    <div className="w-full">
      <video ref={videoRef} className="w-full rounded-lg shadow" />
      <p className="text-sm text-gray-600 mt-2 text-center">Apunta la cámara al código de barras</p>
    </div>
  )
}
