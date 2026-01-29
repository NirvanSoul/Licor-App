-- NUCLEAR RESET: Licor-App Database (Updated)
-- ==========================================================
-- WARNING: This will delete ALL users, organizations, products, 
-- sales, and inventory data permanently. 

-- 1. TRUNCATE ALL PUBLIC TABLES (Handles cross-references in public schema)
-- We list the most referenced tables or use CASCADE to be sure.
TRUNCATE 
    public.analytics_events,
    public.inventory_history,
    public.waste_reports,
    public.organization_join_requests,
    public.profiles,
    public.order_items,
    public.orders,
    public.pending_orders,
    public.inventory,
    public.prices,
    public.cost_prices,
    public.products,
    public.emission_types,
    public.organization_settings,
    public.license_keys,
    public.organizations
CASCADE;

-- 2. DELETE ALL USERS (Now safe from Foreign Key conflicts)
DELETE FROM auth.users;

-- 3. CONFIRMATION
SELECT count(*) as "Remaining Users" FROM auth.users;
SELECT count(*) as "Remaining Orgs" FROM public.organizations;
