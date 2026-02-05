/**
 * Price Calculations
 * Utility functions for calculating prices and totals
 */

/**
 * Calculate cart total in Bs
 * @param {Array} cartItems - Array of cart items
 * @param {Function} getBsPrice - Function to get Bs price
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {number} Total in Bs
 */
export const calculateCartTotalBs = (cartItems, getBsPrice, getUnitsPerEmission) => {
    let total = 0;

    cartItems.forEach(item => {
        const mode = item.consumptionMode === 'Local' ? 'local' : 'standard';

        if (item.beerVariety === 'Variado') {
            if (item.consumptionMode === 'Para Llevar') {
                // Use pre-calculated unit price for mixed takeaway
                total += (item.unitPriceBs || 0) * item.quantity;
            } else {
                // Local Variado: Charge the full pack price
                total += (item.unitPriceBs || 0) * item.quantity;
            }
        } else {
            const price = getBsPrice(item.beerType, item.emission, item.subtype, mode) || 0;
            total += price * item.quantity;
        }
    });

    return total;
};

/**
 * Calculate cart total in USD
 * @param {Array} cartItems - Array of cart items
 * @param {Function} getPrice - Function to get USD price
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {number} Total in USD
 */
export const calculateCartTotalUsd = (cartItems, getPrice, getUnitsPerEmission) => {
    let total = 0;

    cartItems.forEach(item => {
        const mode = item.consumptionMode === 'Local' ? 'local' : 'standard';

        if (item.beerVariety === 'Variado') {
            if (item.consumptionMode === 'Para Llevar') {
                total += (item.unitPriceUsd || 0) * item.quantity;
            } else {
                // Local Variado: Sum the full pack price
                total += (item.unitPriceUsd || 0) * item.quantity;
            }
        } else {
            const price = getPrice(item.beerType, item.emission, item.subtype, mode) || 0;
            total += price * item.quantity;
        }
    });

    return total;
};

/**
 * Calculate current selection total in Bs
 * @param {Object} orderState - Current order state
 * @param {Function} getBsPrice - Function to get Bs price
 * @returns {number} Total in Bs
 */
export const calculateCurrentSelectionBs = (orderState, getBsPrice) => {
    if (!orderState.beerType || !orderState.emission) return 0;

    const mode = orderState.consumptionMode === 'Local' ? 'local' : 'standard';

    if (orderState.beerVariety === 'Normal') {
        const price = getBsPrice(orderState.beerType, orderState.emission, orderState.subtype, mode) || 0;
        return price * orderState.quantity;
    } else if (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local') {
        // Local Variado: Charge price of Selected Emission
        const price = getBsPrice(orderState.beerType, orderState.emission, orderState.subtype, 'local') || 0;
        return price * orderState.quantity;
    }

    return 0;
};

/**
 * Calculate current selection total in USD
 * @param {Object} orderState - Current order state
 * @param {Function} getPrice - Function to get USD price
 * @returns {number} Total in USD
 */
export const calculateCurrentSelectionUsd = (orderState, getPrice) => {
    if (!orderState.beerType || !orderState.emission) return 0;

    const mode = orderState.consumptionMode === 'Local' ? 'local' : 'standard';

    if (orderState.beerVariety === 'Normal') {
        const price = getPrice(orderState.beerType, orderState.emission, orderState.subtype, mode) || 0;
        return price * orderState.quantity;
    } else if (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local') {
        // Local Variado: Charge price of Selected Emission
        const price = getPrice(orderState.beerType, orderState.emission, orderState.subtype, 'local') || 0;
        return price * orderState.quantity;
    }

    return 0;
};

/**
 * Calculate total (cart + current selection) in Bs
 * @param {Array} cartItems - Array of cart items
 * @param {Object} orderState - Current order state
 * @param {Function} getBsPrice - Function to get Bs price
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {number} Total in Bs
 */
export const calculateTotalBs = (cartItems, orderState, getBsPrice, getUnitsPerEmission) => {
    const cartTotal = calculateCartTotalBs(cartItems, getBsPrice, getUnitsPerEmission);
    const currentTotal = calculateCurrentSelectionBs(orderState, getBsPrice);
    return cartTotal + currentTotal;
};

/**
 * Calculate total (cart + current selection) in USD
 * @param {Array} cartItems - Array of cart items
 * @param {Object} orderState - Current order state
 * @param {Function} getPrice - Function to get USD price
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {number} Total in USD
 */
export const calculateTotalUsd = (cartItems, orderState, getPrice, getUnitsPerEmission) => {
    const cartTotal = calculateCartTotalUsd(cartItems, getPrice, getUnitsPerEmission);
    const currentTotal = calculateCurrentSelectionUsd(orderState, getPrice);
    return cartTotal + currentTotal;
};
