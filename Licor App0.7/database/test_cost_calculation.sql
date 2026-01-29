-- TEST SCRIPT: Insert sample cost data and verify calculations
-- Run this AFTER creating the table and having some products in your database

-- INSTRUCTIONS:
-- 1. Replace 'YOUR_ORGANIZATION_ID' with your actual organization_id
-- 2. Replace 'YOUR_PRODUCT_ID' with an actual product_id from your products table
-- 3. Run this script
-- 4. Check the app to see if costs appear correctly

-- ===========================================
-- STEP 1: Get your organization_id and a product_id
-- ===========================================
-- Run this first to get your IDs:
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.organization_id
FROM products p
LIMIT 10;

-- ===========================================
-- STEP 2: Insert sample cost data
-- ===========================================
-- Replace the UUIDs below with actual values from STEP 1

-- Example: Insert cost for a "Caja" (Box) of beer
INSERT INTO cost_prices (organization_id, product_id, emission, subtype, cost)
VALUES 
    (
        'YOUR_ORGANIZATION_ID'::uuid,  -- Replace with actual org ID
        'YOUR_PRODUCT_ID'::uuid,       -- Replace with actual product ID
        'Caja',                         -- Emission type
        'Botella',                      -- Subtype
        20.00                           -- Cost: $20 per box
    )
ON CONFLICT (organization_id, product_id, emission, subtype) 
DO UPDATE SET 
    cost = EXCLUDED.cost,
    updated_at = NOW();

-- ===========================================
-- STEP 3: Verify the data was inserted
-- ===========================================
SELECT 
    cp.id,
    p.name as product_name,
    cp.emission,
    cp.subtype,
    cp.cost,
    cp.created_at
FROM cost_prices cp
JOIN products p ON cp.product_id = p.id
ORDER BY cp.created_at DESC;

-- ===========================================
-- STEP 4: Calculate expected unit cost
-- ===========================================
-- This shows what the app should calculate
-- Assuming Caja = 36 units (default)

SELECT 
    p.name as product_name,
    cp.emission,
    cp.cost as cost_per_emission,
    36 as units_in_caja,  -- Change if your Caja has different unit count
    (cp.cost / 36.0) as calculated_unit_cost,
    (cp.cost / 36.0) * 18 as cost_for_media_caja,  -- Media Caja = 18 units
    (cp.cost / 36.0) * 1 as cost_per_single_unit
FROM cost_prices cp
JOIN products p ON cp.product_id = p.id
WHERE cp.emission = 'Caja';

-- ===========================================
-- EXPECTED RESULTS EXAMPLE:
-- ===========================================
-- If you inserted cost of $20 for a Caja (36 units):
-- - Unit cost: $0.5555...
-- - Media Caja (18 units): $10.00
-- - Single unit: $0.56
-- ===========================================
