import Image from "next/image"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"

type HeroProps = {
  image: string
  heading?: string
  paragraph?: string
  buttons?: {
    label: string
    path: string
  }[]
}

export const Hero = ({ image, heading, paragraph, buttons }: HeroProps) => {
  return (
    <div className="relative w-full overflow-hidden rounded-xl shadow-sm group">
      {/* Wildberries/Amazon Style:
         - Fixed height on desktop (e.g., 350px)
         - Responsive height on mobile (aspect ratio)
         - Image covers the area
      */}
      <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[380px]">
        <Image
          src={image}
          alt="Banner"
          fill
          className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
          priority
        />

        {/* Optional: Dark overlay if you decide to add text later, otherwise transparent */}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      {/* Content Overlay (Only renders if text exists) */}
      {(heading || paragraph) && (
        <div className="absolute inset-0 flex flex-col justify-center items-start p-8 sm:p-12 lg:p-16 z-10">
          <div className="max-w-lg bg-white/80 backdrop-blur-md p-6 rounded-lg shadow-lg">
            {heading && (
              <h1 className="heading-md sm:heading-lg text-brand-900 mb-2">
                {heading}
              </h1>
            )}
            {paragraph && (
              <p className="text-secondary text-md sm:text-lg mb-6">
                {paragraph}
              </p>
            )}
            {buttons && buttons.length > 0 && (
              <div className="flex gap-4">
                {buttons.map((btn, index) => (
                  <LocalizedClientLink key={index} href={btn.path}>
                    <Button variant={index === 0 ? "filled" : "tonal"}>
                      {btn.label}
                    </Button>
                  </LocalizedClientLink>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}