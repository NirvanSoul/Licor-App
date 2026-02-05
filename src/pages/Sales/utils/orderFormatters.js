/**
 * Order Formatters
 * Utility functions for formatting orders, items, and currency values
 */

/**
 * Format a number as currency (Bs)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
    if (isNaN(amount)) return '0.00';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
};

/**
 * Format a number as USD with symbol
 * @param {number} amount - Amount to format
 * @param {string} currencySymbol - Currency symbol (default: '$')
 * @returns {string} Formatted USD string
 */
export const formatUsd = (amount, currencySymbol = '$') => {
    if (isNaN(amount)) return `${currencySymbol}0.00`;
    return `${currencySymbol}${amount.toFixed(2)}`;
};

/**
 * Get the display label for beer selection
 * @param {Object} orderState - Current order state
 * @returns {string|null} Label for selected beer
 */
export const getBeerSelectionLabel = (orderState) => {
    if (!orderState.beerType) {
        // No beer selected yet
        if (orderState.beerVariety === 'Variado') {
            return orderState.consumptionMode === 'Local'
                ? 'Ticket Abierto'
                : 'Variado (Constructor)';
        }
        return null;
    }

    // Beer selected
    if (orderState.beerVariety === 'Variado') {
        return `${orderState.beerType} (Variado)`;
    }
    return orderState.beerType;
};

/**
 * Format a cart item for display
 * @param {Object} item - Cart item object
 * @returns {Object} Formatted item with display properties
 */
export const formatCartItem = (item) => {
    return {
        ...item,
        displayName: item.beerVariety === 'Variado'
            ? `${item.emission} Variada`
            : `${item.emission} ${item.beerType}`,
        displayMode: item.consumptionMode === 'Local' ? 'Local' : 'Llevar'
    };
};

/**
 * Format order data for display in UI
 * @param {Object} order - Order object
 * @returns {Object} Formatted order
 */
export const formatOrderForDisplay = (order) => {
    return {
        ...order,
        displayTicketNumber: order.ticketNumber || '0000',
        displayCustomerName: order.customerName || 'Anónimo',
        displayTotal: formatCurrency(order.totalAmountBs || 0),
        displayTotalUsd: formatUsd(order.totalAmountUsd || 0)
    };
};
