'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import { supabase, Product, WHATSAPP_NUMBER, fetchCategoryOrder, DEFAULT_CATEGORY_ORDER } from '@/lib/supabase'

type CartItem = { product: Product; qty: number }

function formatPrice(n: number | null) {
  if (n == null) return ''
  return n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
}

// ─── Product Card ────────────────────────────────────────────────────────────
function ProductCard({ product, onAdd }: { product: Product; onAdd: (p: Product) => void }) {
  const hasPromoPrice = product.has_promo && product.price_promo != null
  const displayPrice = hasPromoPrice ? product.price_promo! : product.price_normal

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
      <div className="relative aspect-square bg-gray-50 flex items-center justify-center p-3">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-contain p-2" />
        ) : (
          <span className="text-gray-300 text-xs">Sin imagen</span>
        )}
        {product.has_promo && (
          <span className="absolute top-2 left-2 bg-[#f15922] text-white text-[10px] font-bold px-2 py-1 rounded-full">
            {product.promo_pct ? `${Math.round(product.promo_pct * 100)}% OFF` : 'PROMO'}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-xs font-medium text-gray-800 leading-snug line-clamp-3 min-h-[2.5rem]">
          {product.name}
        </h3>

        {product.promo_text && (
          <p className="text-[11px] text-[#f15922] font-semibold mt-1 leading-tight">{product.promo_text}</p>
        )}

        <div className="mt-auto pt-2">
          {hasPromoPrice ? (
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-[#f15922] font-bold text-sm">{formatPrice(displayPrice)}</span>
              <span className="text-gray-400 text-[11px] line-through">{formatPrice(product.price_normal)}</span>
            </div>
          ) : (
            <span className="font-bold text-sm text-gray-800">{formatPrice(displayPrice)}</span>
          )}
          <button
            onClick={() => onAdd(product)}
            className="mt-2 w-full bg-[#f15922] hover:bg-[#d94a15] text-white text-xs font-semibold py-2 rounded-lg transition-colors"
          >
            Agregar al pedido
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────
function CategorySection({ title, products, onAdd }: { title: string; products: Product[]; onAdd: (p: Product) => void }) {
  if (products.length === 0) return null
  return (
    <section className="mb-8">
      <div className="bg-[#f15922] rounded-xl px-4 py-2.5 mb-3">
        <h2 className="font-sans text-white font-bold text-sm sm:text-base uppercase tracking-wide">{title}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {products.map(p => <ProductCard key={p.id} product={p} onAdd={onAdd} />)}
      </div>
    </section>
  )
}

export default function Home() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [categoryOrder, setCategoryOrder] = useState<string[]>(DEFAULT_CATEGORY_ORDER)

  useEffect(() => {
    fetchProducts()
    fetchCategoryOrder().then(setCategoryOrder)
  }, [])

  async function fetchProducts() {
    const { data } = await supabase
      .from('cosae_products')
      .select('*')
      .eq('active', true)
      .order('sort_order')
    setProducts(data || [])
    setLoading(false)
  }

  const filtered = useMemo(() => {
    if (!search) return products
    return products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
  }, [products, search])

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>()
    filtered.forEach(p => {
      const cat = p.category || 'Otros'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    })
    return categoryOrder
      .filter(cat => map.has(cat))
      .map(cat => ({ category: cat, items: map.get(cat)! }))
  }, [filtered, categoryOrder])

  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.product.id === product.id)
      if (existing) {
        return prev.map(i => i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      }
      return [...prev, { product, qty: 1 }]
    })
    setCartOpen(true)
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      setCart(prev => prev.filter(i => i.product.id !== id))
    } else {
      setCart(prev => prev.map(i => i.product.id === id ? { ...i, qty } : i))
    }
  }

  const cartCount = cart.reduce((a, i) => a + i.qty, 0)

  function sendWhatsApp() {
    const lines = cart.map(i => {
      const price = i.product.has_promo && i.product.price_promo != null ? i.product.price_promo : i.product.price_normal
      return `• ${i.product.name} x${i.qty} - ${formatPrice(price)}`
    })
    const msg = `¡Hola! Quiero consultar por estos productos de la promo COSAE 2026:\n\n${lines.join('\n')}\n\n¿Me pasan disponibilidad y forma de pago?`
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank')
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <Image src="/logos/dental-medrano.png" alt="Dental Medrano" width={140} height={36} className="h-8 sm:h-9 w-auto object-contain" />
            <div className="hidden sm:flex items-center gap-5">
              <Image src="/logos/cosae.png" alt="COSAE" width={90} height={40} className="h-8 w-auto object-contain" />
              <Image src="/logos/sae.png" alt="SAE" width={70} height={40} className="h-7 w-auto object-contain" />
              <Image src="/logos/aoa.png" alt="Asociación Odontológica Argentina" width={90} height={40} className="h-8 w-auto object-contain" />
            </div>
          </div>
          <button
            onClick={() => setCartOpen(true)}
            className="relative bg-[#f15922] text-white text-sm font-semibold px-4 py-2 rounded-full flex items-center gap-2 shrink-0"
          >
            🛒 Pedido
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-white text-[#f15922] text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border border-[#f15922]">
                {cartCount}
              </span>
            )}
          </button>
        </div>
        {/* Logos institucionales en mobile, debajo */}
        <div className="sm:hidden flex items-center justify-center gap-5 px-4 pb-3">
          <Image src="/logos/cosae.png" alt="COSAE" width={80} height={36} className="h-7 w-auto object-contain" />
          <Image src="/logos/sae.png" alt="SAE" width={60} height={36} className="h-6 w-auto object-contain" />
          <Image src="/logos/aoa.png" alt="Asociación Odontológica Argentina" width={80} height={36} className="h-7 w-auto object-contain" />
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#f15922] to-[#d94a15] text-white text-center px-4 py-10">
        <h1 className="font-sans text-2xl sm:text-3xl font-extrabold tracking-tight">Promociones COSAE 2026</h1>
        <p className="mt-2 text-sm sm:text-base text-white/90 max-w-md mx-auto">
          Aprovechá descuentos exclusivos en materiales dentales, endodoncia y más — solo en nuestro stand.
        </p>
        <p className="mt-3 text-xs text-white/70">5 al 8 de agosto de 2026</p>
      </section>

      {/* Search */}
      <div className="max-w-screen-xl mx-auto px-4 py-4">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f15922]/30"
        />
      </div>

      {/* Grouped sections */}
      <main className="max-w-screen-xl mx-auto px-4 pb-24">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#f15922] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : grouped.length === 0 ? (
          <p className="text-center py-20 text-gray-400 text-sm">No se encontraron productos</p>
        ) : (
          grouped.map(g => (
            <CategorySection key={g.category} title={g.category} products={g.items} onAdd={addToCart} />
          ))
        )}
      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCartOpen(false)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h2 className="font-sans font-bold text-gray-800">Tu pedido</h2>
              <button onClick={() => setCartOpen(false)} className="text-gray-400 text-xl leading-none">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-10">Todavía no agregaste productos</p>
              ) : (
                cart.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{item.product.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => updateQty(item.product.id, item.qty - 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold">−</button>
                      <span className="w-5 text-center text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.product.id, item.qty + 1)} className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold">+</button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={sendWhatsApp}
                  className="w-full bg-[#25D366] text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                  Consultar por WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 px-4 py-6 mt-6">
        <div className="max-w-screen-xl mx-auto text-center space-y-2">
          <Image src="/logos/dental-medrano.png" alt="Dental Medrano" width={120} height={30} className="h-7 w-auto object-contain mx-auto opacity-50" />
          <p className="text-[10px] text-gray-400 leading-relaxed max-w-sm mx-auto">
            Imágenes de carácter ilustrativo. Promociones válidas del 05/08/2026 hasta el 08/08/2026 o hasta agotar stock, exclusivas en la COSAE 2026 en el stand de Dental Medrano. Los precios incluyen IVA.
          </p>
          <p className="text-[10px] text-gray-400">
            Consultas: <a href="tel:+5491164294000" className="text-[#f15922]">+54 9 11 6429-4000</a>
          </p>
        </div>
      </footer>
    </div>
  )
}
