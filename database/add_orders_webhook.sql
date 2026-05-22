-- ====================================================================
-- ADD ORDERS WEBHOOK URL TO CHANNEL CONFIGURATIONS
-- Run this in Supabase SQL Editor
-- ====================================================================

ALTER TABLE public.channel_configurations
ADD COLUMN IF NOT EXISTS orders_webhook_url TEXT;

COMMENT ON COLUMN public.channel_configurations.orders_webhook_url IS 
  'n8n webhook URL for fetching customer orders from the e-commerce platform';
