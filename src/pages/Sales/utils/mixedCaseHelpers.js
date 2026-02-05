/**
 * Mixed Case Helpers
 * Utility functions for handling mixed/varied beer cases
 */

/**
 * Calculate total units in a mixed composition
 * @param {Object} composition - Object with beer names as keys and quantities as values
 * @returns {number} Total number of units
 */
export const calculateMixedTotalUnits = (composition) => {
    return Object.values(composition).reduce((acc, count) => acc + count, 0);
};

/**
 * Get target units for a given emission type
 * @param {string} emission - Emission type (e.g., 'Caja', 'Media Caja')
 * @param {string} subtype - Product subtype (e.g., 'Botella', 'Lata')
 * @param {Function} getUnitsPerEmission - Function to get units per emission
 * @returns {number} Target number of units
 */
export const getTargetUnits = (emission, subtype, getUnitsPerEmission) => {
    if (!emission) return 0;
    if (typeof getUnitsPerEmission !== 'function') return 1;
    return getUnitsPerEmission(emission, subtype) || 1;
};

/**
 * Validate if mixed composition is complete
 * @param {Object} composition - Current composition
 * @param {number} targetUnits - Target units needed
 * @returns {Object} Validation result { isValid, current, target, missing }
 */
export const validateMixedComposition = (composition, targetUnits) => {
    const currentUnits = calculateMixedTotalUnits(composition);
    return {
        isValid: currentUnits === targetUnits,
        current: currentUnits,
        target: targetUnits,
        missing: Math.max(0, targetUnits - currentUnits),
        excess: Math.max(0, currentUnits - targetUnits)
    };
};

/**
 * Calculate the price for a mixed case (max price rule)
 * @param {Object} composition - Beer composition
 * @param {string} emission - Emission type
 * @param {string} subtype - Product subtype
 * @param {Function} getPriceFunc - Function to get price (getPrice or getBsPrice)
 * @param {string} mode - Pricing mode ('local' or 'standard')
 * @returns {number} Maximum price from composition
 */
export const calculateMixedPrice = (composition, emission, subtype, getPriceFunc, mode = 'standard') => {
    if (Object.keys(composition).length === 0) return 0;

    let maxPrice = 0;

    Object.keys(composition).forEach(beerName => {
        const price = getPriceFunc(beerName, emission, subtype, mode);
        if (price > maxPrice) maxPrice = price;
    });

    return maxPrice;
};

/**
 * Check if a beer can be added to the mix (stock validation)
 * @param {string} beer - Beer name
 * @param {Object} composition - Current composition
 * @param {number} targetUnits - Target units
 * @param {Function} checkStock - Function to check stock
 * @param {string} subtype - Product subtype
 * @returns {boolean} Whether beer can be added
 */
export const canAddToMix = (beer, composition, targetUnits, checkStock, subtype) => {
    const currentCount = calculateMixedTotalUnits(composition);
    if (currentCount >= targetUnits) return false;
    return checkStock(beer, 'Unidad', subtype, 1);
};
