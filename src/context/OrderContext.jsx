// ... (Imports remain same)
import React, { createContext, useContext, useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient'; 
import { useAuth } from './AuthContext';
import { useProduct } from './ProductContext';
import { createSales } from '../services/api';

const OrderContext = createContext();

export const useOrder = () => useContext(OrderContext);

export const OrderProvider = ({ children }) => {
    const { user, organizationId } = useAuth();
    const { productMap, checkStock, deductStock, addStock, getBsPrice, getPrice, getUnitsPerEmission } = useProduct();

    // Load from local storage
    const loadOrders = () => {
        try {
            const stored = localStorage.getItem('pendingOrders');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("Error loading orders", e);
            return [];
        }
    };

    const [pendingOrders, setPendingOrders] = useState(loadOrders);

    // Persistence
    useEffect(() => {
        localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
    }, [pendingOrders]);

    // --- Actions ---

    const createOrder = (customerName, items = [], type = 'Local', paymentMethod = null) => {
        let initialItems = (items || []).map(item => ({
            ...item,
            addedAt: new Date().toISOString(),
            // Initialize slots for Variado logic if needed
            slots: (item.beerVariety === 'Variado') ? [item.baseBeer || item.beerType || item.name] : []
        }));

        // If it's a "Carta Abierta" (Empty items, Local type), inject a session item
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

        const newOrder = {
            id: Date.now().toString(),
            ticketNumber: Math.floor(1000 + Math.random() * 9000),
            customerName: customerName || 'Cliente',
            status: 'OPEN',
            type,
            paymentMethod, // Store the initial payment method
            createdAt: new Date().toISOString(),
            items: initialItems,
            payments: []
        };

        setPendingOrders(prev => [newOrder, ...prev]);
        return newOrder;
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
            alert(`⚠️ Stock insuficiente para ${beerName}`);
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
        setPendingOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    items: [...o.items, itemToAdd]
                };
            }
            return o;
        }));
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

        setPendingOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return {
                    ...o,
                    items: o.items.filter(i => i.id !== itemId)
                };
            }
            return o;
        }));
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
    };

    const closeOrder = async (orderId, paymentMethod, reference = '') => {
        const order = pendingOrders.find(o => o.id === orderId);
        if (!order) return;

        let finalTotalBs = 0;
        let finalTotalUsd = 0;
        const isLocal = order.type === 'Local';

        // Helper buffers for Local Optimization
        const localConsumptionMap = {}; // Key: "Beer_Subtype" -> Count (Units)

        // 1. Process Items (Stock Deduction & Aggregation)
        for (const item of order.items) {
            const beerName = item.beerType || item.name;

            // --- Stock Logic ---
            if (!isLocal) {
                if (item.beerVariety === 'Variado') {
                    const slotsToDeduct = item.slots && item.slots.length > 0 ? item.slots : [beerName];
                    for (const slotBeer of slotsToDeduct) {
                        if (slotBeer) await deductStock(slotBeer, 'Unidad', item.subtype, 1);
                    }
                } else {
                    await deductStock(beerName, item.emission, item.subtype, item.quantity || 1);
                }
            }

            // --- Pricing Aggregation ---
            if (isLocal) {
                // Determine actual beer for each slot (could be mixed in future, but currently grouped by Item)
                const slotsToCount = item.slots || [];
                for (const slotBeer of slotsToCount) {
                    if (slotBeer) {
                        // We aggregate by the ACTUAL beer in the slot (allows mix handling if logic existed)
                        // Currently item.subtype is uniform for the item row.
                        const key = `${slotBeer}_${item.subtype}`;
                        localConsumptionMap[key] = (localConsumptionMap[key] || 0) + 1;
                    }
                }
            } else {
                // Takeaway Logic (Standard)
                if (item.beerVariety === 'Variado' && item.composition) {
                    finalTotalBs += (item.unitPriceBs || 0) * (item.quantity || 1);
                    finalTotalUsd += (item.unitPriceUsd || 0) * (item.quantity || 1);
                } else {
                    const priceBs = getBsPrice(beerName, item.emission, item.subtype, 'standard');
                    const priceUsd = getPrice(beerName, item.emission, item.subtype, 'standard');
                    finalTotalBs += priceBs * (item.quantity || 1);
                    finalTotalUsd += priceUsd * (item.quantity || 1);
                }
            }
        }

        // 2. Calculate Optimized Price for Local Orders ("Best Price")
        if (isLocal) {
            for (const [key, totalUnits] of Object.entries(localConsumptionMap)) {
                // Key format: "BeerName_Subtype"
                const lastUnderscoreIndex = key.lastIndexOf('_');
                const beerName = key.substring(0, lastUnderscoreIndex);
                const subtype = key.substring(lastUnderscoreIndex + 1);

                let remaining = totalUnits;

                // Get Pack Sizes
                const unitsCaja = getUnitsPerEmission('Caja', subtype) || 24; // Default fallback
                const unitsMedia = getUnitsPerEmission('Media Caja', subtype) || 12;
                const unitsSix = getUnitsPerEmission('Six Pack', subtype) || 6;
                const isLata = subtype.toLowerCase().includes('lata');

                console.log(`Optimizing ${beerName} (${subtype}): Total ${remaining}. C=${unitsCaja}, M=${unitsMedia}`);

                // --- Greedy Decomposition ---

                // 1. Cajas
                if (unitsCaja > 1) {
                    const numCajas = Math.floor(remaining / unitsCaja);
                    if (numCajas > 0) {
                        const pBs = getBsPrice(beerName, 'Caja', subtype, 'local');
                        const pUsd = getPrice(beerName, 'Caja', subtype, 'local');
                        finalTotalBs += numCajas * pBs;
                        finalTotalUsd += numCajas * pUsd;
                        remaining %= unitsCaja;
                    }
                }

                // 2. Media Cajas
                if (unitsMedia > 1) {
                    const numMedias = Math.floor(remaining / unitsMedia);
                    if (numMedias > 0) {
                        const pBs = getBsPrice(beerName, 'Media Caja', subtype, 'local');
                        const pUsd = getPrice(beerName, 'Media Caja', subtype, 'local');
                        finalTotalBs += numMedias * pBs;
                        finalTotalUsd += numMedias * pUsd;
                        remaining %= unitsMedia;
                    }
                }

                // 3. Six Packs (Only for Latas)
                if (isLata && unitsSix > 1) {
                    const numSix = Math.floor(remaining / unitsSix);
                    if (numSix > 0) {
                        const pBs = getBsPrice(beerName, 'Six Pack', subtype, 'local');
                        const pUsd = getPrice(beerName, 'Six Pack', subtype, 'local');
                        finalTotalBs += numSix * pBs;
                        finalTotalUsd += numSix * pUsd;
                        remaining %= unitsSix;
                    }
                }

                // 4. Units (Remainder)
                if (remaining > 0) {
                    const pBs = getBsPrice(beerName, 'Unidad', subtype, 'local');
                    const pUsd = getPrice(beerName, 'Unidad', subtype, 'local');
                    finalTotalBs += remaining * pBs;
                    finalTotalUsd += remaining * pUsd;
                }
            }
        }

        // 3. Update to PAID with Totals
        let orderToClose = null;
        setPendingOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                orderToClose = {
                    ...o,
                    status: 'PAID',
                    closedAt: new Date().toISOString(),
                    paymentMethod,
                    reference,
                    totalAmountBs: finalTotalBs,
                    totalAmountUsd: finalTotalUsd
                };
                return orderToClose;
            }
            return o;
        }));

        console.log("Order Closed & Stock Updated. Optimized Total:", finalTotalBs);
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
                    alert(`⚠️ Stock insuficiente para ${content}`);
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
        setPendingOrders(prev => prev.map(o => {
            if (o.id !== orderId) return o;

            const newItems = [...o.items];
            const currentItem = newItems[itemIndex];
            const newSlots = currentItem.slots ? [...currentItem.slots] : [];

            newSlots[slotIndex] = content;
            // For Libre, we don't want holes, we want a compact list
            const finalSlots = currentItem.emission === 'Libre' ? newSlots.filter(s => s !== null) : newSlots;
            newItems[itemIndex] = { ...currentItem, slots: finalSlots };

            return { ...o, items: newItems };
        }));
    };

    return (
        <OrderContext.Provider value={{
            pendingOrders,
            createOrder,
            addItemToOrder,
            removeItemFromOrder,
            closeOrder,
            cancelOrder,
            updateOrderItemSlot
        }}>
            {children}
        </OrderContext.Provider>
    );
};
