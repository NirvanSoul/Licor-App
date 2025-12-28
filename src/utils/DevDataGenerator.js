/**
 * DevDataGenerator.js
 * Tool to generate massive amounts of fake data for development testing.
 */

const CUSTOMERS = ['Juan Perez', 'Maria Garcia', 'Carlos Rodriguez', 'Ana Martinez', 'Luis Hernandez', 'Sofia Lopez', 'Diego Gonzalez', 'Elena Wilson', 'Pedro Sanchez', 'Lucia Raminez'];
const USERS = ['YESSI', 'Admin', 'Supervisor', 'Vendedor1', 'Vendedor2'];
const BEERS = ['Polar Pilsen', 'Polar Light', 'Solera Verde', 'Solera Azul', 'Zulia', 'Regional Light', 'Tercio'];
const SUBTYPES = ['Botella', 'Botella Tercio', 'Lata Pequeña', 'Lata Grande'];
const PAYMENT_METHODS = ['Efectivo', 'Pago Móvil', 'Bio Pago', 'Punto'];
const EMISSIONS = ['Unidad', 'Caja', 'Media Caja', 'Six Pack'];

// Helper to get random item from array
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random number between min and max
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1) + min);

export const generateFakeData = () => {
    console.log("Generating fake data...");
    const now = new Date();

    // 1. Generate Mock Cost & Selling Prices (Catalog)
    const mockCosts = [];
    const mockPricesArr = [];
    const pMap = {}; // Reactive Price Map
    const cMap = {}; // Reactive Cost Map

    BEERS.forEach(beer => {
        SUBTYPES.forEach(stype => {
            // Base case cost between $10 and $70 (per case)
            const baseCaseCost = parseFloat((randomInt(1000, 7000) / 100).toFixed(2));

            // Factors and base margins for each emission type
            const is24UnitCase = stype.toLowerCase().includes('lata') || stype.includes('Tercio');
            const unitFactor = is24UnitCase ? (1 / 24) : (1 / 36);

            const emissMap = [
                { name: 'Caja', factor: 1, margin: 1.2 },
                { name: 'Media Caja', factor: 0.5, margin: 1.3 },
                { name: 'Six Pack', factor: (stype.toLowerCase().includes('lata') ? (6 / 24) : 0), margin: 1.4 },
                { name: 'Unidad', factor: unitFactor, margin: 1.6 }
            ];

            emissMap.forEach(em => {
                if (em.factor === 0) return;

                const cost = parseFloat((baseCaseCost * em.factor).toFixed(2));
                const actualMargin = em.margin + (Math.random() * 0.2);
                let price = parseFloat((cost * actualMargin).toFixed(2));
                let priceLocal = parseFloat((price * (1.1 + Math.random() * 0.1)).toFixed(2));

                // CAP $99 as requested
                if (price > 99) price = 99;
                if (priceLocal > 99) priceLocal = 99;

                mockCosts.push({ id: `c-${beer}-${stype}-${em.name}`, product_id: `prod-${beer}-${stype}`, product_name: beer, emission: em.name, subtype: stype, cost });
                mockPricesArr.push({ id: `ps-${beer}-${stype}-${em.name}`, product_name: beer, emission: em.name, subtype: stype, price, is_local: false });
                mockPricesArr.push({ id: `pl-${beer}-${stype}-${em.name}`, product_name: beer, emission: em.name, subtype: stype, price: priceLocal, is_local: true });

                pMap[`${beer}_${em.name}_${stype}`] = price;
                pMap[`${beer}_${em.name}_${stype}_local`] = priceLocal;
                cMap[`${beer}_${em.name}_${stype}`] = cost;
            });
        });
    });

    // 2. Generate Sales (400+) - Using generated catalog prices
    const sales = [];
    const directSaleThreshold = Math.random(); // Random probability for this specific run
    console.log(`Direct sale probability for this run: ${(1 - directSaleThreshold).toFixed(2)}`);

    for (let i = 0; i < 400; i++) {
        // Purely random spread over last 45 days
        const daysBack = randomInt(0, 45);
        const randomDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        randomDate.setHours(randomInt(9, 23), randomInt(0, 59), randomInt(0, 59));

        const itemsCount = randomInt(1, 4);
        const items = [];
        let total = 0;

        const isDirectSale = Math.random() > directSaleThreshold;
        const saleType = isDirectSale ? 'Llevar' : 'Local';

        for (let j = 0; j < itemsCount; j++) {
            const beer = randomItem(BEERS);
            const subtype = randomItem(SUBTYPES);
            const emission = randomItem(EMISSIONS);
            const quantity = randomInt(1, 3);

            // Get price from our generated catalog
            const suffix = saleType === 'Local' ? '_local' : '';
            let unitPrice = pMap[`${beer}_${emission}_${subtype}${suffix}`];

            // Fallback if combination doesn't exist (like Six Pack for Bottle)
            if (unitPrice === undefined) unitPrice = pMap[`${beer}_Unidad_` + subtype + suffix] || 2.5;

            items.push({
                id: `fake-item-${i}-${j}`,
                name: beer,
                beerType: beer, // Compatibility
                emission: emission,
                subtype: subtype,
                quantity: quantity,
                unitPriceUsd: unitPrice,
                totalPriceUsd: unitPrice * quantity,
                addedAt: randomDate.toISOString()
            });
            total += unitPrice * quantity;
        }

        sales.push({
            id: `fake-sale-${i}`,
            ticketNumber: 1000 + i,
            customerName: isDirectSale && Math.random() > 0.3 ? 'Venta Directa' : randomItem(CUSTOMERS),
            status: 'PAID',
            type: saleType,
            paymentMethod: randomItem(PAYMENT_METHODS),
            reference: 'REF' + randomInt(10000, 99999),
            createdBy: randomItem(USERS),
            createdAt: randomDate.toISOString(),
            closedAt: randomDate.toISOString(),
            items: items,
            totalAmountUsd: parseFloat(total.toFixed(2)),
            totalAmountBs: parseFloat((total * 50).toFixed(2)),
            total: parseFloat(total.toFixed(2))
        });
    }

    // 3. Generate Inventory History (20+)
    const invHistory = [];
    for (let i = 0; i < 22; i++) {
        const daysBack = randomInt(0, 45);
        const randomDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        randomDate.setHours(randomInt(9, 18), randomInt(0, 59));
        const movements = [];
        let totalUnits = 0;

        for (let j = 0; j < 3; j++) {
            const units = randomInt(10, 50);
            totalUnits += units;
            movements.push({
                beer: randomItem(BEERS),
                subtype: randomItem(SUBTYPES),
                emission: 'Caja',
                quantity: randomInt(1, 5),
                totalUnits: units
            });
        }

        invHistory.push({
            id: Date.now() - (i * 1000000),
            timestamp: randomDate.toLocaleString('es-VE'),
            movements: movements,
            totalUnits: totalUnits
        });
    }

    // 4. Generate Waste History (5+)
    const wasteHistory = [];
    for (let i = 0; i < 7; i++) {
        const daysBack = randomInt(0, 45);
        const randomDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        randomDate.setHours(randomInt(10, 22), randomInt(0, 59));
        wasteHistory.push({
            id: Date.now() - (i * 1000000) - 500,
            timestamp: randomDate.toLocaleString('es-VE'),
            type: 'WASTE',
            movements: [{
                beer: randomItem(BEERS),
                subtype: randomItem(SUBTYPES),
                emission: 'Unidad',
                quantity: randomInt(1, 5),
                totalUnits: randomInt(1, 5)
            }],
            totalUnits: randomInt(1, 5)
        });
    }

    localStorage.setItem('mock_cost_prices', JSON.stringify(mockCosts));
    localStorage.setItem('mock_prices', JSON.stringify(mockPricesArr));

    // 5. Update LocalStorage (Sales and History)
    const sortedSales = sales.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));
    localStorage.setItem('pendingOrders', JSON.stringify(sortedSales));
    localStorage.setItem('inventoryHistory', JSON.stringify(invHistory));
    localStorage.setItem('breakageHistory', JSON.stringify(wasteHistory));

    // Initial inventory stock
    const mockInventory = {};
    BEERS.forEach(beer => {
        SUBTYPES.forEach(stype => {
            mockInventory[`${beer}_${stype}`] = randomInt(100, 500);
        });
    });
    localStorage.setItem('mock_inventory', JSON.stringify(mockInventory));

    // 6. INSTANT REACTIVE REFRESH
    if (window.__DEV_SET_ORDERS__) window.__DEV_SET_ORDERS__(sortedSales);
    if (window.__DEV_SET_BEER_TYPES__) window.__DEV_SET_BEER_TYPES__(BEERS);
    if (window.__DEV_SET_INVENTORY__) window.__DEV_SET_INVENTORY__(mockInventory);
    if (window.__DEV_SET_INV_HISTORY__) window.__DEV_SET_INV_HISTORY__(invHistory);
    if (window.__DEV_SET_WASTE_HISTORY__) window.__DEV_SET_WASTE_HISTORY__(wasteHistory);

    // Inject Prices, Costs and Options
    if (window.__DEV_SET_PRICES__) window.__DEV_SET_PRICES__(pMap);
    if (window.__DEV_SET_COST_PRICES__) window.__DEV_SET_COST_PRICES__(cMap);
    if (window.__DEV_SET_EMISSION_OPTIONS__) window.__DEV_SET_EMISSION_OPTIONS__(['Unidad', 'Caja', 'Media Caja', 'Six Pack']);
    if (window.__DEV_SET_SUBTYPES__) window.__DEV_SET_SUBTYPES__(SUBTYPES);

    // 7. Inject Unique Beer Colors for identification
    const colorMap = {
        'Polar Pilsen': '#3B82F6', // Blue
        'Polar Light': '#60A5FA',  // cyan
        'Solera Verde': '#10B981', // green
        'Solera Azul': '#2563EB',  // deep blue
        'Zulia': '#F59E0B',       // Amber
        'Regional Light': '#FBBF24', // Yellow
        'Tercio': '#EA580C'        // Orange
    };
    if (window.__DEV_SET_BEER_COLORS__) window.__DEV_SET_BEER_COLORS__(colorMap);

    console.log("¡Data inyectada reactivamente con éxito!");
};

export const clearAllData = () => {
    console.log("Realizando limpieza profunda de la aplicación...");

    // 1. Limpiar LocalStorage
    const keysToToRemove = [
        'pendingOrders',
        'inventoryHistory',
        'breakageHistory',
        'mock_inventory',
        'mock_cost_prices',
        'mock_prices',
        'mock_sales',
        'mock_emissions',
        'mock_conversions',
        'mock_beer_colors',
        'mock_settings',
        'mainCurrency'
    ];

    keysToToRemove.forEach(key => localStorage.removeItem(key));

    // 2. Limpieza Reactiva (UI)
    if (window.__DEV_SET_ORDERS__) window.__DEV_SET_ORDERS__([]);
    if (window.__DEV_SET_INVENTORY__) window.__DEV_SET_INVENTORY__({});
    if (window.__DEV_SET_BEER_TYPES__) window.__DEV_SET_BEER_TYPES__([]);
    if (window.__DEV_SET_PRICES__) window.__DEV_SET_PRICES__({});
    if (window.__DEV_SET_COST_PRICES__) window.__DEV_SET_COST_PRICES__({});
    if (window.__DEV_SET_INV_HISTORY__) window.__DEV_SET_INV_HISTORY__([]);
    if (window.__DEV_SET_WASTE_HISTORY__) window.__DEV_SET_WASTE_HISTORY__([]);

    // Limpieza de configuraciones avanzadas
    if (window.__DEV_SET_BEER_COLORS__) window.__DEV_SET_BEER_COLORS__({});
    if (window.__DEV_SET_RAW_EMISSIONS__) window.__DEV_SET_RAW_EMISSIONS__([]);
    if (window.__DEV_SET_EMISSION_OPTIONS__) window.__DEV_SET_EMISSION_OPTIONS__([]);
    if (window.__DEV_SET_SUBTYPES__) window.__DEV_SET_SUBTYPES__([]);

    console.log("¡Aplicación reseteada a 0!");
};
