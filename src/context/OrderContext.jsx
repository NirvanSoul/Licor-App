import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useProduct } from './ProductContext';
import { useNotification } from './NotificationContext';
import { fetchSales, createSales, fetchPendingOrders, upsertPendingOrder, updatePendingOrder, deletePendingOrder, deleteSale as deleteSaleApi } from '../services/api';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const { user, organizationId } = useAuth();
    const { productMap, checkStock, deductStock, addStock, getBsPrice, getPrice, getUnitsPerEmission, emissionOptions } = useProduct();
    const { showNotification } = useNotification();

    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- Unified Initial Data Sync ---
    useEffect(() => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        const syncInitialData = async () => {
            // SILENT UPDATE: Only show loading if we have NO data yet
            const isInitialLoad = pendingOrders.length === 0;
            if (isInitialLoad) setLoading(true);

            try {
                console.log("🔄 [OrderContext] Syncing data (Silent:", !isInitialLoad, ")");

                // Fetch both in parallel for speed
                const [pendingRes, salesRes] = await Promise.all([
                    fetchPendingOrders(organizationId),
                    fetchSales(organizationId)
                ]);

                const allOrdersMap = {};

                // 1. Process Pending Orders (OPEN)
                if (pendingRes.data) {
                    pendingRes.data.forEach(o => {
                        allOrdersMap[o.id] = {
                            ...o,
                            ticketNumber: o.ticket_number || '0000',
                            customerName: o.customer_name || 'Anónimo',
                            createdAt: o.created_at,
                            createdBy: o.created_by || 'Sistema'
                        };
                    });
                }

                // 2. Process Sales History (PAID) - These overwrite pending if same ID exists (safety)
                if (salesRes.data) {
                    salesRes.data.forEach(sale => {
                        allOrdersMap[sale.id] = {
                            ...sale,
                            status: 'PAID',
                            items: (sale.items || []).map(item => ({
                                ...item,
                                name: item.product_name || item.name || 'Producto',
                                beerType: item.product_name || item.beerType || 'Producto',
                                quantity: Number(item.quantity || 1),
                                price: Number(item.price || 0)
                            })),
                            ticketNumber: sale.ticket_number || '0000',
                            customerName: sale.customer_name || 'Anónimo',
                            totalAmountBs: Number(sale.total_amount_bs || 0),
                            totalAmountUsd: Number(sale.total_amount_usd || 0),
                            paymentMethod: sale.payment_method,
                            reference: sale.reference,
                            createdAt: sale.created_at,
                            closedAt: sale.closed_at || sale.created_at,
                            createdBy: sale.created_by || 'Sistema'
                        };
                    });
                }

                const merged = Object.values(allOrdersMap).sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                );

                setPendingOrders(merged.slice(0, 1000));
                console.log(`✅ [OrderContext] Sync complete. Loaded ${merged.length} orders.`);
            } catch (err) {
                console.error("❌ [OrderContext] Error syncing initial data:", err);
            } finally {
                setLoading(false);
            }
        };

        syncInitialData();

        // --- Realtime Subscriptions ---
        const pendingChannel = supabase
            .channel(`pending-orders-${organizationId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'pending_orders',
                filter: `organization_id=eq.${organizationId}`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newOrder = {
                        ...payload.new,
                        ticketNumber: payload.new.ticket_number || '0000',
                        customerName: payload.new.customer_name || 'Anónimo',
                        createdAt: payload.new.created_at,
                        createdBy: payload.new.created_by || 'Sistema'
                    };
                    setPendingOrders(prev => {
                        if (prev.some(o => o.id === newOrder.id)) return prev;
                        return [newOrder, ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    if (payload.new.status === 'PAID') {
                        setPendingOrders(prev => prev.filter(o => o.id !== payload.new.id));
                    } else {
                        setPendingOrders(prev => prev.map(o => {
                            if (o.id !== payload.new.id) return o;
                            return {
                                ...o,
                                ...payload.new,
                                ticketNumber: payload.new.ticket_number || o.ticketNumber,
                                customerName: payload.new.customer_name || o.customerName,
                                createdAt: payload.new.created_at || o.createdAt,
                                createdBy: payload.new.created_by || o.createdBy,
                                items: payload.new.items || o.items
                            };
                        }));
                    }
                } else if (payload.eventType === 'DELETE') {
                    setPendingOrders(prev => prev.filter(o => o.id !== payload.old.id));
                }
            })
            .subscribe();

        const salesChannel = supabase
            .channel(`sales-${organizationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'orders',
                filter: `organization_id=eq.${organizationId}`
            }, async (payload) => {
                const { data: saleData } = await fetchSales(organizationId);
                const newSale = (saleData || []).find(s => s.id === payload.new.id);

                if (newSale) {
                    const transformedSale = {
                        ...newSale,
                        status: 'PAID',
                        items: (newSale.items || []).map(item => ({
                            ...item,
                            name: item.product_name || item.name || 'Producto',
                            beerType: item.product_name || item.beerType || 'Producto',
                            quantity: Number(item.quantity || 1),
                            price: Number(item.price || 0)
                        })),
                        ticketNumber: newSale.ticket_number || '0000',
                        customerName: newSale.customer_name || 'Anónimo',
                        totalAmountBs: Number(newSale.total_amount_bs || 0),
                        totalAmountUsd: Number(newSale.total_amount_usd || 0),
                        paymentMethod: newSale.payment_method,
                        reference: newSale.reference,
                        createdAt: newSale.created_at,
                        closedAt: newSale.closed_at || newSale.created_at,
                        createdBy: newSale.created_by || 'Sistema'
                    };

                    setPendingOrders(prev => {
                        const filtered = prev.filter(o => o.id !== transformedSale.id);
                        const merged = [transformedSale, ...filtered].sort((a, b) =>
                            new Date(b.createdAt) - new Date(a.createdAt)
                        );
                        return merged.slice(0, 1000);
                    });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(pendingChannel);
            supabase.removeChannel(salesChannel);
        };
    }, [organizationId]);

    // --- Actions ---

    const createOrder = async (customerName, items = [], type = 'Local', paymentMethod = null, reference = '') => {
        let initialItems = (items || []).map(item => ({
            ...item,
            addedAt: new Date().toISOString(),
            slots: (item.beerVariety === 'Variado') ? [item.baseBeer || item.beerType || item.name] : []
        }));

        if (initialItems.length === 0 && type === 'Local') {
            initialItems = [{
                id: 'consumption-' + Date.now(),
                name: 'Consumo',
                beerVariety: 'Variado',
                emission: 'Libre',
                subtype: 'Botella',
                quantity: 1,
                slots: [],
                addedAt: new Date().toISOString()
            }];
        }

        if (!organizationId) {
            console.error("❌ [OrderContext] Prevented Ghost Write: No Organization ID");
            showNotification('Error Crítico: No estás vinculado a una organización. Recarga la página o contacta soporte.', 'error', 4000);
            return null;
        }

        const newOrderData = {
            organization_id: organizationId,
            ticket_number: Math.floor(1000 + Math.random() * 9000),
            customer_name: customerName || 'Anónimo',
            status: 'OPEN',
            type,
            payment_method: paymentMethod,
            reference,
            created_by: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Desconocido',
            items: initialItems,
            payments: []
        };

        const { data, error } = await upsertPendingOrder(newOrderData);
        if (error) {
            showNotification('Error al crear ticket en la nube', 'error');
            return null;
        }

        const formattedOrder = {
            ...data,
            ticketNumber: data.ticket_number,
            customerName: data.customer_name,
            createdAt: data.created_at,
            createdBy: data.created_by
        };

        setPendingOrders(prev => [formattedOrder, ...prev]);
        showNotification(`Ticket #${formattedOrder.ticketNumber} Creado`, 'success');
        return formattedOrder;
    };

    const addItemToOrder = async (orderId, item) => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        const quantity = item.quantity || 1;
        const beerName = item.beerType || item.name;

        // 1. Validation
        // For Variado, we validate assuming at least 1 unit is available if adding a new crate.
        // Actually validating "1 Box" of Variado means do we have the box? We assume yes.
        // For the specific beer selected, we check 1 unit.
        const unitsToCheck = (item.beerVariety === 'Variado') ? 1 : quantity;
        const emissionToCheck = (item.beerVariety === 'Variado') ? 'Unidad' : item.emission;

        const canFulfill = checkStock(beerName, emissionToCheck, item.subtype, unitsToCheck);

        if (!canFulfill) {
            showNotification(`Stock insuficiente para ${beerName}`, 'error');
            return;
        }

        let itemToAdd = { ...item, quantity, addedAt: new Date().toISOString() };

        // 2. Stock Deduction Logic
        if (order.type === 'Local') {
            // For LOCAL orders, we treat everything as an Open List (Libre) to allow granular control
            // unless it's explicitly 'Consumo' which is already handled.

            // Deduct Stock (Bulk for the initial add)
            if (item.beerVariety === 'Variado') {
                await deductStock(beerName, 'Unidad', item.subtype, 1);
                itemToAdd.slots = [beerName];
            } else {
                // For Standard Products (Caja, Media Caja, etc) in LOCAL mode
                // Do NOT deduct stock immediately.
                // Initialize empty slots (TicketGrid will populate nulls based on total units derived from emission).
                itemToAdd.slots = [];
            }
        }

        // 3. Update State
        // 3. Update State & DB
        const updatedItems = [...order.items, itemToAdd];
        setPendingOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: updatedItems } : o));

        if (organizationId) {
            // USE UPDATE instead of UPSERT to patch items
            await updatePendingOrder(orderId, { items: updatedItems });
        }

        showNotification(`${beerName} agregado`, 'info', 1500);
    };

    const removeItemFromOrder = async (orderId, itemId) => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        const item = order.items.find(i => i.id === itemId);
        if (!item) return;

        const beerName = item.beerType || item.name;

        // Restore Stock Logic
        if (order.type === 'Local') {
            // Iterate slots and return each unit (Works for both Variado and our new Libre items)
            const slotsToReturn = item.slots && item.slots.length > 0 ? item.slots : [beerName];
            for (const slotBeer of slotsToReturn) {
                if (slotBeer) {
                    await addStock(slotBeer, 'Unidad', item.subtype, 1);
                }
            }
        }

        const updatedItems = order.items.filter(i => i.id !== itemId);
        setPendingOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: updatedItems } : o));

        if (organizationId) {
            // USE UPDATE instead of UPSERT
            await updatePendingOrder(orderId, { items: updatedItems });
        }
    };

    const cancelOrder = async (orderId) => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        if (order.type === 'Local') {
            for (const item of order.items) {
                const beerName = item.beerType || item.name;
                const slotsToReturn = item.slots && item.slots.length > 0 ? item.slots : (item.beerVariety === 'Variado' ? [beerName] : []);
                // If it was a bulk add without slots (shouldn't happen now), we might need fallback?
                // But since we initialized slots=[], and they fill one by one...
                // If slots is empty, nothing to return. Correct.

                for (const slotBeer of slotsToReturn) {
                    if (slotBeer) await addStock(slotBeer, 'Unidad', item.subtype, 1);
                }

                // Note: If we had legacy items that DID deduct bulk, this fix won't return their stock automatically.
                // But for new items, this is correct.
            }
        }

        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
        if (organizationId) {
            await deletePendingOrder(orderId);
        }
        showNotification('Ticket cancelado', 'info');
    };

    const deleteSale = async (orderId) => {
        if (!organizationId) {
            showNotification('Error: Sin conexión a organización.', 'error');
            return;
        }
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        // 1. Restore Stock
        for (const item of order.items) {
            const beerName = item.beerType || item.name;

            // Handle Variado expansion
            if (item.beerVariety === 'Variado' && item.composition) {
                // If it was expanded in the UI/DB, we might not have the composition object if it came freshly from DB fetch?
                // Actually my fetch logic reconstructs items.
                // For PAID orders (sales), items are individual rows.
                // However, my mapped object usually flattens them.
                // If the sale was "To Go" (Llevar), items are simple product links.
                // If it was Mixed, they are expanded.
                // Let's just trust the item props.
            }

            // Simple Logic: just restore quantity * unit
            // NOTE: 'emission' in sales history for simple products is usually correct.
            // But if we optimized 'Local' sales into 'Caja', 'Media Caja', etc., we restore THAT.
            // Which matches exactly what we want (e.g. return a Box to inventory).

            // For 'Variado' in 'Llevar' mode, we usually deducted Units.
            // But in 'fetchSales', we might have single items.
            // Let's handle the generic case:
            await addStock(beerName, item.emission, item.subtype, item.quantity || 1);
        }

        // 2. Delete from DB
        if (organizationId) {
            const { error } = await deleteSaleApi(orderId);
            if (error) {
                showNotification('Error al eliminar venta', 'error');
                return;
            }
        }

        // 3. Update UI
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
        showNotification('Venta eliminada e inventario restaurado', 'success');
    };

    // --- Helper: Calculate Total with Local Optimization ---
    const calculateOrderTotal = (items, type = 'Local') => {
        let totalBs = 0;
        let totalUsd = 0;
        const details = []; // Initialize details array
        const optimizedItems = []; // New: Store optimized item objects for history
        const isLocal = type === 'Local';
        const localConsumptionMap = {};

        // 1. Process Items 
        for (const item of items) {
            const beerName = item.beerType || item.name;

            // --- Pricing Aggregation ---
            if (isLocal) {
                const slotsToCount = item.slots || [];
                // If slots are empty but it's a bulk item (rare in new logic but possible), fallbacks?
                // Actually if slots are empty for Variado, consumption is 0. 
                // But for standard items in Local mode (not Variado), we might just rely on quantity if we stop using slots for them? 
                // Current logic enforces slots for Variado.

                // If it is NOT Variado/Consumo (e.g. user added "Caja" directly in Local mode), 
                // we should count it as units in the map or just add the straight price?
                // The prompt implies "consumption" is what we optimize. 
                // Let's assume everything in Local is optimized by units if possible?
                // Or just stick to the 'Consumo' item type logic. 

                // My previous logic in closeOrder iterated slots. Let's stick to that for parity.
                for (const slotBeer of slotsToCount) {
                    if (slotBeer) {
                        const key = `${slotBeer}_${item.subtype}`;
                        localConsumptionMap[key] = (localConsumptionMap[key] || 0) + 1;
                    }
                }
            } else {
                // To Go Logic
                if (item.beerVariety === 'Variado' && item.composition) {
                    totalBs += (item.unitPriceBs || 0) * (item.quantity || 1);
                    totalUsd += (item.unitPriceUsd || 0) * (item.quantity || 1);
                } else {
                    const priceBs = getBsPrice(beerName, item.emission, item.subtype, 'standard');
                    const priceUsd = getPrice(beerName, item.emission, item.subtype, 'standard');
                    totalBs += priceBs * (item.quantity || 1);
                    totalUsd += priceUsd * (item.quantity || 1);
                }
            }
        }

        // 2. Optimization for Local
        if (isLocal) {
            console.log("Optimization: Calculating Local Totals");

            for (const [key, totalUnits] of Object.entries(localConsumptionMap)) {
                const lastUnderscoreIndex = key.lastIndexOf('_');
                const beerName = key.substring(0, lastUnderscoreIndex);
                const subtype = key.substring(lastUnderscoreIndex + 1);

                // Determine relevant defaults based on subtype
                const isLata = subtype && subtype.toLowerCase().includes('lata');
                const defaults = ['Caja', 'Media Caja'];
                if (isLata) defaults.push('Six Pack');

                const allEmissionNames = [...new Set([...defaults, ...(emissionOptions || [])])];

                let remaining = totalUnits;

                // Identify Valid Candidates for this Beer/Subtype
                const candidates = [];
                for (const emName of allEmissionNames) {
                    const units = getUnitsPerEmission(emName, subtype);
                    const priceUsd = getPrice(beerName, emName, subtype, 'local');

                    console.log(`[Optimization] ${beerName} (${subtype}) | Checking ${emName} | Units: ${units} | Price Local: ${priceUsd}`);

                    // Only consider if it's a valid pack (units > 1) AND has a specific price set (>0)
                    if (units > 1 && priceUsd > 0) {
                        candidates.push({
                            name: emName,
                            units,
                            priceBs: getBsPrice(beerName, emName, subtype, 'local'),
                            priceUsd
                        });
                    }
                }

                // Sort Descending by Units
                candidates.sort((a, b) => b.units - a.units);

                // Apply Greedy
                for (const cand of candidates) {
                    if (remaining >= cand.units) {
                        const count = Math.floor(remaining / cand.units);
                        if (count > 0) {
                            totalBs += count * cand.priceBs;
                            totalUsd += count * cand.priceUsd;
                            remaining %= cand.units;
                            details.push(`${count} ${cand.name}${count > 1 ? 's' : ''}`);

                            optimizedItems.push({
                                id: Date.now() + Math.random(),
                                name: beerName,
                                emission: cand.name,
                                subtype: subtype,
                                quantity: count,
                                price: cand.priceUsd, // Fix: Add explicit price for DB
                                unitPriceBs: cand.priceBs,
                                unitPriceUsd: cand.priceUsd,
                                totalPriceBs: count * cand.priceBs,
                                totalPriceUsd: count * cand.priceUsd,
                                beerVariety: 'Normal', // Converted to normal
                                type: 'Local'
                            });
                        }
                    }
                }

                // 4. Units (Remainder)
                if (remaining > 0) {
                    const priceBs = getBsPrice(beerName, 'Unidad', subtype, 'local');
                    const priceUsd = getPrice(beerName, 'Unidad', subtype, 'local');
                    totalBs += remaining * priceBs;
                    totalUsd += remaining * priceUsd;
                    // details.push(`${remaining} ${beerName} (U)`); // Optional detail

                    optimizedItems.push({
                        id: Date.now() + Math.random(),
                        name: beerName,
                        emission: 'Unidad',
                        subtype: subtype,
                        quantity: remaining,
                        price: priceUsd, // Fix: Add explicit price for DB
                        unitPriceBs: priceBs,
                        unitPriceUsd: priceUsd,
                        totalPriceBs: remaining * priceBs,
                        totalPriceUsd: remaining * priceUsd,
                        beerVariety: 'Normal', // Converted to normal
                        type: 'Local'
                    });
                }
            }
        }

        if (!isLocal) {
            items.forEach(item => {
                if (item.beerVariety === 'Variado' && item.composition) {
                    // Expand Variado To-Go into constituent products for accurate records
                    Object.entries(item.composition).forEach(([beerName, units]) => {
                        if (units > 0) {
                            optimizedItems.push({
                                id: Date.now() + Math.random(),
                                name: beerName,
                                beerType: beerName,
                                emission: 'Unidad', // Always expanded to units
                                subtype: item.subtype || 'Botella',
                                quantity: units * (item.quantity || 1),
                                // We don't distribute price perfectly here since Revenue 
                                // is tracked at Order level, but let's set it to 0 
                                // so COGS calculation in CashPage sees it as a separate product.
                                price: 0,
                                unitPriceBs: 0,
                                unitPriceUsd: 0,
                                beerVariety: 'Normal',
                                type: 'Llevar'
                            });
                        }
                    });
                } else {
                    // Ensure price is defined for DB constraint
                    optimizedItems.push({
                        ...item,
                        price: item.price !== undefined ? item.price : (item.unitPriceUsd || 0)
                    });
                }
            });
        }

        return { totalBs, totalUsd, details, optimizedItems };
    };

    const closeOrder = async (orderId, paymentMethod, reference = '') => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        // 1. Deduct Stock (Already analyzed in previous view, logic remains for parity)
        for (const item of order.items) {
            const beerName = item.beerType || item.name;
            const isLocal = order.type === 'Local';

            if (!isLocal) {
                if (item.beerVariety === 'Variado') {
                    const slotsToDeduct = item.slots && item.slots.length > 0 ? item.slots : [beerName];
                    for (const slotBeer of slotsToDeduct) { if (slotBeer) await deductStock(slotBeer, 'Unidad', item.subtype, 1); }
                } else {
                    await deductStock(beerName, item.emission, item.subtype, item.quantity || 1);
                }
            } else {
                // Local mode stock logic (assumed handled or no-op as per previous analysis)
            }
        }

        const { totalBs, totalUsd, optimizedItems } = calculateOrderTotal(order.items, order.type);

        // 2. Prepare Order Object for DB & State
        const closedOrder = {
            ...order,
            status: 'PAID',
            closedAt: new Date().toISOString(),
            paymentMethod,
            reference,
            totalAmountBs: totalBs,
            totalAmountUsd: totalUsd,
            items: optimizedItems || order.items,
            organization_id: organizationId // Ensure Org ID is attached
        };

        if (!organizationId) {
            console.error("❌ [OrderContext] Prevented Ghost Close: No Organization ID");
            showNotification('Error: Sin conexión a organización.', 'error');
            return;
        }

        // 3. Persist to Network (Supabase)
        try {
            const { error: saleError } = await createSales([closedOrder]);
            if (saleError) throw saleError;

            if (organizationId) {
                // DELETE from pending instead of just updating status
                // This ensures the DELETE event triggers and removes it from other devices
                await deletePendingOrder(orderId);
            }
        } catch (err) {
            console.error("Failed to save order to DB", err);
            const msg = err.message || JSON.stringify(err);
            showNotification(`Error: ${msg}`, 'error');
            return; // Abort state update
        }

        // 4. Update local state immediately to 'PAID' so it moves to CashPage
        setPendingOrders(prev => prev.map(o => o.id === orderId ? closedOrder : o));

        const formattedTotal = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalBs);
        showNotification(`Ticket Cerrado: ${formattedTotal} Bs`, 'success');
    };

    const processDirectSale = async (customerName, items, paymentMethod, reference) => {
        if (!organizationId) {
            showNotification('Error: Sin conexión a organización.', 'error');
            return null;
        }
        // 1. Calculate totals
        const { totalBs, totalUsd, optimizedItems } = calculateOrderTotal(items, 'Para Llevar');

        // 2. Create Order Object
        const newOrder = {
            id: Date.now().toString(), // Temp ID
            ticketNumber: Math.floor(1000 + Math.random() * 9000),
            customerName: customerName || 'Anónimo',
            status: 'PAID',
            type: 'Llevar',
            paymentMethod,
            reference,
            createdBy: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Desconocido',
            createdAt: new Date().toISOString(),
            closedAt: new Date().toISOString(),
            items: optimizedItems,
            totalAmountBs: totalBs,
            totalAmountUsd: totalUsd,
            organization_id: organizationId,
            payments: []
        };

        // 3. Deduct Stock
        for (const item of items) {
            const beerName = item.beerType || item.name;
            if (item.beerVariety === 'Variado' && item.composition) {
                for (const [beer, units] of Object.entries(item.composition)) {
                    await deductStock(beer, 'Unidad', item.subtype, units * (item.quantity || 1));
                }
            } else {
                await deductStock(beerName, item.emission, item.subtype, item.quantity || 1);
            }
        }

        // 4. Persist to Network
        try {
            const { data, error: saleError } = await createSales([newOrder]);
            if (saleError) throw saleError;

            // 5. Update State with DB result (to get real UUID)
            if (data && data[0]) {
                const transformedDirectSale = {
                    ...data[0],
                    status: 'PAID',
                    items: (data[0].items || items).map(item => ({
                        ...item,
                        name: item.product_name || item.name || 'Producto',
                        beerType: item.product_name || item.beerType || 'Producto',
                        quantity: Number(item.quantity || 1),
                        price: Number(item.price || 0)
                    })),
                    customerName: data[0].customer_name || 'Anónimo',
                    ticketNumber: data[0].ticket_number || '0000',
                    totalAmountBs: Number(data[0].total_amount_bs || totalBs),
                    totalAmountUsd: Number(data[0].total_amount_usd || totalUsd),
                    paymentMethod: data[0].payment_method,
                    reference: data[0].reference,
                    createdAt: data[0].created_at,
                    closedAt: data[0].closed_at || data[0].created_at,
                    createdBy: data[0].created_by || 'Sistema'
                };
                setPendingOrders(prev => [transformedDirectSale, ...prev.filter(o => o.id !== newOrder.id)]);
                showNotification(`Venta Registrada en Caja`, 'success');
            }
        } catch (err) {
            console.error("Failed to save direct sale to DB", err);
            showNotification(`Error al registrar venta directa`, 'error');
        }

        return newOrder;
    };

    const updateOrderItemSlot = async (orderId, itemIndex, slotIndex, content) => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        const item = order.items[itemIndex];
        const oldContent = item.slots ? item.slots[slotIndex] : null;

        // Stock Logic for Local + Variado/Libre Changes
        // Apply to ALL Local orders now (removed Variado/Libre check)
        if (order.type === 'Local') {

            // 1. Validate New Content Stock (if adding)
            if (content) {
                const hasStock = checkStock(content, 'Unidad', item.subtype, 1);
                if (!hasStock) {
                    showNotification(`Stock insuficiente para ${content}`, 'error');
                    return; // Stop update
                }
            }

            // 2. Restore Old Content
            if (oldContent) {
                await addStock(oldContent, 'Unidad', item.subtype, 1);
            }

            // 3. Deduct New Content
            if (content) {
                await deductStock(content, 'Unidad', item.subtype, 1);
            }
        }

        // State Update
        // State Update
        const updatedItems = [...order.items];
        const currentItem = updatedItems[itemIndex];
        const newSlots = currentItem.slots ? [...currentItem.slots] : [];
        newSlots[slotIndex] = content;
        const finalSlots = currentItem.emission === 'Libre' ? newSlots.filter(s => s !== null) : newSlots;
        updatedItems[itemIndex] = { ...currentItem, slots: finalSlots };

        setPendingOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: updatedItems } : o));

        if (organizationId) {
            // USE UPDATE
            await updatePendingOrder(orderId, { items: updatedItems });
        }
    };

    const updateOrderName = async (orderId, newName) => {
        if (organizationId) {
            // USE UPDATE
            await updatePendingOrder(orderId, { customer_name: newName });
        } else {
            // Technically we allow local updates if network is down? 
            // But here the issue is MISSING ORG.
            console.warn("Update name local only (No Org ID)");
        }
        setPendingOrders(prev => prev.map(o => o.id === orderId ? { ...o, customerName: newName } : o));
        showNotification('Título actualizado', 'success');
    };

    return (
        <OrderContext.Provider value={{
            pendingOrders,
            loading,
            createOrder,
            addItemToOrder,
            removeItemFromOrder,
            closeOrder,
            cancelOrder,
            processDirectSale,
            updateOrderItemSlot,
            updateOrderName,
            updateOrderName,
            deleteSale, // Exposed
            calculateOrderTotal // Exposed
        }}>
            {children}
        </OrderContext.Provider>
    );
};
