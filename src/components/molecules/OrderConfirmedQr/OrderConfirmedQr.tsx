"use client"
import { QRCodeSVG } from "qrcode.react"

// ✅ Agregamos title? al tipo de las props
export const OrderConfirmedQr = ({
                                     code,
                                     token,
                                     title
                                 }: {
    code: string;
    token: string;
    title?: string;
}) => {
    if (!code) return null

    return (
        <div className="bg-white p-6 rounded-xl border border-ui-border-base shadow-sm text-center my-6">
            {/* ✅ Usamos el título dinámico o el default si no viene */}
            <h3 className="text-lg font-bold text-ui-fg-base mb-2">
                {title || "Tu Código de Entrega"}
            </h3>

            <p className="text-sm text-ui-fg-subtle mb-4">
                Muestra este código al repartidor para recibir tu pedido.
            </p>

            <div className="flex justify-center mb-4">
                <QRCodeSVG
                    value={token || code}
                    size={160}
                    className="border-4 border-white shadow-sm"
                />
            </div>

            <div className="inline-block bg-ui-bg-subtle px-4 py-2 rounded-md">
        <span className="font-mono text-2xl font-bold tracking-widest text-ui-fg-base">
          {code}
        </span>
            </div>
            <p className="text-xs text-ui-fg-muted mt-2">Guárdalo o haz una captura de pantalla</p>
        </div>
    )
}