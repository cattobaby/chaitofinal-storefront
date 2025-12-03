import LocalizedClientLink from "@/components/molecules/LocalizedLink/LocalizedLink"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    // 1. Full width background, Dark Chaito Purple
    <footer className="w-full bg-brand-900 text-white mt-auto">

      {/* 2. Container for content alignment */}
      <div className="container mx-auto px-4 lg:px-8 pt-12 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">

          {/* --- Column 1: About --- */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-bold uppercase tracking-wider text-white">
              Sobre Chaito
            </h3>
            <nav className="flex flex-col gap-2 text-sm text-white/70">
              <LocalizedClientLink href="/about" className="hover:text-white transition-colors">
                Nuestra Historia
              </LocalizedClientLink>
              <LocalizedClientLink href="/careers" className="hover:text-white transition-colors">
                Trabaja con nosotros
              </LocalizedClientLink>
              <LocalizedClientLink href="/sell" className="hover:text-white transition-colors">
                Vender en Chaito
              </LocalizedClientLink>
              <LocalizedClientLink href="/blog" className="hover:text-white transition-colors">
                Blog
              </LocalizedClientLink>
            </nav>
          </div>

          {/* --- Column 2: Customer Service --- */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-bold uppercase tracking-wider text-white">
              Ayuda
            </h3>
            <nav className="flex flex-col gap-2 text-sm text-white/70">
              <LocalizedClientLink href="/order/track" className="hover:text-white transition-colors">
                Rastrear Pedido
              </LocalizedClientLink>
              <LocalizedClientLink href="/shipping" className="hover:text-white transition-colors">
                Envíos y Entregas
              </LocalizedClientLink>
              <LocalizedClientLink href="/returns" className="hover:text-white transition-colors">
                Devoluciones
              </LocalizedClientLink>
              <LocalizedClientLink href="/faq" className="hover:text-white transition-colors">
                Preguntas Frecuentes
              </LocalizedClientLink>
            </nav>
          </div>

          {/* --- Column 3: Legal --- */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-bold uppercase tracking-wider text-white">
              Legal
            </h3>
            <nav className="flex flex-col gap-2 text-sm text-white/70">
              <LocalizedClientLink href="/terms" className="hover:text-white transition-colors">
                Términos y Condiciones
              </LocalizedClientLink>
              <LocalizedClientLink href="/privacy" className="hover:text-white transition-colors">
                Política de Privacidad
              </LocalizedClientLink>
              <LocalizedClientLink href="/cookies" className="hover:text-white transition-colors">
                Política de Cookies
              </LocalizedClientLink>
            </nav>
          </div>

          {/* --- Column 4: Connect --- */}
          <div className="flex flex-col gap-4">
            <h3 className="text-md font-bold uppercase tracking-wider text-white">
              Síguenos
            </h3>
            <nav className="flex flex-col gap-2 text-sm text-white/70">
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                Facebook
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                Instagram
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                TikTok
              </a>
            </nav>
          </div>
        </div>

        {/* --- Bottom Bar --- */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/50">
            © {currentYear} Chaito Marketplace. Todos los derechos reservados.
          </p>

          {/* Optional: Payment Icons could go here */}
          <div className="flex gap-4 text-xs text-white/50">
            <span>Bolivia</span>
          </div>
        </div>

      </div>
    </footer>
  )
}