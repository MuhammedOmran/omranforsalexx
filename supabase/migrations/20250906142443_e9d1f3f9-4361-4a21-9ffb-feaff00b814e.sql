-- Create shared_products table for storing shared product lists
CREATE TABLE public.shared_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  products JSONB NOT NULL,
  display_option TEXT NOT NULL,
  creator_user_id UUID,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_views INTEGER,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for shared_products table
ALTER TABLE public.shared_products ENABLE ROW LEVEL SECURITY;

-- Policy for creating shared products (authenticated users only)
CREATE POLICY "Users can create shared products" 
ON public.shared_products 
FOR INSERT 
WITH CHECK (auth.uid() = creator_user_id);

-- Policy for viewing shared products (public access for valid shares)
CREATE POLICY "Anyone can view non-expired shared products" 
ON public.shared_products 
FOR SELECT 
USING (
  now() <= expires_at AND 
  (max_views IS NULL OR views < max_views)
);

-- Policy for updating view count (public access)
CREATE POLICY "Anyone can update view count" 
ON public.shared_products 
FOR UPDATE 
USING (
  now() <= expires_at AND 
  (max_views IS NULL OR views < max_views)
)
WITH CHECK (
  now() <= expires_at AND 
  (max_views IS NULL OR views < max_views)
);

-- Policy for deleting shared products (creators only)
CREATE POLICY "Users can delete their own shared products" 
ON public.shared_products 
FOR DELETE 
USING (auth.uid() = creator_user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_shared_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shared_products_updated_at
BEFORE UPDATE ON public.shared_products
FOR EACH ROW
EXECUTE FUNCTION public.update_shared_products_updated_at();

-- Create index for faster lookups
CREATE INDEX idx_shared_products_share_id ON public.shared_products(share_id);
CREATE INDEX idx_shared_products_expires_at ON public.shared_products(expires_at);
CREATE INDEX idx_shared_products_creator ON public.shared_products(creator_user_id);