-- Add color column to products table if it doesn't exist
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#FFBC00';

-- Comment explaining the column usage
COMMENT ON COLUMN products.color IS 'Hex color code for the product visualization (e.g., #FFBC00)';
