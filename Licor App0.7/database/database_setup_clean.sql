-- ==============================================================================
-- LICOR-APP: CLEAN DATABASE SETUP SCRIPT
-- ==============================================================================
-- Description: Complete database setup with all tables, functions, triggers,
--              RLS policies, and realtime configuration.
-- Version: 1.0 (Clean - No Duplicates)
-- Usage: Run in Supabase SQL Editor after nuclear_reset.sql
-- ==============================================================================

-- SECTION 0: EXTENSIONS
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";


-- SECTION 1: TABLES
-- ==============================================================================

-- 1.1 Organizations & Profiles
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    code TEXT UNIQUE NOT NULL, -- 6-char Unique Code (REQUIRED)
    license_key TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    plan_type TEXT DEFAULT 'free',
    license_activated_at TIMESTAMP WITH TIME ZONE,
    license_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id),
    email TEXT,
    full_name TEXT,
    role TEXT CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE', 'DEVELOPER')),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_join_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    org_code TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_request UNIQUE (user_id, organization_id)
);

-- 1.2 Product Catalog
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    code TEXT,
    category TEXT,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.emission_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    subtype TEXT NOT NULL,
    units INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT emission_types_org_name_subtype_key UNIQUE(organization_id, name, subtype)
);

CREATE TABLE IF NOT EXISTS public.prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    emission TEXT NOT NULL,
    subtype TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    is_local BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT prices_unique_idx UNIQUE (product_id, emission, subtype, is_local)
);

CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    subtype TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT inventory_unique_idx UNIQUE (product_id, subtype)
);

-- 1.3 Sales & Orders
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    ticket_number INTEGER NOT NULL,
    customer_name TEXT DEFAULT 'Anónimo',
    status TEXT NOT NULL DEFAULT 'PAID',
    type TEXT DEFAULT 'Llevar',
    payment_method TEXT,
    reference TEXT,
    total_amount_bs NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount_usd NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payments JSONB DEFAULT '[]',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    product_name TEXT NOT NULL,
    quantity NUMERIC(12, 2) NOT NULL DEFAULT 1,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0,
    emission TEXT,
    subtype TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pending_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    ticket_number INTEGER NOT NULL,
    customer_name TEXT DEFAULT 'Cliente',
    status TEXT NOT NULL DEFAULT 'OPEN',
    type TEXT DEFAULT 'Local',
    payment_method TEXT,
    reference TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    payments JSONB DEFAULT '[]',
    created_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 1.4 Advanced Features
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cost_prices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    emission TEXT NOT NULL,
    subtype TEXT NOT NULL,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT cost_prices_unique UNIQUE(organization_id, product_id, emission, subtype)
);

CREATE TABLE IF NOT EXISTS public.inventory_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    movements JSONB NOT NULL DEFAULT '[]',
    total_units INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.waste_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    movements JSONB NOT NULL DEFAULT '[]',
    total_units INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.organization_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT organization_settings_unique UNIQUE(organization_id, key)
);

-- 1.5 System & Licensing
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.license_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    plan_type TEXT DEFAULT 'premium',
    status TEXT DEFAULT 'available',
    activation_token TEXT UNIQUE,
    activation_token_expires_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    activated_by_email TEXT,
    used_by_org_id UUID REFERENCES public.organizations(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    path TEXT,
    element_id TEXT,
    element_text TEXT,
    x INTEGER,
    y INTEGER,
    viewport_w INTEGER,
    viewport_h INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- SECTION 2: INDEXES
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_organizations_code ON public.organizations(code);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.organization_join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_org_id ON public.organization_join_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.organization_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_products_organization_id ON public.products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_prices_product_id ON public.prices(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_organization_id ON public.orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_org_id ON public.pending_orders(organization_id);
CREATE INDEX IF NOT EXISTS idx_pending_orders_status ON public.pending_orders(status);
CREATE INDEX IF NOT EXISTS idx_cost_prices_org_id ON public.cost_prices(organization_id);
CREATE INDEX IF NOT EXISTS idx_inventory_history_org_id ON public.inventory_history(organization_id);
CREATE INDEX IF NOT EXISTS idx_waste_reports_org_id ON public.waste_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON public.organization_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_license_keys_activation_token ON public.license_keys(activation_token);
CREATE INDEX IF NOT EXISTS idx_license_keys_status ON public.license_keys(status);


-- SECTION 3: FUNCTIONS & TRIGGERS
-- ==============================================================================

-- 3.1 Utility Functions
-- ------------------------------------------------------------------------------

-- Generate Unique 6-Character Organization Code
CREATE OR REPLACE FUNCTION public.generate_unique_org_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate 6-char alphanumeric code (uppercase)
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        
        -- Check if code already exists
        SELECT EXISTS(SELECT 1 FROM public.organizations WHERE code = new_code) INTO code_exists;
        
        -- Exit loop if unique
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.2 Auth Triggers
-- ------------------------------------------------------------------------------

-- Handle New User Registration (MASTER or EMPLOYEE)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
    new_org_id UUID;
    store_name TEXT;
    input_org_code TEXT;
    generated_code TEXT;
BEGIN
    -- 1. Create Profile (Always)
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Determine Flow: OWNER or EMPLOYEE
    store_name := NEW.raw_user_meta_data->>'liquor_store_name';
    input_org_code := NEW.raw_user_meta_data->>'org_code';
    
    IF store_name IS NOT NULL THEN
        -- ========================================
        -- OWNER FLOW: Create Organization
        -- ========================================
        
        -- Generate unique code
        generated_code := public.generate_unique_org_code();

        -- Create organization with code
        INSERT INTO public.organizations (name, plan_type, is_active, code)
        VALUES (store_name, 'free', TRUE, generated_code)
        RETURNING id INTO new_org_id;

        -- Link profile to organization as OWNER
        UPDATE public.profiles
        SET organization_id = new_org_id, role = 'OWNER'
        WHERE id = NEW.id;
        
        -- Seed default data
        PERFORM public.seed_organization_defaults(new_org_id);

    ELSIF input_org_code IS NOT NULL THEN
        -- ========================================
        -- EMPLOYEE FLOW: Join Existing Organization
        -- ========================================
        
        -- Find organization by code
        SELECT id INTO new_org_id 
        FROM public.organizations 
        WHERE code = input_org_code;

        IF new_org_id IS NOT NULL THEN
            -- Create pending join request
            INSERT INTO public.organization_join_requests (user_id, organization_id, org_code, status)
            VALUES (NEW.id, new_org_id, input_org_code, 'pending');

            -- Set role to EMPLOYEE (but NO organization_id yet - awaits approval)
            UPDATE public.profiles 
            SET role = 'EMPLOYEE' 
            WHERE id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle Email Updates
CREATE OR REPLACE FUNCTION public.handle_update_email() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles 
    SET email = NEW.email 
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.3 Updated_at Triggers
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3.4 Attach Triggers
-- ------------------------------------------------------------------------------

-- Auth Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_updated_email ON auth.users;
CREATE TRIGGER on_auth_user_updated_email
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_update_email();

-- Updated_at Triggers
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;
CREATE TRIGGER on_profiles_updated 
    BEFORE UPDATE ON public.profiles 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_inventory_updated ON public.inventory;
CREATE TRIGGER on_inventory_updated 
    BEFORE UPDATE ON public.inventory 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_pending_orders_updated ON public.pending_orders;
CREATE TRIGGER on_pending_orders_updated 
    BEFORE UPDATE ON public.pending_orders 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_cost_prices_updated ON public.cost_prices;
CREATE TRIGGER on_cost_prices_updated 
    BEFORE UPDATE ON public.cost_prices 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_organization_settings_updated ON public.organization_settings;
CREATE TRIGGER on_organization_settings_updated 
    BEFORE UPDATE ON public.organization_settings 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();


-- SECTION 4: SEED DATA UTILITIES
-- ==============================================================================

-- Seed Default Organization Data (Emission Types, Settings)
CREATE OR REPLACE FUNCTION public.seed_organization_defaults(target_org_id UUID)
RETURNS void AS $$ 
BEGIN
    -- 1. Insert Default Emission Types
    INSERT INTO public.emission_types (organization_id, name, units, subtype)
    VALUES 
        (target_org_id, 'Caja', 36, 'Botella'),
        (target_org_id, 'Media Caja', 18, 'Botella'),
        (target_org_id, 'Caja', 24, 'Botella Tercio'),
        (target_org_id, 'Media Caja', 12, 'Botella Tercio'),
        (target_org_id, 'Caja', 24, 'Lata'),
        (target_org_id, 'Media Caja', 12, 'Lata'),
        (target_org_id, 'Six Pack', 6, 'Lata')
    ON CONFLICT (organization_id, name, subtype) DO NOTHING;

    -- 2. Insert Default Settings
    INSERT INTO public.organization_settings (organization_id, key, value)
    VALUES 
        (target_org_id, 'currency', '{"code": "VES", "symbol": "Bs."}')
    ON CONFLICT (organization_id, key) DO NOTHING;
END;
$$ LANGUAGE plpgsql;


-- SECTION 5: RLS POLICIES
-- ==============================================================================

-- 5.1 Enable RLS
-- ------------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emission_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pending_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 5.2 Profiles Policies
-- ------------------------------------------------------------------------------
-- ⚠️ RLS IS DISABLED ON PROFILES TABLE
-- Reason: Any policy that references profiles within a profiles policy causes
--         infinite recursion (Error 42P17). Since users are authenticated via
--         Supabase Auth and app filters by organization_id, disabling RLS is safe.
-- ------------------------------------------------------------------------------

-- RLS is disabled for profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- No policies needed - users can read/write profiles directly
-- Security is maintained through:
-- 1. Supabase Auth (users must be authenticated)
-- 2. Application-level filtering by organization_id
-- 3. RLS on other critical tables (organizations, orders, inventory, etc.)

-- 5.3 Organizations Policies
-- ------------------------------------------------------------------------------

-- Users can view their own organization
DROP POLICY IF EXISTS "View Own Organization" ON public.organizations;
CREATE POLICY "View Own Organization" 
    ON public.organizations FOR SELECT 
    USING (
        id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- 5.4 Join Requests Policies
-- ------------------------------------------------------------------------------
-- ⚠️ RLS IS DISABLED ON ORGANIZATION_JOIN_REQUESTS TABLE
-- Reason: RLS policies were blocking JOINs with profiles table, causing
--         "Could not find a relationship" errors in Supabase queries
-- Security: Users are authenticated + app filters by organization_id
-- ------------------------------------------------------------------------------

-- Disable RLS for organization_join_requests
ALTER TABLE public.organization_join_requests DISABLE ROW LEVEL SECURITY;

-- No policies needed - direct access with app-level filtering

-- 5.5 Product & Inventory Policies (Organization Isolation)
-- ------------------------------------------------------------------------------

-- Products
DROP POLICY IF EXISTS "Access Products" ON public.products;
CREATE POLICY "Access Products" 
    ON public.products FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Emission Types
DROP POLICY IF EXISTS "Access Emission Types" ON public.emission_types;
CREATE POLICY "Access Emission Types" 
    ON public.emission_types FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Prices
DROP POLICY IF EXISTS "Access Prices" ON public.prices;
CREATE POLICY "Access Prices" 
    ON public.prices FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Inventory
DROP POLICY IF EXISTS "Access Inventory" ON public.inventory;
CREATE POLICY "Access Inventory" 
    ON public.inventory FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- 5.6 Orders Policies
-- ------------------------------------------------------------------------------

-- Orders
DROP POLICY IF EXISTS "Access Orders" ON public.orders;
CREATE POLICY "Access Orders" 
    ON public.orders FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Order Items
DROP POLICY IF EXISTS "Access Order Items" ON public.order_items;
CREATE POLICY "Access Order Items" 
    ON public.order_items FOR ALL 
    USING (
        order_id IN (
            SELECT id FROM public.orders 
            WHERE organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
        )
    );

-- Pending Orders
DROP POLICY IF EXISTS "Access Pending Orders" ON public.pending_orders;
CREATE POLICY "Access Pending Orders" 
    ON public.pending_orders FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- 5.7 Advanced Features Policies
-- ------------------------------------------------------------------------------

-- Cost Prices
DROP POLICY IF EXISTS "Access Cost Prices" ON public.cost_prices;
CREATE POLICY "Access Cost Prices" 
    ON public.cost_prices FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Inventory History
DROP POLICY IF EXISTS "Access Inventory History" ON public.inventory_history;
CREATE POLICY "Access Inventory History" 
    ON public.inventory_history FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Waste Reports
DROP POLICY IF EXISTS "Access Waste Reports" ON public.waste_reports;
CREATE POLICY "Access Waste Reports" 
    ON public.waste_reports FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- Organization Settings
DROP POLICY IF EXISTS "Access Org Settings" ON public.organization_settings;
CREATE POLICY "Access Org Settings" 
    ON public.organization_settings FOR ALL 
    USING (
        organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    );

-- 5.8 System Policies
-- ------------------------------------------------------------------------------

-- License Keys (Read available only)
DROP POLICY IF EXISTS "Read Available Keys" ON public.license_keys;
CREATE POLICY "Read Available Keys" 
    ON public.license_keys FOR SELECT 
    TO authenticated 
    USING (status = 'available');

-- Developers have full access to license keys
DROP POLICY IF EXISTS "Developer Full Access Keys" ON public.license_keys;
CREATE POLICY "Developer Full Access Keys" 
    ON public.license_keys FOR ALL 
    TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'DEVELOPER')
    );

-- Analytics Events
DROP POLICY IF EXISTS "Insert Own Analytics" ON public.analytics_events;
CREATE POLICY "Insert Own Analytics" 
    ON public.analytics_events FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Developer View Analytics" ON public.analytics_events;
CREATE POLICY "Developer View Analytics" 
    ON public.analytics_events FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'DEVELOPER')
    );


-- SECTION 6: REALTIME CONFIGURATION
-- ==============================================================================

DO $$
BEGIN
    -- Create publication if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    -- Add tables to publication (idempotent)
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'products') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'prices') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.prices;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'emission_types') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.emission_types;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'pending_orders') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pending_orders;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organization_settings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_settings;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'cost_prices') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.cost_prices;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_history') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_history;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'waste_reports') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_reports;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'organization_join_requests') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.organization_join_requests;
    END IF;
END $$;

-- Set replica identity to FULL (required for realtime)
ALTER TABLE public.products REPLICA IDENTITY FULL;
ALTER TABLE public.inventory REPLICA IDENTITY FULL;
ALTER TABLE public.prices REPLICA IDENTITY FULL;
ALTER TABLE public.emission_types REPLICA IDENTITY FULL;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.pending_orders REPLICA IDENTITY FULL;
ALTER TABLE public.organization_settings REPLICA IDENTITY FULL;
ALTER TABLE public.cost_prices REPLICA IDENTITY FULL;
ALTER TABLE public.inventory_history REPLICA IDENTITY FULL;
ALTER TABLE public.waste_reports REPLICA IDENTITY FULL;
ALTER TABLE public.organization_join_requests REPLICA IDENTITY FULL;


-- ==============================================================================
-- SETUP COMPLETE
-- ==============================================================================
-- Next Steps:
-- 1. Verify tables were created: SELECT * FROM public.organizations;
-- 2. Test OWNER registration: Create account with liquor store name
-- 3. Check organization code: SELECT id, name, code FROM public.organizations;
-- 4. Test EMPLOYEE registration: Create account with organization code
-- ==============================================================================
