'use client'

import { useEffect, useState } from 'react'
import { supabase, Product, BRANDS, DEFAULT_CATEGORY_ORDER, fetchCategoryOrder, saveCategoryOrder } from '@/lib/supabase'


function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  async function submit() {
    if ((await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) })).ok) {
      localStorage.setItem('cosae_admin_auth', 'true')
      onLogin()
    } else {
      setError(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h1 className="font-sans text-xl font-bold text-gray-800 text-center mb-1">Admin COSAE 2026</h1>
        <p className="text-center text-xs text-gray-400 mb-6">Dental Medrano</p>
        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError(false) }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Contraseña"
          className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${error ? 'border-red-400 focus:ring-red-200' : 'border-gray-200 focus:ring-[#f15922]/30'}`}
        />
        {error && <p className="text-red-500 text-xs mt-2">Contraseña incorrecta</p>}
        <button onClick={submit} className="mt-4 w-full bg-[#f15922] text-white font-semibold py-2.5 rounded-lg text-sm">
          Ingresar
        </button>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [checked, setChecked] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [catItems, setCatItems] = useState<{ original: string; label: string }[]>(
    DEFAULT_CATEGORY_ORDER.map(c => ({ original: c, label: c }))
  )
  const [catSaving, setCatSaving] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('cosae_admin_auth') === 'true') setAuthed(true)
    setChecked(true)
  }, [])

  useEffect(() => {
    if (authed) {
      fetchProducts()
      loadCategoryOrder()
    }
  }, [authed])

  async function loadCategoryOrder() {
    const order = await fetchCategoryOrder()
    setCatItems(order.map(c => ({ original: c, label: c })))
  }

  function moveCategory(index: number, dir: -1 | 1) {
    setCatItems(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function renameCategory(index: number, newLabel: string) {
    setCatItems(prev => prev.map((it, i) => i === index ? { ...it, label: newLabel } : it))
  }

  async function persistCategoryOrder() {
    setCatSaving(true)
    // Por cada categoría renombrada, actualizar todos los productos que la usan
    for (const item of catItems) {
      if (item.label.trim() && item.label !== item.original) {
        await supabase.from('cosae_products').update({ category: item.label }).eq('category', item.original)
      }
    }
    await saveCategoryOrder(catItems.map(i => i.label))
    await loadCategoryOrder()
    await fetchProducts()
    setCatSaving(false)
  }

  async function fetchProducts() {
    setLoading(true)
    const { data } = await supabase.from('cosae_products').select('*').order('sort_order')
    setProducts(data || [])
    setLoading(false)
  }

  async function saveProduct(p: Product) {
    const { id, ...rest } = p
    await supabase.from('cosae_products').update(rest).eq('id', id)
    setEditing(null)
    fetchProducts()
  }

  async function uploadImage(productId: string, file: File) {
    const path = `${productId}.jpg`
    const { error } = await supabase.storage.from('cosae-product-images').upload(path, file, { upsert: true, contentType: file.type })
    if (error) { alert('Error subiendo imagen: ' + error.message); return }
    const { data } = supabase.storage.from('cosae-product-images').getPublicUrl(path)
    await supabase.from('cosae_products').update({ image_url: data.publicUrl }).eq('id', productId)
    fetchProducts()
  }

  async function toggleActive(p: Product) {
    await supabase.from('cosae_products').update({ active: !p.active }).eq('id', p.id)
    fetchProducts()
  }

  if (!checked) return null
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="font-sans font-bold text-gray-800">Admin COSAE 2026</h1>
          <button
            onClick={() => { localStorage.removeItem('cosae_admin_auth'); setAuthed(false) }}
            className="text-xs text-gray-400"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-screen-xl mx-auto px-4 py-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <h2 className="font-sans font-bold text-gray-800 text-sm mb-1">Grupos de la landing</h2>
          <p className="text-[11px] text-gray-400 mb-3">Cambiá el orden con las flechas o editá el nombre directamente. Al renombrar, se actualiza en todos los productos de ese grupo.</p>
          <div className="space-y-1.5">
            {catItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400 w-5">{i + 1}.</span>
                <input
                  value={item.label}
                  onChange={e => renameCategory(i, e.target.value)}
                  className="text-xs font-medium text-gray-700 flex-1 bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#f15922]/30"
                />
                <button
                  onClick={() => moveCategory(i, -1)}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 disabled:opacity-30 flex items-center justify-center shrink-0"
                >↑</button>
                <button
                  onClick={() => moveCategory(i, 1)}
                  disabled={i === catItems.length - 1}
                  className="w-7 h-7 rounded-full bg-white border border-gray-200 text-gray-500 disabled:opacity-30 flex items-center justify-center shrink-0"
                >↓</button>
              </div>
            ))}
          </div>
          <button
            onClick={persistCategoryOrder}
            disabled={catSaving}
            className="mt-3 w-full bg-[#f15922] text-white font-semibold py-2.5 rounded-lg text-sm disabled:opacity-60"
          >
            {catSaving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-full px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#f15922]/30"
        />

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#f15922] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
            {filtered.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <label className="shrink-0 w-14 h-14 bg-gray-50 rounded-lg flex items-center justify-center cursor-pointer overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[9px] text-gray-300 text-center px-1">Subir foto</span>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && uploadImage(p.id, e.target.files[0])}
                  />
                </label>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400">{p.category || 'Sin categoría'} · {p.brand} · ${p.price_normal?.toLocaleString('es-AR')}{p.has_promo ? ` · ${p.promo_text || (p.promo_pct ? Math.round(p.promo_pct*100)+'% off' : '')}` : ''}</p>
                </div>
                <button
                  onClick={() => toggleActive(p)}
                  className={`text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                >
                  {p.active ? 'Activo' : 'Oculto'}
                </button>
                <button
                  onClick={() => setEditing(p)}
                  className="text-[11px] font-semibold text-[#f15922] shrink-0"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setEditing(null)} />
          <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 space-y-3">
            <h2 className="font-sans font-bold text-gray-800 mb-2">Editar producto</h2>
            <div>
              <label className="text-xs text-gray-500">Nombre</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.name}
                onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Marca</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.brand}
                onChange={e => setEditing({ ...editing, brand: e.target.value })}>
                {BRANDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Categoría (sección de la landing)</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.category ?? ''}
                onChange={e => setEditing({ ...editing, category: e.target.value || null })}>
                {catItems.map(c => <option key={c.label} value={c.label}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Precio normal</label>
              <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.price_normal ?? ''}
                onChange={e => setEditing({ ...editing, price_normal: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={editing.has_promo} onChange={e => setEditing({ ...editing, has_promo: e.target.checked })} />
              Tiene promoción
            </label>
            {editing.has_promo && (
              <>
                <div>
                  <label className="text-xs text-gray-500">% de descuento (ej 0.1 = 10%)</label>
                  <input type="number" step="0.01" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.promo_pct ?? ''}
                    onChange={e => setEditing({ ...editing, promo_pct: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Texto de promo (ej "2x1")</label>
                  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.promo_text ?? ''}
                    onChange={e => setEditing({ ...editing, promo_text: e.target.value || null })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Precio final (si corresponde)</label>
                  <input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mt-1" value={editing.price_promo ?? ''}
                    onChange={e => setEditing({ ...editing, price_promo: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 text-gray-600 font-semibold py-2.5 rounded-lg text-sm">Cancelar</button>
              <button onClick={() => saveProduct(editing)} className="flex-1 bg-[#f15922] text-white font-semibold py-2.5 rounded-lg text-sm">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
