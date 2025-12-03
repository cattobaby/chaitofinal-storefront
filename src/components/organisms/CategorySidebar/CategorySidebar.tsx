"use client"

import { Fragment, useState } from "react"
import { Dialog, Transition } from "@headlessui/react"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"
import { HamburgerMenuIcon, XIcon, ArrowRightIcon } from "@/icons" // Ensure ChevronRightIcon exists or use ArrowRightIcon
import { cn } from "@/lib/utils"

type CategorySidebarProps = {
  parentCategories?: HttpTypes.StoreProductCategory[]
  childrenCategories?: HttpTypes.StoreProductCategory[]
}

export const CategorySidebar = ({
                                  parentCategories = [],
                                  childrenCategories = [],
                                }: CategorySidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const openSidebar = () => setIsOpen(true)
  const closeSidebar = () => setIsOpen(false)

  return (
    <>
      {/* --- TRIGGER BUTTON (The Hamburger) --- */}
      <button
        onClick={openSidebar}
        className="flex items-center gap-2 text-white hover:bg-white/10 px-3 py-2 rounded-full transition-colors focus:outline-none"
        aria-label="Abrir categorías"
      >
        <div className="p-1 border border-white/30 rounded-md">
          <HamburgerMenuIcon color="white" size={20} />
        </div>
      </button>

      {/* --- SIDEBAR DRAWER --- */}
      <Transition show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={closeSidebar}>

          {/* Backdrop (Dark overlay) */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-300 sm:duration-500"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-300 sm:duration-500"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col bg-white shadow-xl">

                      {/* Header of Sidebar */}
                      <div className="flex items-center justify-between px-4 py-6 bg-brand-700 text-white shadow-sm">
                        <h2 className="text-lg font-bold uppercase tracking-wider">
                          Chaito
                        </h2>
                        <button
                          type="button"
                          className="rounded-md text-white hover:text-white/80 focus:outline-none"
                          onClick={closeSidebar}
                        >
                          <span className="sr-only">Cerrar menú</span>
                          <XIcon color="white" size={24} />
                        </button>
                      </div>

                      {/* Content (Categories List) */}
                      <div className="flex-1 overflow-y-auto py-4 px-4 bg-neutral-50">
                        <div className="space-y-1">
                          {/* 'All Products' Link */}
                          <LocalizedClientLink
                            href="/store"
                            className="group flex items-center justify-between rounded-md px-3 py-3 text-base font-semibold text-neutral-900 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                            onClick={closeSidebar}
                          >
                            Ver todo el catálogo
                          </LocalizedClientLink>

                          <div className="h-px bg-neutral-200 my-2" />

                          {/* Categories Mapping */}
                          {parentCategories.map((category) => (
                            <div key={category.id} className="border-b border-neutral-100 last:border-0">
                              <LocalizedClientLink
                                href={`/categories/${category.handle}`}
                                className="group flex items-center justify-between rounded-md px-3 py-3 text-base font-medium text-neutral-700 hover:bg-white hover:text-brand-700 hover:shadow-sm transition-all"
                                onClick={closeSidebar}
                              >
                                <span>{category.name}</span>
                                {/* Optional: If you have a Chevron/Arrow icon */}
                                {/* <ChevronRightIcon className="h-4 w-4 text-neutral-400 group-hover:text-brand-700" /> */}
                              </LocalizedClientLink>

                              {/* Optional: Render children immediately below if desired, or keep it clean like Wildberries */}
                              {category.category_children && category.category_children.length > 0 && (
                                <div className="pl-6 pb-2 space-y-1">
                                  {category.category_children.map((child) => (
                                    <LocalizedClientLink
                                      key={child.id}
                                      href={`/categories/${child.handle}`}
                                      className="block py-1.5 text-sm text-neutral-500 hover:text-brand-600"
                                      onClick={closeSidebar}
                                    >
                                      {child.name}
                                    </LocalizedClientLink>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer of Sidebar (Optional: Links to account) */}
                      <div className="border-t border-neutral-200 px-4 py-6 bg-white">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <LocalizedClientLink href="/user/orders" className="text-xs font-medium text-neutral-500 hover:text-brand-700">
                            Mis Pedidos
                          </LocalizedClientLink>
                          <LocalizedClientLink href="/user/profile" className="text-xs font-medium text-neutral-500 hover:text-brand-700">
                            Mi Cuenta
                          </LocalizedClientLink>
                        </div>
                      </div>

                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}