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

// Orden por defecto (fallback si todavía no se guardó nada en cosae_settings)
export const DEFAULT_CATEGORY_ORDER = [
  'Limas mecanizadas',
  'Equipamiento',
  'Línea Coltene',
  'Línea Densell',
  'Trabajá con mayor precisión',
  'Línea Coxo',
  'Obturación',
  'Instrumentación aux.',
  'Ensanchadores',
  'Otros',
]

// Trae el orden de categorías guardado en Supabase (editable desde /admin)
export async function fetchCategoryOrder(): Promise<string[]> {
  const { data } = await supabase
    .from('cosae_settings')
    .select('value')
    .eq('key', 'category_order')
    .maybeSingle()
  if (data?.value && Array.isArray(data.value)) return data.value as string[]
  return DEFAULT_CATEGORY_ORDER
}

export async function saveCategoryOrder(order: string[]) {
  return supabase
    .from('cosae_settings')
    .upsert({ key: 'category_order', value: order })
}

export const WHATSAPP_NUMBER = '5491164294000'
