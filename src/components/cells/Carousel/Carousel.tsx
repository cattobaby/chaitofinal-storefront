"use client"

import useEmblaCarousel from "embla-carousel-react"
import { Indicator } from "@/components/atoms"
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons"
import { useCallback, useEffect, useState } from "react"
import { EmblaCarouselType } from "embla-carousel"

export const CustomCarousel = ({
  variant = "light",
  items,
  align = "start",
}: {
  variant?: "light" | "dark"
  items: React.ReactNode[]
  align?: "center" | "start" | "end"
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align,
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const maxStep = items.length

  const onSelect = useCallback((api: EmblaCarouselType) => {
    setSelectedIndex(api.selectedScrollSnap())
  }, [])

  useEffect(() => {
    if (!emblaApi) return
    onSelect(emblaApi)
    emblaApi.on("reInit", onSelect).on("select", onSelect)
  }, [emblaApi, onSelect])

  const changeSlideHandler = useCallback(
    (index: number) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const arrowBtnClass =
    variant === "light" ? "text-primary" : "text-tertiary"

  return (
    <div className="embla relative w-full flex justify-center">
      <div
        className="embla__viewport overflow-hidden rounded-xs w-full xl:flex xl:justify-center"
        ref={emblaRef}
      >
        <div className="embla__container flex">{items.map((slide) => slide)}</div>

        <div className="flex justify-between items-center mt-4 sm:hidden">
          <div className="w-1/2">
            <Indicator variant={variant} maxStep={maxStep} step={selectedIndex + 1} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={arrowBtnClass}
              onClick={() => changeSlideHandler(selectedIndex - 1)}
              aria-label="Anterior"
            >
              <ArrowLeftIcon color="currentColor" />
            </button>
            <button
              type="button"
              className={arrowBtnClass}
              onClick={() => changeSlideHandler(selectedIndex + 1)}
              aria-label="Siguiente"
            >
              <ArrowRightIcon color="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
