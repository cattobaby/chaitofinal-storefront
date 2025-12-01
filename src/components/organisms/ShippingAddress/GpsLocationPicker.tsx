"use client"

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet"
import type { LatLngExpression } from "leaflet"
import { locationMarkerIcon } from "@/lib/leaflet-setup"

type GpsLocationPickerProps = {
    latitude?: number | null
    longitude?: number | null
    onChange: (coords: { latitude: number; longitude: number }) => void
}

const DEFAULT_CENTER: LatLngExpression = [0, 0]

const ClickHandler = ({
                          onChange,
                      }: {
    onChange: (coords: { latitude: number; longitude: number }) => void
}) => {
    useMapEvents({
        click(e) {
            onChange({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
            })
        },
    })

    return null
}

const GpsLocationPicker = ({
                               latitude,
                               longitude,
                               onChange,
                           }: GpsLocationPickerProps) => {
    const hasCoords =
        typeof latitude === "number" &&
        !isNaN(latitude) &&
        typeof longitude === "number" &&
        !isNaN(longitude)

    const center: LatLngExpression = hasCoords
        ? [latitude as number, longitude as number]
        : DEFAULT_CENTER

    return (
        <div className="mt-4 flex flex-col gap-y-2">
            <div className="overflow-hidden rounded-md border border-gray-200">
                <MapContainer
                    center={center}
                    zoom={hasCoords ? 16 : 3}
                    style={{ height: "260px", width: "100%" }}
                    scrollWheelZoom
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <ClickHandler onChange={onChange} />
                    {hasCoords && (
                        <Marker
                            position={[latitude as number, longitude as number]}
                            icon={locationMarkerIcon}
                        />
                    )}
                </MapContainer>
            </div>
            <span className="text-xs text-gray-500">
        {hasCoords
            ? `Pin set at: ${latitude?.toFixed(6)}, ${longitude?.toFixed(6)}`
            : "Tap the map to set your exact delivery location (optional)."}
      </span>
        </div>
    )
}

export default GpsLocationPicker
