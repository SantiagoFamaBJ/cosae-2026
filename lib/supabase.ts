import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Product = {
  id: string
  name: string
  brand: string
  category: string | null
  image_url: string | null
  price_normal: number | null
  has_promo: boolean
  promo_pct: number | null   // ej 0.1 = 10% off
  promo_text: string | null  // ej '2x1', 'x2 de regalo'
  price_promo: number | null // precio final si promo_pct aplica
  sort_order: number
  active: boolean
  created_at: string
}

export const BRANDS = ['Densell', 'Easydent', 'Coltene', 'GDK', 'Otros'] as const

// Orden de las secciones en la landing, igual al folleto impreso
export const CATEGORY_ORDER = [
  'Limas mecanizadas',
  'Equipamiento',
  'Línea Densell',
  'Trabajá con mayor precisión',
  'Línea Coxo',
  'Línea Coltene',
  'Obturación',
  'Instrumentación aux.',
  'Ensanchadores',
  'Otros',
]

export const WHATSAPP_NUMBER = '5491164294000'
