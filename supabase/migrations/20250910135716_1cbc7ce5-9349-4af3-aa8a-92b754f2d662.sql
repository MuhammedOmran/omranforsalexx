-- المرحلة الأولى: إضافة القيم الجديدة للـ enum
ALTER TYPE public.license_tier ADD VALUE IF NOT EXISTS 'monthly';
ALTER TYPE public.license_tier ADD VALUE IF NOT EXISTS 'quarterly';
ALTER TYPE public.license_tier ADD VALUE IF NOT EXISTS 'yearly';