/**
 * Stock Validation
 * Utility functions for validating inventory and stock availability
 */

/**
 * Calculate total required stock for a specific beer from cart items
 * @param {Array} cartItems - Array of cart items
 * @param {string} beer - Beer name to check
 * @param {string} subtype - Product subtype
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {number} Total units required
 */
export const calculateRequiredStockFromCart = (cartItems, beer, subtype, getUnitsPerEmission) => {
    return cartItems.reduce((acc, item) => {
        if (item.beerType === beer && item.subtype === subtype && item.beerVariety === 'Normal') {
            const units = getUnitsPerEmission(item.emission, item.subtype);
            return acc + (item.quantity * units);
        }
        return acc;
    }, 0);
};

/**
 * Validate if there's enough stock for current order
 * @param {Object} orderState - Current order state
 * @param {Array} cartItems - Array of cart items
 * @param {Function} getInventory - Function to get inventory count
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {Object|null} Error object if validation fails, null if ok
 */
export const validateOrderStock = (orderState, cartItems, getInventory, getUnitsPerEmission) => {
    // Skip validation for Variado (handled separately in mixed builder)
    if (orderState.beerVariety === 'Variado') {
        return null;
    }

    const beer = orderState.beerType;
    const subtype = orderState.subtype;
    const emission = orderState.emission;
    const quantity = orderState.quantity;

    // Skip if incomplete selection
    if (!beer || !emission) {
        return null;
    }

    // Calculate units needed for current selection
    const currentSelectionUnits = quantity * getUnitsPerEmission(emission, subtype);

    // Calculate units already in cart for same beer/subtype
    const unitsInCart = calculateRequiredStockFromCart(cartItems, beer, subtype, getUnitsPerEmission);

    // Total required
    const totalRequired = currentSelectionUnits + unitsInCart;

    // Available stock
    const available = getInventory(beer, subtype);

    // Validation
    if (available < totalRequired) {
        return {
            product: `${beer} ${subtype}`,
            required: totalRequired,
            available: available,
            missing: totalRequired - available
        };
    }

    return null;
};

/**
 * Check if there's enough stock for a specific item
 * @param {string} beer - Beer name
 * @param {string} emission - Emission type
 * @param {string} subtype - Product subtype
 * @param {number} quantity - Quantity to check
 * @param {Function} getInventory - Function to get inventory count
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {boolean} True if enough stock
 */
export const checkItemStock = (beer, emission, subtype, quantity, getInventory, getUnitsPerEmission) => {
    const required = quantity * getUnitsPerEmission(emission, subtype);
    const available = getInventory(beer, subtype);
    return available >= required;
};

/**
 * Get stock status for display
 * @param {number} available - Available units
 * @param {number} required - Required units
 * @returns {Object} Status object with color and message
 */
export const getStockStatus = (available, required) => {
    if (available >= required) {
        return {
            status: 'ok',
            color: '#34c759',
            message: 'Stock suficiente'
        };
    } else if (available > 0) {
        return {
            status: 'low',
            color: '#ff9c57',
            message: `Solo ${available} disponibles`
        };
    } else {
        return {
            status: 'out',
            color: '#ef4444',
            message: 'Sin stock'
        };
    }
};
