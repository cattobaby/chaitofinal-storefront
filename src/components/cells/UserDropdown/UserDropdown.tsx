"use client"

import {
  Badge,
  Divider,
  LogoutButton,
  NavigationItem,
} from "@/components/atoms"
import { Dropdown } from "@/components/molecules"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { ProfileIcon } from "@/icons"
import { HttpTypes } from "@medusajs/types"
import { useUnreads } from "@talkjs/react"
import { useState } from "react"

export const UserDropdown = ({
                               user,
                             }: {
  user: HttpTypes.StoreCustomer | null
}) => {
  const [open, setOpen] = useState(false)
  const unreads = useUnreads()

  return (
    <div
      className="relative"
      onMouseOver={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
    >
      <LocalizedClientLink
        href="/user"
        className="relative block" // Added block for better hit area
        aria-label="Go to user profile"
      >
        {/* FIX: Changed color to white for the Purple Header */}
        <ProfileIcon color="white" size={24} />
      </LocalizedClientLink>

      {/* Dropdown Menu */}
      <Dropdown show={open} className="rounded-md shadow-xl border-none mt-2">
        {user ? (
          <div className="p-1 min-w-[200px]">
            <div className="px-4 py-3 border-b border-neutral-100 mb-1">
              <p className="text-xs text-neutral-500 font-medium">Hola,</p>
              <h3 className="heading-xs font-bold text-brand-700 truncate max-w-[180px]">
                {user.first_name || "Usuario"}
              </h3>
            </div>
            <NavigationItem href="/user/orders">Mis Pedidos</NavigationItem>
            <NavigationItem href="/user/messages" className="relative flex justify-between">
              Mensajes
              {Boolean(unreads?.length) && (
                <Badge className="ml-2 bg-red-500 text-white border-none h-5 px-1.5">
                  {unreads?.length}
                </Badge>
              )}
            </NavigationItem>
            <NavigationItem href="/user/wishlist">Favoritos</NavigationItem>
            <NavigationItem href="/user/addresses">Direcciones</NavigationItem>
            <NavigationItem href="/user/settings">Configuración</NavigationItem>
            <div className="border-t border-neutral-100 mt-1 pt-1">
              <LogoutButton />
            </div>
          </div>
        ) : (
          <div className="p-2 min-w-[160px]">
            <NavigationItem href="/user" className="font-semibold text-brand-700">Iniciar Sesión</NavigationItem>
            <NavigationItem href="/user/register">Registrarse</NavigationItem>
          </div>
        )}
      </Dropdown>
    </div>
  )
}