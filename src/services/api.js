import { supabase } from '../supabaseClient';
import { initialEmissions, initialSettings } from './mockData';

/* =========================================================================
   PRODUCTS
   ========================================================================= */

export const fetchProducts = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId);

    return { data: data || [], error };
};

export const createProduct = async (productData) => {
    const { data, error } = await supabase
        .from('products')
        .insert([productData])
        .select();

    return { data: data ? data[0] : null, error };
};

export const updateProduct = async (id, updates) => {
    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   INVENTORY
   ========================================================================= */

export const fetchInventory = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    // Fetch Inventory and Related Product info
    const { data, error } = await supabase
        .from('inventory')
        .select(`
            *,
            products (
                name,
                color
            )
        `)
        .eq('organization_id', organizationId);

    if (error) return { data: [], error };

    // Flatten structure to match app expectation { ..., products: { name: ... } }
    // Supabase returns nested object by default which matches what we need mostly,
    // but let's ensure it's robust.
    return { data: data || [], error: null };
};

export const upsertInventory = async (itemData) => {
    // itemData: { product_id, subtype, quantity, organization_id }
    // We use unique constraint on (product_id, subtype) for upsert
    const { data, error } = await supabase
        .from('inventory')
        .upsert(itemData, { onConflict: 'product_id, subtype' })
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   SALES (ORDERS)
   ========================================================================= */

export const fetchSales = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    // Fetch Orders with Items (if needed deeply) or just orders?
    // App usually wants a summary list.
    // If 'items' are embedded in the order object in the app logic, we need to fetch them.
    // However, the Supabase schema separates them.
    // We will join them.

    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            items:order_items (*)
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
};

export const createSales = async (salesData) => {
    const results = [];
    const errors = [];

    for (const sale of salesData) {
        try {
            // 1. Prepare and Map Order Data (JS camelCase -> DB snake_case)
            const { items, ...orderInfo } = sale;

            const mappedOrder = {
                organization_id: orderInfo.organization_id || orderInfo.organizationId,
                ticket_number: orderInfo.ticketNumber || orderInfo.ticket_number,
                customer_name: orderInfo.customerName || orderInfo.customer_name || 'Anónimo',
                status: orderInfo.status || 'PAID',
                type: orderInfo.type || 'Llevar',
                payment_method: orderInfo.paymentMethod || orderInfo.payment_method,
                reference: orderInfo.reference,
                total_amount_bs: orderInfo.totalAmountBs || orderInfo.total_amount_bs,
                total_amount_usd: orderInfo.totalAmountUsd || orderInfo.total_amount_usd,
                created_at: orderInfo.createdAt || orderInfo.created_at,
                closed_at: orderInfo.closedAt || orderInfo.closed_at || new Date().toISOString(),
                created_by: orderInfo.createdBy || orderInfo.created_by,
                payments: orderInfo.payments || []
            };

            // 2. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([mappedOrder])
                .select()
                .single();

            if (orderError) throw orderError;

            const orderId = orderData.id;

            // 3. Create Order Items
            if (items && items.length > 0) {
                const itemsToInsert = items.map(item => {
                    const pid = item.productID || item.id;
                    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pid);

                    return {
                        order_id: orderId,
                        product_id: isUUID ? pid : null, // Only send if valid UUID
                        product_name: item.name || item.beerType,
                        quantity: item.quantity,
                        price: item.price,
                        emission: item.emission,
                        subtype: item.subtype
                    };
                });

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (itemsError) {
                    console.error("Error saving items for order " + orderId, itemsError);
                    // We don't throw here to keep the order, but it's not ideal
                }
            }

            results.push({ ...orderData, items });
        } catch (err) {
            console.error("Critical error in createSales loop:", err);
            errors.push(err);
        }
    }

    return {
        data: results.length > 0 ? results : null,
        error: errors.length > 0 ? (errors.length === 1 ? errors[0] : errors) : null
    };
};

/* =========================================================================
   PRICES
   ========================================================================= */

export const fetchPrices = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('prices')
        .select(`
            *,
            products (name)
        `)
        .eq('organization_id', organizationId);

    // Helper to match app structure if needed?
    // App expects { ..., products: { name: ... } }

    return { data: data || [], error };
};

export const upsertPrice = async (priceData) => {
    const { data, error } = await supabase
        .from('prices')
        .upsert(priceData, { onConflict: 'product_id, emission, subtype, is_local' })
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   SETTINGS / EMISSIONS / SYNC
   ========================================================================= */

export const fetchSettings = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId);

    // If no settings in DB, return mock defaults but we should probably encourage DB usage
    return { data: data || [], error };
};

export const upsertSetting = async (organizationId, key, value) => {
    const { data, error } = await supabase
        .from('organization_settings')
        .upsert({ organization_id: organizationId, key, value }, { onConflict: 'organization_id, key' })
        .select();

    return { data: data ? data[0] : null, error };
};

export const fetchEmissions = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('emission_types')
        .select('*')
        .eq('organization_id', organizationId);

    return { data: data || [], error };
};

export const upsertEmission = async (emissionData) => {
    const { data, error } = await supabase
        .from('emission_types')
        .upsert(emissionData, { onConflict: 'organization_id, name, subtype' })
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   COST PRICES
   ========================================================================= */

export const fetchCostPrices = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('cost_prices')
        .select('*')
        .eq('organization_id', organizationId);

    return { data: data || [], error };
};

export const upsertCostPrice = async (costData) => {
    const { data, error } = await supabase
        .from('cost_prices')
        .upsert(costData, { onConflict: 'organization_id, product_id, emission, subtype' })
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   PENDING ORDERS
   ========================================================================= */

export const fetchPendingOrders = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('pending_orders')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false });

    return { data: data || [], error };
};

export const upsertPendingOrder = async (orderData) => {
    // orderData: { id, organization_id, ticket_number, customer_name, status, type, payment_method, reference, items, payments, created_by }
    const { data, error } = await supabase
        .from('pending_orders')
        .upsert(orderData)
        .select();

    return { data: data ? data[0] : null, error };
};

export const deletePendingOrder = async (id) => {
    const { error } = await supabase
        .from('pending_orders')
        .delete()
        .eq('id', id);
    return { error };
};

export const updatePendingOrder = async (id, updates) => {
    const { data, error } = await supabase
        .from('pending_orders')
        .update(updates)
        .eq('id', id)
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   HISTORY (INVENTORY & WASTE)
   ========================================================================= */

export const fetchInventoryHistory = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('inventory_history')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
};

export const createInventoryHistory = async (historyData) => {
    const { data, error } = await supabase
        .from('inventory_history')
        .insert([historyData])
        .select();

    return { data: data ? data[0] : null, error };
};

export const fetchWasteReports = async (organizationId) => {
    if (!organizationId) return { data: [], error: 'No Organization ID' };

    const { data, error } = await supabase
        .from('waste_reports')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    return { data: data || [], error };
};

export const createWasteReport = async (reportData) => {
    const { data, error } = await supabase
        .from('waste_reports')
        .insert([reportData])
        .select();

    return { data: data ? data[0] : null, error };
};

/* =========================================================================
   DELETIONS & UTILS
   ========================================================================= */

export const deleteProduct = async (id) => {
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
    return { error };
};

export const deleteEmission = async (id) => {
    const { error } = await supabase
        .from('emission_types')
        .delete()
        .eq('id', id);
    return { error };
};

export const resetDatabase = async () => {
    console.warn("Reset Database called - This is destructive in Supabase!");
    // For now, only clearing local state flags
    localStorage.clear();
    return { success: true };
};

/* =========================================================================
   LICENSE & ACTIVATION LINKS
   ========================================================================= */

export const getLicenseByToken = async (token) => {
    const { data, error } = await supabase
        .from('license_keys')
        .select('*')
        .eq('activation_token', token)
        .eq('status', 'available')
        .single();
    return { data, error };
};

export const updateLicenseToken = async (keyId, token) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Token valid for 7 days

    const { data, error } = await supabase
        .from('license_keys')
        .update({
            activation_token: token,
            activation_token_expires_at: expiresAt.toISOString()
        })
        .eq('id', keyId)
        .select()
        .single();
    return { data, error };
};

export const activateLicenseByToken = async (token, organizationId, userEmail) => {
    // 1. Get License Info
    const { data: license, error: fetchError } = await getLicenseByToken(token);
    if (fetchError || !license) return { error: fetchError || 'Licencia no válida o ya usada' };

    // 2. Calculate New Expiry Date
    const months = license.plan_type === 'yearly' ? 12 : (license.plan_type === 'free' ? 0.25 : 1);
    const daysToAdd = months * 30.5; // Average month

    const { data: org } = await supabase.from('organizations').select('license_expires_at').eq('id', organizationId).single();
    let currentExpiry = org?.license_expires_at ? new Date(org.license_expires_at) : new Date();
    if (currentExpiry < new Date()) currentExpiry = new Date();

    const newExpiry = new Date(currentExpiry);
    newExpiry.setDate(newExpiry.getDate() + daysToAdd);

    // 3. Update Organization (The Transaction-ish part)
    const { error: orgUpdateError } = await supabase
        .from('organizations')
        .update({
            is_active: true,
            license_key: license.key,
            license_expires_at: newExpiry.toISOString(),
            plan_type: license.plan_type
        })
        .eq('id', organizationId);

    if (orgUpdateError) return { error: orgUpdateError };

    // 4. Mark License as Used
    const { error: keyUpdateError } = await supabase
        .from('license_keys')
        .update({
            status: 'used',
            used_by_org_id: organizationId,
            used_at: new Date().toISOString(),
            activated_at: new Date().toISOString(),
            activated_by_email: userEmail,
            activation_token: null // Clear token after use
        })
        .eq('id', license.id);

    return { success: !keyUpdateError, error: keyUpdateError };
};
