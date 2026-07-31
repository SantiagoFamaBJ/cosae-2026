-- COSAE 2026 - tabla de productos
-- Ejecutar en Supabase SQL editor (proyecto larqxmgyutqiktsforgz)
-- Prefijo cosae_ para no chocar con otras apps

CREATE TABLE IF NOT EXISTS cosae_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text NOT NULL DEFAULT 'Otros',
  image_url text,
  price_normal numeric,
  has_promo boolean NOT NULL DEFAULT false,
  promo_pct numeric,          -- ej 0.1 = 10% off
  promo_text text,            -- ej '2x1', 'x2 de regalo'
  price_promo numeric,        -- precio final si promo_pct aplica
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cosae_products DISABLE ROW LEVEL SECURITY;

-- Pedidos (opcional, para guardar consultas de WhatsApp si se quiere historial)
CREATE TABLE IF NOT EXISTS cosae_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  items jsonb NOT NULL,
  total numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cosae_orders DISABLE ROW LEVEL SECURITY;

SELECT pg_notify('pgrst', 'reload schema');
