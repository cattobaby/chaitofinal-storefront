"use client"

import { Badge } from "@/components/atoms"
import { MessageIcon } from "@/icons"
import LocalizedClientLink from "../LocalizedLink/LocalizedLink"
import { useUnreads } from "@talkjs/react"

export const MessageButton = () => {
  const unreads = useUnreads()

  return (
    <LocalizedClientLink href="/user/messages" className="relative block">
      {/* FIX: Color white for header contrast */}
      <MessageIcon color="white" size={24} />

      {Boolean(unreads?.length) && (
        <Badge className="absolute -top-1.5 -right-1.5 w-4 h-4 p-0 flex items-center justify-center bg-red-500 border-white border-2 text-white text-[9px]">
          {unreads?.length}
        </Badge>
      )}
    </LocalizedClientLink>
  )
}