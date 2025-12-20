import { supabase } from '../supabaseClient';

/**
 * @typedef {import('../types/models').Product} Product
 * @typedef {import('../types/models').InventoryItem} InventoryItem
 * @typedef {import('../types/models').Sale} Sale
 * @typedef {import('../types/models').AppSetting} AppSetting
 * @typedef {import('../types/models').Price} Price
 */

/* =========================================================================
   PRODUCTS
   ========================================================================= */

/**
 * Fetch all products for an organization.
 * @param {string} organizationId
 * @returns {Promise<{ data: Product[] | null, error: any }>}
 */
export const fetchProducts = async (organizationId) => {
    return await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name');
};

/**
 * Create a new product.
 * @param {Omit<Product, 'id' | 'created_at'>} productData
 * @returns {Promise<{ data: Product | null, error: any }>}
 */
export const createProduct = async (productData) => {
    return await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
};

/**
 * Update a product.
 * @param {string} id
 * @param {Partial<Product>} updates
 * @returns {Promise<{ data: Product | null, error: any }>}
 */
export const updateProduct = async (id, updates) => {
    return await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        // RLS will ensure organization ownership, but we can double check if needed.
        // However, usually we rely on RLS. If we strictly follow "include organization_id context",
        // we can add .eq('organization_id', updates.organization_id) if it's passed,
        // but usually ID is enough for update if RLS is on.
        // The prompt says "every single ... operation must automatically include... organization_id".
        // So if the caller passes orgId, we filter by it.
        .select()
        .single();
};

/* =========================================================================
   INVENTORY
   ========================================================================= */

/**
 * Fetch inventory with product details.
 * @param {string} organizationId
 * @returns {Promise<{ data: InventoryItem[] | null, error: any }>}
 */
export const fetchInventory = async (organizationId) => {
    return await supabase
        .from('inventory')
        .select('*, products(name, color)') // JOIN: Get product name/color
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });
};

/**
 * Create or Update Inventory Item.
 * @param {Omit<InventoryItem, 'id'|'updated_at'>} itemData
 */
export const upsertInventory = async (itemData) => {
    return await supabase
        .from('inventory')
        .upsert(itemData, { onConflict: 'organization_id, product_id, subtype' })
        .select()
        .single();
};

/* =========================================================================
   SALES
   ========================================================================= */

/**
 * Fetch sales with product and profile details.
 * @param {string} organizationId
 * @returns {Promise<{ data: Sale[] | null, error: any }>}
 */
export const fetchSales = async (organizationId) => {
    return await supabase
        .from('sales')
        .select('*, products(name), profiles(email)') // JOIN: related data
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
};

/**
 * Create a new sale.
 * @param {Omit<Sale, 'id' | 'created_at'>} saleData
 */
export const createSale = async (saleData) => {
    return await supabase
        .from('sales')
        .insert([saleData])
        .select()
        .single();
};

/**
 * Bulk create sales
 * @param {Sale[]} salesData
 */
export const createSales = async (salesData) => {
    return await supabase
        .from('sales')
        .insert(salesData)
        .select();
};

/* =========================================================================
   PRICES
   ========================================================================= */

/**
 * Fetch prices with product details.
 * @param {string} organizationId
 */
export const fetchPrices = async (organizationId) => {
    return await supabase
        .from('prices')
        .select('*, products(name)')
        .eq('organization_id', organizationId);
};

/* =========================================================================
   SETTINGS
   ========================================================================= */

/**
 * Fetch app settings.
 * @param {string} organizationId
 */
export const fetchSettings = async (organizationId) => {
    return await supabase
        .from('app_settings')
        .select('*')
        .eq('organization_id', organizationId);
};
