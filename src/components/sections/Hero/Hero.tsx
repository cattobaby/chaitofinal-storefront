"use client" // Mark as Client Component for interactivity

import { useState, useEffect } from "react"
import Image from "next/image"
import { Button } from "@/components/atoms"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { cn } from "@/lib/utils"
import { ArrowLeftIcon, ArrowRightIcon } from "@/icons" // Ensure icons exist

type HeroProps = {
    // We now accept 'images' array. 'image' is kept for backward compatibility.
    images?: string[]
    image?: string
    heading?: string
    paragraph?: string
    buttons?: {
        label: string
        path: string
    }[]
}

export const Hero = ({
                         images,
                         image,
                         heading,
                         paragraph,
                         buttons
                     }: HeroProps) => {
    // Combine props into a single list, prioritizing the array
    const slides = images && images.length > 0 ? images : [image || ""]

    const [currentSlide, setCurrentSlide] = useState(0)

    // Auto-play functionality
    useEffect(() => {
        if (slides.length <= 1) return

        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length)
        }, 5000) // Change slide every 5 seconds

        return () => clearInterval(interval)
    }, [slides.length])

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % slides.length)
    }

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1))
    }

    return (
        <div className="relative w-full overflow-hidden rounded-xl shadow-sm group bg-neutral-100">

            {/* --- CAROUSEL TRACK --- */}
            {/* Height matches Marketplace style: Thin on desktop, proportionate on mobile */}
            <div className="relative w-full h-[200px] sm:h-[300px] lg:h-[380px]">
                {slides.map((src, index) => (
                    <div
                        key={index}
                        className={cn(
                            "absolute inset-0 w-full h-full transition-opacity duration-700 ease-in-out",
                            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
                        )}
                    >
                        <Image
                            src={src}
                            alt={`Banner ${index + 1}`}
                            fill
                            className="object-cover object-center"
                            priority={index === 0}
                        />
                        {/* Optional Overlay for text readability if needed */}
                        <div className="absolute inset-0 bg-black/5" />
                    </div>
                ))}
            </div>

            {/* --- NAVIGATION ARROWS (Visible on Hover) --- */}
            {slides.length > 1 && (
                <>
                    <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Diapositiva anterior"
                    >
                        <ArrowLeftIcon size={20} />
                    </button>
                    <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/80 hover:bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Diapositiva siguiente"
                    >
                        <ArrowRightIcon size={20} />
                    </button>

                    {/* --- DOTS INDICATORS --- */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all shadow-sm",
                                    index === currentSlide
                                        ? "bg-white w-6"
                                        : "bg-white/60 hover:bg-white/80"
                                )}
                                aria-label={`Ir a la diapositiva ${index + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* --- CONTENT OVERLAY --- */}
            {/* Only renders if text exists. Stays on top of all slides. */}
            {(heading || paragraph) && (
                <div className="absolute inset-0 flex flex-col justify-center items-start p-8 sm:p-12 lg:p-16 z-30 pointer-events-none">
                    <div className="max-w-lg bg-white/90 backdrop-blur-sm p-6 rounded-lg shadow-lg pointer-events-auto">
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