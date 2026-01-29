-- VERIFICATION SCRIPT: Check if cost_prices table is properly configured
-- Run this in Supabase SQL Editor after executing patch_create_cost_prices.sql

-- 1. Check if table exists
SELECT 
    'TABLE EXISTS' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'cost_prices'
        ) THEN '✅ YES' 
        ELSE '❌ NO' 
    END as result;

-- 2. Check table structure
SELECT 
    'COLUMNS' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'cost_prices' 
ORDER BY ordinal_position;

-- 3. Check constraints
SELECT 
    'CONSTRAINTS' as check_type,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'cost_prices';

-- 4. Check if RLS is enabled
SELECT 
    'ROW LEVEL SECURITY' as check_type,
    CASE 
        WHEN relrowsecurity THEN '✅ ENABLED' 
        ELSE '❌ DISABLED' 
    END as result
FROM pg_class 
WHERE relname = 'cost_prices';

-- 5. Check RLS policies
SELECT 
    'RLS POLICIES' as check_type,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'cost_prices';

-- 6. Check indexes
SELECT 
    'INDEXES' as check_type,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'cost_prices';

-- 7. Check if table is in realtime publication
SELECT 
    'REALTIME PUBLICATION' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'cost_prices'
        ) THEN '✅ ENABLED' 
        ELSE '❌ NOT ENABLED' 
    END as result;

-- 8. Check replica identity
SELECT 
    'REPLICA IDENTITY' as check_type,
    CASE relreplident
        WHEN 'd' THEN '⚠️ DEFAULT (not optimal for realtime)'
        WHEN 'n' THEN '❌ NOTHING'
        WHEN 'f' THEN '✅ FULL (optimal)'
        WHEN 'i' THEN 'INDEX'
    END as result
FROM pg_class 
WHERE relname = 'cost_prices';

-- 9. Sample data check (if any)
SELECT 
    'DATA COUNT' as check_type,
    COUNT(*)::text || ' records' as result
FROM cost_prices;

-- 10. Sample of actual data (top 5 records)
SELECT 
    'SAMPLE DATA' as info,
    id,
    organization_id,
    product_id,
    emission,
    subtype,
    cost,
    created_at
FROM cost_prices 
ORDER BY created_at DESC 
LIMIT 5;

-- EXPECTED RESULTS:
-- ✅ Table should exist
-- ✅ Should have 8 columns
-- ✅ RLS should be enabled
-- ✅ Should have at least 1 RLS policy
-- ✅ Should have index on organization_id
-- ✅ Should be in realtime publication
-- ✅ Replica identity should be FULL
