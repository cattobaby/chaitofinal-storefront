"use client"
import {
  Badge,
  Card,
  Divider,
  LogoutButton,
  NavigationItem,
} from "@/components/atoms"
import { useUnreads } from "@talkjs/react"
import { usePathname } from "next/navigation"

const navigationItems = [
  {
    label: "Pedidos",
    href: "/user/orders",
  },
  {

    label: "Mensajes",
    href: "/user/messages",
  },
  {
    label: "Devoluciones",
    href: "/user/returns",
  },
  {
    label: "Direcciones",
    href: "/user/addresses",
  },
  {
    label: "Reseñas",
    href: "/user/reviews",
  },
  {
    label: "Lista de deseos",
    href: "/user/wishlist",
  },
]

export const UserNavigation = () => {
  const unreads = useUnreads()
  const path = usePathname()

  return (
    <Card className="h-min">
      {navigationItems.map((item) => (
        <NavigationItem
          key={item.label}
          href={item.href}
          active={path === item.href}
          className="relative"
        >
          {item.label}
          {item.label === "Mensajes" && Boolean(unreads?.length) && (
            <Badge className="absolute top-3 left-24 w-4 h-4 p-0">
              {unreads?.length}
            </Badge>
          )}
        </NavigationItem>
      ))}
      <Divider className="my-2" />
      <NavigationItem
        href={"/user/settings"}
        active={path === "/user/settings"}
      >
        Configuración
      </NavigationItem>
      <LogoutButton className="w-full text-left" />
    </Card>
  )
}
