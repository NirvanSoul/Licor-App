import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from './AuthContext';
import { useRealtime } from '../hooks/useRealtime';

const ProductContext = createContext();

export const useProduct = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
    const { user, organizationId } = useAuth();

    // Helper to load from storage (Fallback)
    const loadFromStorage = (key, fallback) => {
        try {
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : fallback;
        } catch (e) {
            console.error(`Error loading ${key}`, e);
            return fallback;
        }
    };

    // State Declarations
    const [beerTypes, setBeerTypes] = useState([]);
    const [beerColors, setBeerColors] = useState({});
    const [productMap, setProductMap] = useState({}); // Name -> ID

    // --- NUEVO: Estado para emisiones CRUD ---
    const [rawEmissions, setRawEmissions] = useState([]); // Objetos {id, name, units}
    const [emissionOptions, setEmissionOptions] = useState([]); // Solo Nombres (para compatibilidad UI)

    const [subtypes, setSubtypes] = useState([]);
    const [prices, setPrices] = useState({});
    const [conversions, setConversions] = useState({});
    const [inventory, setInventory] = useState({});

    // --- SUPABASE FULL SYNC ---
    useEffect(() => {
        if (!organizationId) return;

        const fetchInitialData = async () => {
            try {
                // 1. Products (Fetch Name, Color, ID)
                const { data: products } = await supabase.from('products').select('id, name, color').eq('organization_id', organizationId);

                const currentProductMap = {}; // Name -> ID
                const currentIdMap = {};      // ID -> Name

                if (products) {
                    setBeerTypes(products.map(p => p.name));
                    const colors = {};
                    products.forEach(p => {
                        if (p.color) colors[p.name] = p.color;
                        currentProductMap[p.name] = p.id;
                        currentIdMap[p.id] = p.name;
                    });
                    setBeerColors(colors);
                    setProductMap(currentProductMap);
                }

                // 2. NUEVO: Cargar Emisiones desde la tabla SQL dedicada
                const { data: emissionsData } = await supabase
                    .from('emission_types')
                    .select('*')
                    .order('units', { ascending: true }); 

                if (emissionsData) {
                    setRawEmissions(emissionsData);
                    // Aseguramos que 'Unidad' esté al principio
                    const names = ['Unidad', ...emissionsData.map(e => e.name).filter(n => n !== 'Unidad')];
                    setEmissionOptions(names);
                } else {
                    setEmissionOptions(['Unidad', 'Caja']);
                }

                // Cargar Subtipos
                const { data: settings } = await supabase.from('app_settings').select('key, value').eq('organization_id', organizationId);
                if (settings) {
                    settings.forEach(s => {
                        if (s.key === 'subtypes') setSubtypes(s.value);
                    });
                    if (!settings.find(s => s.key === 'subtypes')) {
                        setSubtypes(['Botella', 'Botella Tercio', 'Lata Pequeña', 'Lata Grande']);
                    }
                }

                // 3. Inventory (Uses product_id)
                const { data: inv } = await supabase.from('inventory').select('product_id, subtype, quantity').eq('organization_id', organizationId);
                if (inv) {
                    const invMap = {};
                    inv.forEach(item => {
                        const productName = currentIdMap[item.product_id];
                        if (productName) {
                            invMap[`${productName}_${item.subtype}`] = item.quantity;
                        }
                    });
                    setInventory(invMap);
                }

                // 4. Prices
                const { data: pr } = await supabase.from('prices').select('*').eq('organization_id', organizationId);
                if (pr) {
                    const priceMap = {};
                    pr.forEach(p => {
                        const productName = currentIdMap[p.product_id];
                        if (productName) {
                            const suffix = p.is_local ? '_local' : '';
                            priceMap[`${productName}_${p.emission}_${p.subtype}${suffix}`] = Number(p.price);
                        }
                    });
                    setPrices(priceMap);
                }

                // 5. Conversions
                const { data: conv } = await supabase.from('conversions').select('*').eq('organization_id', organizationId);
                if (conv) {
                    const convMap = {};
                    conv.forEach(c => {
                        convMap[`${c.emission}_${c.subtype}`] = c.units;
                    });
                    setConversions(convMap);
                }

            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, [organizationId]);

    // --- REALTIME ALIGNMENT ---
    useRealtime(organizationId, 'inventory', (payload) => {
        const { new: newItem, eventType } = payload;
        if (eventType === 'DELETE') return;

        const productName = Object.keys(productMap).find(key => productMap[key] === newItem.product_id);

        if (productName && newItem.subtype) {
            setInventory(prev => ({
                ...prev,
                [`${productName}_${newItem.subtype}`]: newItem.quantity
            }));
        }
    });

    // --- PRODUCT MANAGEMENT ---
    const addBeerType = async (name, color) => {
        if (!organizationId) throw new Error("No estás conectado a una organización.");
        if (!beerTypes.includes(name)) {
            const { data, error } = await supabase
                .from('products')
                .insert([{ name, color, organization_id: organizationId }])
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setBeerTypes(prev => [...prev, name]);
                setProductMap(prev => ({ ...prev, [name]: data.id }));
                if (color) setBeerColors(prev => ({ ...prev, [name]: color }));
            }
        }
    };

    const updateBeerColor = async (name, color) => {
        setBeerColors(prev => ({ ...prev, [name]: color }));
        const productId = productMap[name];
        if (productId) {
            await supabase.from('products').update({ color }).eq('id', productId);
        }
    };

    const removeBeerType = async (name) => {
        const productId = productMap[name];
        if (!productId) return;
        setBeerTypes(prev => prev.filter(b => b !== name));
        await supabase.from('products').delete().eq('id', productId);
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
    const addEmissionType = async (name, units = 1) => {
        if (!emissionOptions.includes(name)) {
            try {
                const { data, error } = await supabase
                    .from('emission_types')
                    .insert([{ name, units: parseInt(units) }])
                    .select();

                if (error) throw error;
                setRawEmissions(prev => [...prev, ...data]);
                setEmissionOptions(prev => [...prev, name]);
                return { success: true };
            } catch (error) {
                console.error("Error creating emission:", error);
                return { success: false, error: error.message };
            }
        }
        return { success: false, error: "Ya existe" };
    };

    const removeEmissionType = async (name) => {
        if (name === 'Caja' || name === 'Unidad') {
            alert('No se puede eliminar la emisión base.');
            return;
        }
        try {
            const { error } = await supabase
                .from('emission_types')
                .delete()
                .eq('name', name);

            if (error) throw error;
            setEmissionOptions(prev => prev.filter(e => e !== name));
            setRawEmissions(prev => prev.filter(e => e.name !== name));
        } catch (error) {
            console.error("Error removing emission:", error);
        }
    };

    // --- PRICES & CONVERSIONS ---
    const updatePrice = async (beer, emission, subtype, price, isLocal = false) => {
        const suffix = isLocal ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        const newPrice = parseFloat(price);
        setPrices(prev => ({ ...prev, [key]: newPrice }));

        const productId = productMap[beer];
        if (productId) {
            await supabase.from('prices').upsert({
                organization_id: organizationId,
                product_id: productId,
                emission,
                subtype,
                price: newPrice,
                is_local: isLocal
            }, { onConflict: 'organization_id, product_id, emission, subtype, is_local' });
        }
    };

    const getPrice = (beer, emission, subtype, mode = 'standard') => {
        const suffix = mode === 'local' ? '_local' : '';
        const key = `${beer}_${emission}_${subtype}${suffix}`;
        return prices[key] || 0;
    };

    const updateConversion = async (emission, units, subtype) => {
        const key = `${emission}_${subtype}`;
        const newUnits = parseInt(units, 10);
        setConversions(prev => ({ ...prev, [key]: newUnits }));
        await supabase.from('conversions').upsert({
            organization_id: organizationId,
            emission,
            subtype,
            units: newUnits
        }, { onConflict: 'organization_id, emission, subtype' });
    };

    const getUnitsPerEmission = (emission, subtype) => {
        if (!emission || emission === 'Unidad') return 1;
        if (emission === 'Libre') return 1;

        const conversionKey = `${emission}_${subtype}`;
        if (conversions[conversionKey]) return conversions[conversionKey];

        const dbEmission = rawEmissions.find(e => e.name === emission);
        if (dbEmission && dbEmission.units) return dbEmission.units;

        if (emission === 'Caja') {
            if (subtype && subtype.toLowerCase().includes('lata')) return 24;
            if (subtype && subtype.toLowerCase().includes('tercio')) return 36;
            return 12;
        }
        return 1;
    };

    // --- EXCHANGE RATES ---
    const [exchangeRates, setExchangeRates] = useState(() =>
        loadFromStorage('exchangeRates', { bcv: 0, parallel: 0, lastUpdate: null })
    );

    const fetchRates = async () => {
        try {
            const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial');
            const data = await response.json();
            if (data && data.promedio) {
                setExchangeRates({
                    bcv: data.promedio,
                    parallel: 0,
                    lastUpdate: new Date().toLocaleString()
                });
            }
        } catch (error) {
            console.error("Error fetching rates:", error);
        }
    };

    const getBsPrice = (beer, emission, subtype, mode = 'standard') => {
        const usd = getPrice(beer, emission, subtype, mode);
        return usd * (exchangeRates.bcv || 0);
    };

    // --- INVENTORY MANAGEMENT (CORREGIDO) ---
    
    const addStock = async (beer, emission, subtype, quantity) => {
        const units = quantity * getUnitsPerEmission(emission, subtype);
        const key = `${beer}_${subtype}`;
        
        // CORRECCIÓN: Calcular el nuevo total usando el estado actual DIRECTAMENTE
        // No confiamos en el callback de setInventory para obtener el valor para la DB
        const currentTotal = inventory[key] || 0;
        const newTotal = currentTotal + units;

        // 1. Actualizar UI
        setInventory(prev => ({ ...prev, [key]: newTotal }));

        // 2. Actualizar Base de Datos con el valor calculado explícitamente
        const productId = productMap[beer];
        if (productId) {
            const { error } = await supabase.from('inventory').upsert({
                organization_id: organizationId,
                product_id: productId,
                subtype,
                quantity: newTotal 
            }, { onConflict: 'organization_id, product_id, subtype' });
            
            if (error) console.error("Error guardando stock en BD:", error.message);
        }
    };

    const deductStock = async (beer, emission, subtype, quantity) => {
        const units = quantity * getUnitsPerEmission(emission, subtype);
        const key = `${beer}_${subtype}`;
        
        // CORRECCIÓN: Misma lógica para deduct
        const currentTotal = inventory[key] || 0;
        const newTotal = Math.max(0, currentTotal - units);

        setInventory(prev => ({ ...prev, [key]: newTotal }));

        const productId = productMap[beer];
        if (productId) {
            const { error } = await supabase.from('inventory').upsert({
                organization_id: organizationId,
                product_id: productId,
                subtype,
                quantity: newTotal
            }, { onConflict: 'organization_id, product_id, subtype' });

            if (error) console.error("Error guardando stock en BD:", error.message);
        }
    };

    const setBaseStock = async (beer, subtype, units) => {
        const key = `${beer}_${subtype}`;
        
        // CORRECCIÓN: Simple asignación directa
        setInventory(prev => ({ ...prev, [key]: units }));
        
        const productId = productMap[beer];
        if (productId) {
            await supabase.from('inventory').upsert({
                organization_id: organizationId,
                product_id: productId,
                subtype,
                quantity: units
            }, { onConflict: 'organization_id, product_id, subtype' });
        }
    };

    const checkStock = (beer, emission, subtype, quantity) => {
        const key = `${beer}_${subtype}`;
        const available = inventory[key] || 0;
        const required = quantity * getUnitsPerEmission(emission, subtype);
        return available >= required;
    };

    const getInventory = (beer, subtype) => {
        if (!beer || !subtype) return 0;
        const key = `${beer}_${subtype}`;
        return inventory[key] || 0;
    };

    // --- PENDING / SESSION INVENTORY ---
    const [pendingInventory, setPendingInventory] = useState({});
    const [inventoryHistory, setInventoryHistory] = useState(() => loadFromStorage('inventoryHistory', []));

    const updatePendingInventory = (beer, subtype, delta) => {
        const key = `${beer}_${subtype}`;
        setPendingInventory(prev => {
            const current = prev[key] || 0;
            const newVal = current + delta;
            if (newVal === 0) {
                const { [key]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [key]: newVal };
        });
    };

    const clearPendingInventory = () => setPendingInventory({});

    const commitInventory = async () => {
        const timestamp = new Date().toLocaleString('es-VE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });

        const movements = [];
        let totalCount = 0;

        // Procesar todos los cambios
        const promises = Object.entries(pendingInventory).map(async ([key, quantity]) => {
            const [beer, subtype] = key.split('_');
            await addStock(beer, 'Unidad', subtype, quantity); // Ahora espera a que termine addStock
            totalCount += quantity;
            movements.push({ beer, subtype, quantity });
        });

        await Promise.all(promises);

        const report = {
            id: Date.now(),
            timestamp,
            movements,
            totalUnits: totalCount
        };

        setInventoryHistory(prev => [report, ...prev].slice(0, 50));
        setPendingInventory({});
        return report;
    };

    const getPendingInventory = (beer, subtype) => {
        const key = `${beer}_${subtype}`;
        return pendingInventory[key] || 0;
    };

    useEffect(() => { localStorage.setItem('inventoryHistory', JSON.stringify(inventoryHistory)); }, [inventoryHistory]);
    useEffect(() => { localStorage.setItem('exchangeRates', JSON.stringify(exchangeRates)); }, [exchangeRates]);

    return (
        <ProductContext.Provider value={{
            beerTypes,
            addBeerType,
            removeBeerType,
            emissionOptions,
            addEmissionType,
            removeEmissionType,
            subtypes,
            conversions,
            updateConversion,
            prices,
            updatePrice,
            inventory,
            setBaseStock,
            addStock,
            deductStock,
            checkStock,
            getInventory,
            getPrice,
            getBsPrice,
            exchangeRates,
            fetchRates,
            getUnitsPerEmission,
            pendingInventory,
            updatePendingInventory,
            clearPendingInventory,
            commitInventory,
            getPendingInventory,
            inventoryHistory,
            getBeerColor,
            updateBeerColor,
            productMap
        }}>
            {children}
        </ProductContext.Provider>
    );
};
