import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
// import { useRealtime } from '../hooks/useRealtime'; // REMOVED
import { supabase } from '../supabaseClient';
import {
    fetchProducts, createProduct, updateProduct,
    fetchInventory, upsertInventory,
    fetchPrices, upsertPrice,
    fetchSettings, fetchEmissions, fetchSales, upsertEmission,
    deleteProduct, deleteEmission,
    fetchCostPrices, upsertCostPrice, upsertSetting,
    fetchInventoryHistory, createInventoryHistory,
    fetchWasteReports, createWasteReport,
    resetDatabase
} from '../services/api';
import { fetchCurrentRates } from '../services/ratesClient';

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const { user, organizationId } = useAuth();
    const { showNotification } = useNotification();

    // --- MAIN CURRENCY & STATE ---
    const [mainCurrency, setMainCurrency] = useState('USD');
    const [beerTypes, setBeerTypes] = useState([]);
    const [beerColors, setBeerColors] = useState({});
    const [beerCategories, setBeerCategories] = useState({});
    const [productMap, setProductMap] = useState({});
    const [rawEmissions, setRawEmissions] = useState([]);
    const [emissionOptions, setEmissionOptions] = useState(['Unidad', 'Caja', 'Media Caja']);
    const [subtypes, setSubtypes] = useState(['Botella', 'Botella Tercio', 'Lata Pequeña', 'Lata Grande']);
    const [prices, setPrices] = useState({});
    const [pendingPrices, setPendingPrices] = useState({});
    const [costPrices, setCostPrices] = useState({});
    const [pendingCostPrices, setPendingCostPrices] = useState({});
    const [inventory, setInventory] = useState({});
    const [conversions, setConversions] = useState({});
    const [exchangeRates, setExchangeRates] = useState({ bcv: 0, custom: 0, euro: 0, history: [], lastUpdate: null });
    const [inventoryHistory, setInventoryHistory] = useState([]);
    const [breakageHistory, setBreakageHistory] = useState([]);
    const [pendingInventory, setPendingInventory] = useState({});
    const [pendingWaste, setPendingWaste] = useState({});
    const [loading, setLoading] = useState(true);

    const getCurrencySymbol = (mode) => {
        if (mode === 'USD') return '$';
        if (mode === 'EUR') return '€';
        if (mode === 'CUSTOM') return '$'; // Special symbol for custom rate
        return '$';
    };

    const currencySymbol = getCurrencySymbol(mainCurrency);

    // --- MOCK DATA SYNC ---
    useEffect(() => {
        if (!organizationId) {
            setLoading(false);
            return;
        }

        const fetchInitialData = async () => {
            // SILENT UPDATE: Only show loading if we have NO data yet (e.g. no beer types loaded)
            const isInitialLoad = beerTypes.length === 0;
            if (isInitialLoad) setLoading(true);

            try {
                // 1. Fetch ALL data in parallel (Atomic & Fast)
                const [
                    productsRes,
                    settingsRes,
                    emissionsRes,
                    inventoryRes,
                    pricesRes,
                    costsRes,
                    invHistoryRes,
                    wasteHistoryRes
                ] = await Promise.all([
                    fetchProducts(organizationId),
                    fetchSettings(organizationId),
                    fetchEmissions(organizationId),
                    fetchInventory(organizationId),
                    fetchPrices(organizationId),
                    fetchCostPrices(organizationId),
                    fetchInventoryHistory(organizationId),
                    fetchWasteReports(organizationId)
                ]);

                // Validate critical data (Products) - if this fails, we don't proceed with partial updates
                if (productsRes.error || !productsRes.data) {
                    console.error("❌ [ProductContext] Failed to fetch products, skipping sync.");
                    return;
                }

                // 2. Build local maps
                const products = productsRes.data;
                const localIdMap = {};
                const localProdMap = {};
                const localColors = {};
                const localCats = {};
                const localBeerTypes = products.map(p => {
                    const name = (p.name || '').trim();
                    localIdMap[p.id] = name;
                    localProdMap[name] = p.id;
                    if (p.color) localColors[name] = p.color;
                    localCats[name] = p.category;
                    return name;
                });

                // 3. Process Inventory, Prices, Costs using localIdMap
                const localInvMap = {};
                (inventoryRes.data || []).forEach(item => {
                    const name = localIdMap[item.product_id];
                    if (name) localInvMap[`${name}_${(item.subtype || '').trim()}`] = item.quantity;
                });

                const localPriceMap = {};
                (pricesRes.data || []).forEach(p => {
                    const name = localIdMap[p.product_id];
                    if (name) {
                        const suffix = p.is_local ? '_local' : '';
                        const emission = (p.p_emission || p.emission || '').trim();
                        const subtype = (p.subtype || '').trim();
                        localPriceMap[`${name}_${emission}_${subtype}${suffix}`] = Number(p.price);
                    }
                });

                const localCostMap = {};
                (costsRes.data || []).forEach(c => {
                    const name = localIdMap[c.product_id];
                    if (name) {
                        const emission = (c.emission || '').trim();
                        const subtype = (c.subtype || '').trim();
                        localCostMap[`${name}_${emission}_${subtype}`] = Number(c.cost);
                    }
                });

                // 4. Settings & Conversions
                const settings = settingsRes.data || [];
                const emissions = emissionsRes.data || [];
                const localConvMap = {};
                emissions.forEach(e => {
                    if (e.name && e.subtype && e.units) {
                        localConvMap[`${e.name.trim()}_${e.subtype.trim()}`] = e.units;
                    }
                });

                // 5. ATOMIC STATE UPDATE
                // We update all at once to ensure consistency
                setBeerTypes(localBeerTypes);
                setBeerColors(localColors);
                setBeerCategories(localCats);
                setProductMap(localProdMap);
                setInventory(localInvMap);
                setPrices(localPriceMap);
                setCostPrices(localCostMap);
                setConversions(localConvMap);
                setRawEmissions(emissions);

                if (emissions.length > 0) {
                    const opts = ['Unidad', ...emissions.map(e => e.name.trim()).filter(n => n !== 'Unidad')];
                    setEmissionOptions(Array.from(new Set(opts)));
                }

                if (settings.length > 0) {
                    const cur = settings.find(s => s.key === 'mainCurrency');
                    if (cur) setMainCurrency(cur.value);
                    const rates = settings.find(s => s.key === 'exchangeRates');
                    if (rates) setExchangeRates(rates.value);
                    const sub = settings.find(s => s.key === 'subtypes');
                    if (sub) setSubtypes(sub.value);
                }

                if (invHistoryRes.data) setInventoryHistory(invHistoryRes.data.slice(0, 50));
                if (wasteHistoryRes.data) setBreakageHistory(wasteHistoryRes.data.slice(0, 50));

                console.log("✅ [ProductContext] Atomic sync complete.");

            } catch (error) {
                console.error("❌ [ProductContext] Fatal error during sync:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();

        // Auto-refresh when app comes back to foreground
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("🔄 App visible - Refreshing data...");
                fetchInitialData();
            }
        };

        const handleFocus = () => {
            console.log("🔄 App focused - Refreshing data...");
            fetchInitialData();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
        };
    }, [organizationId]);


    // --- DEV ONLY: Expose setters for DevTools ---
    useEffect(() => {
        window.__DEV_SET_INVENTORY__ = setInventory;
        window.__DEV_SET_BEER_TYPES__ = setBeerTypes;
        window.__DEV_SET_BEER_COLORS__ = setBeerColors;
        window.__DEV_SET_RAW_EMISSIONS__ = setRawEmissions;
        window.__DEV_SET_EMISSION_OPTIONS__ = setEmissionOptions;
        window.__DEV_SET_SUBTYPES__ = setSubtypes;
        window.__DEV_SET_PRICES__ = setPrices;
        window.__DEV_SET_COST_PRICES__ = setCostPrices;
        window.__DEV_SET_INV_HISTORY__ = setInventoryHistory;
        window.__DEV_SET_WASTE_HISTORY__ = setBreakageHistory;
        return () => {
            delete window.__DEV_SET_INVENTORY__;
            delete window.__DEV_SET_BEER_TYPES__;
            delete window.__DEV_SET_BEER_COLORS__;
            delete window.__DEV_SET_RAW_EMISSIONS__;
            delete window.__DEV_SET_EMISSION_OPTIONS__;
            delete window.__DEV_SET_SUBTYPES__;
            delete window.__DEV_SET_PRICES__;
            delete window.__DEV_SET_COST_PRICES__;
            delete window.__DEV_SET_INV_HISTORY__;
            delete window.__DEV_SET_WASTE_HISTORY__;
        };
    }, []);

    // --- REALTIME SYNC (Active for Phone/PC Sync) ---
    useEffect(() => {
        if (!organizationId) return;

        // 1. Subscribe to Channels
        const channel = supabase
            .channel(`db-changes-${organizationId}`)
            // PRODUCTS
            .on('postgres_changes', { event: '*', schema: 'public', table: 'products', filter: `organization_id=eq.${organizationId}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setBeerTypes(prev => Array.from(new Set([...prev, payload.new.name])));
                    if (payload.new.category) setBeerCategories(prev => ({ ...prev, [payload.new.name]: payload.new.category }));
                    setProductMap(prev => ({ ...prev, [payload.new.name]: payload.new.id }));
                    if (payload.new.color) setBeerColors(prev => ({ ...prev, [payload.new.name]: payload.new.color }));
                } else if (payload.eventType === 'UPDATE') {
                    if (payload.new.color) setBeerColors(prev => ({ ...prev, [payload.new.name]: payload.new.color }));
                    if (payload.new.category) setBeerCategories(prev => ({ ...prev, [payload.new.name]: payload.new.category }));
                } else if (payload.eventType === 'DELETE') {
                    // Handle delete if needed
                }
            })
            // INVENTORY
            .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory', filter: `organization_id=eq.${organizationId}` }, (payload) => {
                // We need to resolve product_id to name. Since we have productMap, we can attempt it,
                // but if productMap isn't updated, we might need a reverse map.
                // Let's use the current state to update.
                const findProductName = (id) => Object.keys(productMap).find(name => productMap[name] === id);

                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const name = findProductName(payload.new.product_id);
                    if (name) {
                        setInventory(prev => ({ ...prev, [`${name}_${payload.new.subtype}`]: payload.new.quantity }));
                    }
                }
            })
            // PRICES
            .on('postgres_changes', { event: '*', schema: 'public', table: 'prices', filter: `organization_id=eq.${organizationId}` }, (payload) => {
                const findProductName = (id) => Object.keys(productMap).find(name => productMap[name] === id);
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const name = findProductName(payload.new.product_id);
                    if (name) {
                        const suffix = payload.new.is_local ? '_local' : '';
                        const key = `${name}_${payload.new.emission}_${payload.new.subtype}${suffix}`;
                        setPrices(prev => ({ ...prev, [key]: Number(payload.new.price) }));
                    }
                }
            })
            // EMISSIONS (CONVERSIONS)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'emission_types', filter: `organization_id=eq.${organizationId}` }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const key = `${payload.new.name}_${payload.new.subtype}`;
                    setConversions(prev => ({ ...prev, [key]: payload.new.units }));
                    // Also update rawEmissions for the selector
                    setRawEmissions(prev => {
                        const idx = prev.findIndex(e => e.id === payload.new.id);
                        if (idx >= 0) {
                            const copy = [...prev];
                            copy[idx] = payload.new;
                            return copy;
                        }
                        return [...prev, payload.new];
                    });
                } else if (payload.eventType === 'DELETE') {
                    // Update rawEmissions
                    setRawEmissions(prev => prev.filter(e => e.id !== payload.old.id));
                }
            })
            // COST PRICES
            .on('postgres_changes', { event: '*', schema: 'public', table: 'cost_prices', filter: `organization_id=eq.${organizationId}` }, (payload) => {
                const findProductName = (id) => Object.keys(productMap).find(name => productMap[name] === id);
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    const name = findProductName(payload.new.product_id);
                    if (name) {
                        setCostPrices(prev => ({ ...prev, [`${name}_${payload.new.emission}_${payload.new.subtype}`]: Number(payload.new.cost) }));
                    }
                }
            })
            // ORGANIZATION SETTINGS
            .on('postgres_changes', { event: '*', schema: 'public', table: 'organization_settings', filter: `organization_id=eq.${organizationId}` }, (payload) => {
                if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                    if (payload.new.key === 'mainCurrency') setMainCurrency(payload.new.value);
                    if (payload.new.key === 'exchangeRates') setExchangeRates(payload.new.value);
                    if (payload.new.key === 'subtypes') setSubtypes(payload.new.value);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [organizationId, productMap]);

    // --- PRODUCT MANAGEMENT ---
    const addBeerType = async (name, color, category = 'Botella') => {
        if (!organizationId) throw new Error("No estás conectado a una organización.");
        if (!beerTypes.includes(name)) {
            console.log('[addBeerType] Creating product:', { name, category, organization_id: organizationId });

            // Pass color and category to the API
            const { data, error } = await createProduct({ name, color, category, organization_id: organizationId });

            if (error) {
                console.error('[addBeerType] Supabase Error:', error);
                throw new Error(error.message || 'Error al crear el producto en la base de datos');
            }

            if (data) {
                console.log('[addBeerType] Product created successfully:', data);
                setBeerTypes(prev => [...prev, name]);
                setProductMap(prev => ({ ...prev, [name]: data.id }));
                setBeerCategories(prev => ({ ...prev, [name]: category }));
                if (color) setBeerColors(prev => ({ ...prev, [name]: color }));
            }
        } else {
            // OPTIONAL: If it already exists, maybe we update the category if it's different?
            // For now, let's keep it simple as requested.
            console.log('[addBeerType] Product already exists:', name);
        }
    };

    const updateBeerColor = async (name, color) => {
        setBeerColors(prev => ({ ...prev, [name]: color }));
        const productId = productMap[name];
        if (productId) {
            await updateProduct(productId, { color });
        }
    };

    const removeBeerType = async (name) => {
        const productId = productMap[name];
        if (!productId) return;

        // Optimistic UI update
        setBeerTypes(prev => prev.filter(b => b !== name));
        setBeerCategories(prev => {
            const { [name]: _, ...rest } = prev;
            return rest;
        });

        // Delete from DB
        try {
            await deleteProduct(productId);
        } catch (error) {
            console.error("Error deleting product from DB:", error);
            // Optional: Revert state if critical, but for now we log
        }
    };

    const getBeerColor = (beerName) => {
        const hex = beerColors[beerName];
        if (!hex) return { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB', raw: '#9CA3AF' };
        const r = parseInt(hex.substr(1, 2), 16);
        const g = parseInt(hex.substr(3, 2), 16);
        const b = parseInt(hex.substr(5, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        const textColor = (yiq >= 128) ? '#1f2937' : '#ffffff';
        return { bg: hex, text: textColor, border: 'rgba(0,0,0,0.1)', raw: hex };
    };

    // --- 2. EMISSION TYPES ---
    // --- 2. EMISSION TYPES ---
    const addEmissionType = async (name, units = 1, subtype = 'Botella') => {
        // Validation: Six Pack only for Latas
        if (name.toLowerCase().trim() === 'six pack' && !subtype.toLowerCase().includes('lata')) {
            return { success: false, error: "El Six Pack es exclusivo para Latas" };
        }

        // Allow same name for different subtypes (e.g. "Pack" for Bottle vs "Pack" for Can)
        // But check if it already exists for THIS subtype.
        const exists = rawEmissions.some(e => e.name === name && e.subtype === subtype);
        if (!exists) {
            try {
                // Real insert if connected
                if (organizationId) {
                    await upsertEmission({
                        organization_id: organizationId,
                        name,
                        units: parseInt(units),
                        subtype
                    });
                }

                const newEmission = { id: Date.now(), name, units: parseInt(units), subtype };
                const updated = [...rawEmissions, newEmission];
                setRawEmissions(updated);

                // Update simpler list unique names
                if (!emissionOptions.includes(name)) {
                    setEmissionOptions(prev => [...prev, name]);
                }

                // Sync with DB is priority
                return { success: true };
            } catch (error) {
                console.error("Error creating emission:", error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: "Ya existe para este subtipo" };
    };

    const removeEmissionType = async (name, subtype) => {
        if (['Caja', 'Media Caja', 'Unidad', 'Six Pack'].includes(name)) {
            showNotification('No se puede eliminar la emisión base.', 'error');
            return;
        }

        const isLataQuery = subtype && subtype.toLowerCase().includes('lata');

        try {
            // Find ALL items matching this name and subtype category
            const matches = rawEmissions.filter(e => {
                const emissionSubtype = (e.subtype || '').toLowerCase();
                const isMatch = e.subtype === subtype || (isLataQuery && emissionSubtype.includes('lata'));
                return e.name === name && isMatch;
            });

            if (matches.length === 0) return;

            // Remove from local state
            const updated = rawEmissions.filter(e => !matches.some(m => m.id === e.id));
            setRawEmissions(updated);

            // Update emissionOptions if no more emissions with this name exist
            const stillUsed = updated.some(e => e.name === name);
            if (!stillUsed) {
                setEmissionOptions(prev => prev.filter(e => e !== name));
            }

            // Delete from DB in parallel
            await Promise.all(matches.map(item => {
                if (item.id) return deleteEmission(item.id);
                return Promise.resolve();
            }));

        } catch (error) {
            console.error("Error removing emission:", error);
            showNotification('Error eliminando emisión', 'error');
        }
    };

    // NEW: Helper to get emissions relevant for a subtype (plus globals)
    const getEmissionsForSubtype = React.useCallback((subtype) => {
        const globals = ['Unidad', 'Media Caja', 'Caja'];
        const targetSubtype = (subtype || '').toLowerCase();
        const isLataQuery = targetSubtype.includes('lata');

        // Auto-add Six Pack for any Lata variant
        if (isLataQuery) {
            globals.push('Six Pack');
        }

        const custom = (rawEmissions || [])
            .filter(e => {
                const emissionSubtype = (e.subtype || '').toLowerCase();

                // Logic: 
                // 1. Strict match OR
                // 2. If query is a Lata variant, match any other Lata variant (includes "Lata" generic)
                const isMatch = e.subtype === subtype || (isLataQuery && emissionSubtype.includes('lata'));

                const isSixPack = e.name && e.name.toLowerCase().trim() === 'six pack';
                return isMatch && !isSixPack;
            })
            .map(e => e.name);

        const merged = Array.from(new Set([...globals, ...custom]));

        // FIX: Filter out emissions that are actually Beer Types (user error protection)
        // But preserve reserved system emissions
        const reservedKeywords = ['Unidad', 'Caja', 'Media Caja', 'Six Pack', 'Pack', 'Bulto'];

        return merged.filter(name => {
            const lowerName = name.toLowerCase().trim();
            // Always allow reserved keywords
            if (reservedKeywords.some(k => k.toLowerCase() === lowerName)) return true;

            // Remove "Six Pack" if not lata
            if (!isLataQuery && lowerName === 'six pack') return false;

            // Filter out if it matches a Beer Type
            const isBeer = beerTypes.some(b => b.toLowerCase() === lowerName);
            if (isBeer) return false;

            return true;
        });
    }, [rawEmissions, beerTypes]);

    // --- COST & NET PROFIT MANAGEMENT ---

    const updateCostPrice = async (beer, emission, subtype, cost) => {
        const key = `${beer}_${emission}_${subtype}`;
        const newCost = parseFloat(cost);
        setCostPrices(prev => ({ ...prev, [key]: newCost }));

        const productId = productMap[beer];
        if (productId && organizationId) {
            await upsertCostPrice({
                organization_id: organizationId,
                product_id: productId,
                emission,
                subtype,
                cost: newCost
            });
        }
    };

    const updatePendingCostPrice = (beer, emission, subtype, cost) => {
        const key = `${beer}_${emission}_${subtype}`;
        const newCost = parseFloat(cost);

        if (isNaN(newCost) || newCost === getCostPrice(beer, emission, subtype)) {
            setPendingCostPrices(prev => {
                const { [key]: _, ...rest } = prev;
                return rest;
            });
        } else {
            setPendingCostPrices(prev => ({ ...prev, [key]: newCost }));
        }
    };

    const getPendingCostPrice = (beer, emission, subtype) => {
        const key = `${beer}_${emission}_${subtype}`;
        return pendingCostPrices[key];
    };

    const hasPendingCostPrice = (beer, emission, subtype) => {
        const key = `${beer}_${emission}_${subtype}`;
        return pendingCostPrices.hasOwnProperty(key);
    };

    const getCostPrice = (beer, emission, subtype) => {
        // Goal: Return the TOTAL COST for the requested emission quantity.
        // Robustness: Handle trimming and case-insensitive lookups if strict fail.

        const sanitize = (str) => (str || '').toString().trim();
        const b = sanitize(beer);
        const e = sanitize(emission) || 'Unidad';
        const s = sanitize(subtype) || 'Botella';

        const targetUnits = getUnitsPerEmission(e, s);

        // --- Helper: Robust Lookup in costPrices ---
        const findCostInMap = (qBeer, qEmission, qSubtype) => {
            // 1. Strict Match (Fastest)
            const strictKey = `${qBeer}_${qEmission}_${qSubtype}`;
            if (costPrices[strictKey] > 0) return costPrices[strictKey];

            // 2. Case Insensitive Loop (Slower but safer)
            const qB = qBeer.toLowerCase();
            const qE = qEmission.toLowerCase();
            const qS = qSubtype.toLowerCase();

            const foundKey = Object.keys(costPrices).find(k => {
                const parts = k.split('_');
                // Ensure we have at least 3 parts. 
                // Product Name might contain underscores, so we take last 2 as emission/subtype.
                if (parts.length < 3) return false;

                const kS = parts.pop();
                const kE = parts.pop();
                const kB = parts.join('_'); // Rejoin the rest as product name

                return kB.toLowerCase() === qB &&
                    kE.toLowerCase() === qE &&
                    kS.toLowerCase() === qS;
            });

            if (foundKey && costPrices[foundKey] > 0) return costPrices[foundKey];
            return 0;
        };

        // 1. Direct Lookup
        const directCost = findCostInMap(b, e, s);
        if (directCost > 0) return directCost;

        // 2. Derive from 'Caja' (Common Source of Truth)
        if (e !== 'Caja') {
            const cajaCost = findCostInMap(b, 'Caja', s);
            if (cajaCost > 0) {
                const unitsInCaja = getUnitsPerEmission('Caja', s);
                // Validate to avoid division by zero
                if (unitsInCaja > 0) {
                    return (cajaCost / unitsInCaja) * targetUnits;
                }
            }
        }

        // 3. Try other emissions to derive cost
        const emissionsToCheck = ['Media Caja', 'Six Pack', 'Unidad', 'Pack', 'Bulto'];
        for (const em of emissionsToCheck) {
            if (em === e || em === 'Caja') continue; // Skip self and already checked Caja

            const otherCost = findCostInMap(b, em, s);
            if (otherCost > 0) {
                const unitsInOther = getUnitsPerEmission(em, s);
                if (unitsInOther > 0) {
                    return (otherCost / unitsInOther) * targetUnits;
                }
            }
        }

        // 4. Last Resort: Try 'Unidad' specifically (common fallback)
        if (e !== 'Unidad') {
            const unitCost = findCostInMap(b, 'Unidad', s);
            if (unitCost > 0) {
                return unitCost * targetUnits;
            }
        }

        return 0;
    };

    // Helper to get the best "Unit Cost" for calculations (Inventory Valuation)
    const getBestUnitCost = (beer, subtype) => {
        const sanitize = (str) => (str || '').toString().trim();
        const b = sanitize(beer);
        const s = sanitize(subtype) || 'Botella';

        // --- Helper: Robust Lookup (Same as above, localized) ---
        const findCostInMap = (qBeer, qEmission, qSubtype) => {
            const strictKey = `${qBeer}_${qEmission}_${qSubtype}`;
            if (costPrices[strictKey] > 0) return costPrices[strictKey];

            const qB = qBeer.toLowerCase();
            const qE = qEmission.toLowerCase();
            const qS = qSubtype.toLowerCase();

            const foundKey = Object.keys(costPrices).find(k => {
                const parts = k.split('_');
                if (parts.length < 3) return false;
                const kS = parts.pop();
                const kE = parts.pop();
                const kB = parts.join('_');
                return kB.toLowerCase() === qB && kE.toLowerCase() === qE && kS.toLowerCase() === qS;
            });

            if (foundKey && costPrices[foundKey] > 0) return costPrices[foundKey];
            return 0;
        };

        const emissionsToCheck = ['Caja', 'Media Caja', 'Six Pack', 'Unidad', 'Pack', 'Bulto'];

        for (const em of emissionsToCheck) {
            const cost = findCostInMap(b, em, s);
            if (cost > 0) {
                const units = getUnitsPerEmission(em, s);
                if (units > 0) return cost / units;
            }
        }
        return 0;

    };

    const getInventoryAssetValue = () => {
        let totalValue = 0;
        // Inventory keys are `${beer}_${subtype}` -> quantity (units)
        Object.entries(inventory).forEach(([key, quantity]) => {
            if (quantity <= 0) return;

            // Split key carefully
            // Assuming format Name_Subtype. 
            // If Name has underscore, we fail?
            // Existing logic in `checkAggregateStock` implies `inventory` keys are constructed reliably?
            // Let's use the known `beerTypes` to match safely.

            let beer = '';
            let subtype = '';

            // Find matching beer name from key start
            const match = beerTypes.find(b => key.startsWith(b + '_'));
            if (match) {
                beer = match;
                subtype = key.slice(beer.length + 1);
            } else {
                // Fallback split
                const parts = key.split('_');
                subtype = parts.pop();
                beer = parts.join('_');
            }

            const unitCost = getBestUnitCost(beer, subtype);
            totalValue += quantity * unitCost;
        });
        return totalValue;
    };

    // --- PRICES & CONVERSIONS ---
    const updatePrice = async (beer, emission, subtype, price, isLocal = false) => {
        const suffix = isLocal ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        const newPrice = parseFloat(price);
        setPrices(prev => ({ ...prev, [key]: newPrice }));

        // NOTIFICATION - Removed to use local Popup instead as requested
        // showNotification(`Precio actualizado: ${beer} (${emission}) - $${newPrice}`, 'success');

        const productId = productMap[beer];
        if (productId && organizationId) {
            // Real Upsert to Database
            await upsertPrice({
                organization_id: organizationId,
                product_id: productId,
                emission,
                subtype,
                price: newPrice,
                is_local: isLocal
            });
        }
    };

    const getPrice = React.useCallback((beer, emission, subtype, mode = 'standard') => {
        const suffix = mode === 'local' ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        let price = prices[key];
        if (mode === 'local' && (price === undefined || price === null)) {
            const standardKey = `${beer}_${emission}_${subtype}`;
            price = prices[standardKey];
        }
        return price || 0;
    }, [prices]);

    const updateConversion = async (emission, units, subtype) => {
        const key = `${emission}_${subtype}`;
        const newUnits = parseInt(units, 10);
        setConversions(prev => ({ ...prev, [key]: newUnits }));

        if (organizationId) {
            await upsertEmission({
                organization_id: organizationId,
                name: emission,
                subtype,
                units: newUnits
            });
        }
    };

    // --- PENDING PRICE MANAGEMENT ---
    const updatePendingPrice = (beer, emission, subtype, price, isLocal = false) => {
        const suffix = isLocal ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        const newPrice = parseFloat(price);

        if (isNaN(newPrice) || newPrice === getPrice(beer, emission, subtype, isLocal ? 'local' : 'standard')) {
            // Remove from pending if same as current or invalid
            setPendingPrices(prev => {
                const { [key]: _, ...rest } = prev;
                return rest;
            });
        } else {
            setPendingPrices(prev => ({ ...prev, [key]: newPrice }));
        }
    };

    const getPendingPrice = (beer, emission, subtype, mode = 'standard') => {
        const suffix = mode === 'local' ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        return pendingPrices[key];
    };

    const hasPendingPrice = (beer, emission, subtype, mode = 'standard') => {
        const suffix = mode === 'local' ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        return pendingPrices.hasOwnProperty(key);
    };

    const commitPriceChanges = async () => {
        const changes = [];
        const now = new Date().toLocaleString('es-VE', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        for (const [key, newPrice] of Object.entries(pendingPrices)) {
            const parts = key.split('_');
            const isLocal = parts[parts.length - 1] === 'local';

            let beer, emission, subtype;
            if (isLocal) {
                // Remove 'local' suffix and reconstruct
                parts.pop(); // Remove 'local'
                subtype = parts.pop();
                emission = parts.pop();
                beer = parts.join('_');
            } else {
                subtype = parts.pop();
                emission = parts.pop();
                beer = parts.join('_');
            }

            const oldPrice = getPrice(beer, emission, subtype, isLocal ? 'local' : 'standard');

            // Save to database
            await updatePrice(beer, emission, subtype, newPrice, isLocal);

            changes.push({
                beer,
                emission,
                subtype,
                type: isLocal ? 'Local' : 'Para Llevar',
                oldPrice,
                newPrice
            });
        }

        // Commit Pending Cost Prices
        for (const [key, newCost] of Object.entries(pendingCostPrices)) {
            const parts = key.split('_');
            const subtype = parts.pop();
            const emission = parts.pop();
            const beer = parts.join('_');

            await updateCostPrice(beer, emission, subtype, newCost);

            changes.push({
                beer,
                emission,
                subtype,
                type: 'Costo',
                oldPrice: getCostPrice(beer, emission, subtype),
                newPrice: newCost
            });
        }

        // Clear pending
        setPendingPrices({});
        setPendingCostPrices({});

        return {
            timestamp: now,
            changes,
            totalChanges: changes.length
        };
    };

    const clearPendingPrices = () => {
        setPendingPrices({});
        setPendingCostPrices({});
    };

    const getUnitsPerEmission = (emission, subtype) => {
        if (!emission || emission === 'Unidad') return 1;
        if (emission === 'Libre') return 1;
        if (emission === 'Six Pack') return 6;

        const conversionKey = `${emission}_${subtype}`;
        if (conversions[conversionKey]) return conversions[conversionKey];

        const targetSubtype = (subtype || '').toLowerCase();
        const isLataQuery = targetSubtype.includes('lata');

        const dbEmission = rawEmissions.find(e => {
            const emissionSubtype = (e.subtype || '').toLowerCase();
            const isMatch = e.subtype === subtype || (isLataQuery && emissionSubtype.includes('lata'));
            return e.name === emission && isMatch;
        });
        if (dbEmission && dbEmission.units) return dbEmission.units;

        const legacy = rawEmissions.find(e => e.name === emission && !e.subtype);
        if (legacy && legacy.units) return legacy.units;

        if (emission === 'Caja') {
            if (subtype && subtype.toLowerCase().includes('lata')) return 24;
            if (subtype === 'Botella Tercio') return 24;
            return 36;
        }
        if (emission === 'Media Caja') {
            if (subtype && subtype.toLowerCase().includes('lata')) return 12;
            if (subtype === 'Botella Tercio') return 12;
            return 18;
        }
        return 1;
    };

    // --- EXCHANGE RATES ---

    const updateCustomRate = async (value) => {
        const rawValue = value.toString().replace(/,/g, '');
        if (rawValue === '') {
            setExchangeRates(prev => ({ ...prev, custom: 0 }));
            return;
        }
        const newVal = parseFloat(rawValue);
        if (isNaN(newVal)) return;

        const updated = { ...exchangeRates, custom: newVal };
        setExchangeRates(updated);

        if (organizationId) {
            await upsertSetting(organizationId, 'exchangeRates', updated);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const fetchRates = async () => {
        try {
            // Usando el nuevo cliente de Supabase secundario
            const { data: rates, error } = await fetchCurrentRates();

            if (error || !rates) {
                console.error('[ProductContext] Error fetching rates from secondary Supabase:', error);
                // Fallback: mantener tasas actuales si hay error
                return;
            }

            const updated = {
                ...exchangeRates,
                bcv: rates.usd,
                euro: rates.eur,
                history: [], // No tenemos histórico en este momento
                nextRates: null,
                lastUpdate: new Date().toLocaleString()
            };

            setExchangeRates(updated);

            if (organizationId) {
                await upsertSetting(organizationId, 'exchangeRates', updated);
            }

            console.log('[ProductContext] Rates updated successfully:', { usd: rates.usd, eur: rates.eur });
        } catch (error) {
            console.error('[ProductContext] Error in fetchRates:', error);
        }
    };

    const currentRate = mainCurrency === 'USD' ? (exchangeRates.bcv || 0) : (mainCurrency === 'EUR' ? (exchangeRates.euro || 0) : (exchangeRates.custom || 0));

    const getBsPrice = (beer, emission, subtype, mode = 'standard') => {
        const basePrice = getPrice(beer, emission, subtype, mode);
        return basePrice * currentRate;
    };

    // --- INVENTORY MANAGEMENT ---
    const addStock = async (beer, emission, subtype, quantity) => {
        const units = quantity * getUnitsPerEmission(emission, subtype);
        const key = `${beer}_${subtype}`;
        const newTotal = (inventory[key] || 0) + units;
        setInventory(prev => ({ ...prev, [key]: newTotal }));

        const productId = productMap[beer];
        if (productId && organizationId) {
            await upsertInventory({ organization_id: organizationId, product_id: productId, subtype, quantity: newTotal });
        }
    };

    const deductStock = async (beer, emission, subtype, quantity) => {
        const units = quantity * getUnitsPerEmission(emission, subtype);
        const key = `${beer}_${subtype}`;
        const newTotal = Math.max(0, (inventory[key] || 0) - units);
        setInventory(prev => ({ ...prev, [key]: newTotal }));

        const productId = productMap[beer];
        if (productId && organizationId) {
            await upsertInventory({ organization_id: organizationId, product_id: productId, subtype, quantity: newTotal });
        }
    };

    const setBaseStock = async (beer, subtype, units) => {
        const key = `${beer}_${subtype}`;
        setInventory(prev => ({ ...prev, [key]: units }));

        const productId = productMap[beer];
        if (productId && organizationId) {
            await upsertInventory({ organization_id: organizationId, product_id: productId, subtype, quantity: units });
        }
    };

    const checkStock = (beer, emission, subtype, quantity) => {
        const key = `${beer}_${subtype}`;
        const required = quantity * getUnitsPerEmission(emission, subtype);
        return (inventory[key] || 0) >= required;
    };

    const getInventory = (beer, subtype) => inventory[`${beer}_${subtype}`] || 0;

    const checkAggregateStock = (emission, subtype, requiredQuantity) => {
        const totalAvailable = beerTypes.reduce((acc, beer) => acc + (inventory[`${beer}_${subtype}`] || 0), 0);
        const requiredUnits = requiredQuantity * getUnitsPerEmission(emission, subtype);
        return totalAvailable >= requiredUnits;
    };

    // --- INVENTORY & WASTE HISTORY ---

    const updatePendingInventory = (beer, subtype, emission, delta) => {
        const key = `${beer}_${subtype}_${emission}`;
        setPendingInventory(prev => ({ ...prev, [key]: (prev[key] || 0) + delta }));
    };

    const commitInventory = async () => {
        const timestamp = new Date().toLocaleString();
        let totalCount = 0;
        const movements = [];

        for (const [key, quantity] of Object.entries(pendingInventory)) {
            const parts = key.split('_');
            const emission = parts.pop();
            const subtype = parts.pop();
            const beer = parts.join('_');
            const totalUnits = quantity * getUnitsPerEmission(emission, subtype);
            await addStock(beer, emission, subtype, quantity);
            totalCount += totalUnits;
            movements.push({ beer, subtype, emission, quantity, totalUnits });
        }

        const report = { organization_id: organizationId, movements, total_units: totalCount };
        if (organizationId) await createInventoryHistory(report);

        setInventoryHistory(prev => [{ ...report, created_at: timestamp }, ...prev].slice(0, 50));
        setPendingInventory({});

        // Return the report with properly formatted data for display
        return {
            timestamp,
            totalUnits: totalCount,
            movements: movements.map(m => ({
                ...m,
                emission: m.emission // Display emission name directly
            }))
        };
    };

    const commitWaste = async () => {
        const timestamp = new Date().toLocaleString();
        let totalCount = 0;
        const movements = [];

        for (const [key, quantity] of Object.entries(pendingWaste)) {
            const parts = key.split('_');
            const emission = parts.pop();
            const subtype = parts.pop();
            const beer = parts.join('_');
            const totalUnits = quantity * getUnitsPerEmission(emission, subtype);
            await deductStock(beer, emission, subtype, quantity);
            totalCount += totalUnits;
            movements.push({ beer, subtype, emission, quantity, totalUnits });
        }

        const report = { organization_id: organizationId, movements, total_units: totalCount };
        if (organizationId) await createWasteReport(report);

        setBreakageHistory(prev => [{ ...report, created_at: timestamp }, ...prev].slice(0, 50));
        setPendingWaste({});
    };

    const reportWaste = async (beer, subtype, quantity) => {
        const totalUnits = parseInt(quantity, 10);
        await deductStock(beer, 'Unidad', subtype, totalUnits);
        const report = {
            organization_id: organizationId,
            movements: [{ beer, subtype, emission: 'Unidad', quantity: totalUnits, totalUnits }],
            total_units: totalUnits
        };
        if (organizationId) await createWasteReport(report);
        setBreakageHistory(prev => [{ ...report, created_at: new Date().toISOString() }, ...prev].slice(0, 50));
        showNotification(`Reportada Merma: ${quantity} ${beer}`, 'warning');
    };

    // --- WASTE / MERMA MANAGEMENT ---
    // const [pendingWaste, setPendingWaste] = useState({}); // Moved above
    // const [breakageHistory, setBreakageHistory] = useState(() => loadFromStorage('breakageHistory', [])); // Moved above

    const updatePendingWaste = (beer, subtype, emission, delta) => {
        const key = `${beer}_${subtype}_${emission}`;
        setPendingWaste(prev => {
            const current = prev[key] || 0;
            const newVal = Math.max(0, current + delta); // Wast cannot be negative
            if (newVal === 0) {
                const { [key]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [key]: newVal };
        });
    };

    const clearPendingWaste = () => setPendingWaste({});

    // commitWaste function moved and refactored above

    // reportWaste function moved and refactored above

    const getPendingWaste = (beer, subtype, emission) => {
        const key = `${beer}_${subtype}_${emission}`;
        return pendingWaste[key] || 0;
    };

    // useEffect(() => { localStorage.setItem('breakageHistory', JSON.stringify(breakageHistory)); }, [breakageHistory]); // REMOVED

    return (
        <ProductContext.Provider value={{
            beerTypes, addBeerType, removeBeerType, emissionOptions, addEmissionType, removeEmissionType,
            subtypes, conversions, updateConversion, prices, updatePrice, inventory, setBaseStock, addStock, deductStock,
            checkStock, getInventory, getPrice, getBsPrice, exchangeRates, fetchRates, currentRate, updateCustomRate,
            getUnitsPerEmission, pendingInventory, updatePendingInventory, clearPendingInventory: () => setPendingInventory({}),
            commitInventory, getPendingInventory: (b, s, e) => pendingInventory[`${b}_${s}_${e}`] || 0,
            setPendingInventoryValue: (b, s, e, v) => setPendingInventory(prev => ({ ...prev, [`${b}_${s}_${e}`]: v })),
            inventoryHistory, getBeerColor, updateBeerColor, productMap, checkAggregateStock, getEmissionsForSubtype,
            pendingWaste, updatePendingWaste, beerCategories,
            clearPendingWaste: () => setPendingWaste({}), commitWaste, reportWaste, breakageHistory,
            getPendingWaste: (b, s, e) => pendingWaste[`${b}_${s}_${e}`] || 0,
            costPrices, updateCostPrice, getCostPrice, getInventoryAssetValue, mainCurrency, setMainCurrency, currencySymbol,
            pendingPrices, updatePendingPrice, getPendingPrice, hasPendingPrice,
            pendingCostPrices, updatePendingCostPrice, getPendingCostPrice, hasPendingCostPrice,
            commitPriceChanges, clearPendingPrices,
            productLoading: loading,
            resetApp: async () => { await resetDatabase(); window.location.reload(); }
        }}>
            {children}
        </ProductContext.Provider>
    );
};
