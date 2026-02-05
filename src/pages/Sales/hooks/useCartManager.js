/**
 * useCartManager Hook
 * Manages shopping cart state and operations
 */

import { useState } from 'react';

export function useCartManager(orderState, validateStockFn, resetOrderState) {
    const [cartItems, setCartItems] = useState([]);

    /**
     * Check if current selection is complete and ready to add to cart
     */
    const isSelectionComplete = () => {
        if (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Para Llevar') {
            return false;
        }
        if (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local') {
            return orderState.emission && orderState.beerType;
        }
        return orderState.consumptionMode && orderState.emission && orderState.beerType;
    };

    /**
     * Add current selection to cart
     */
    const handleAddToCart = (getBsPrice, getPrice) => {
        if (!isSelectionComplete()) return;

        // Validate stock before adding
        const stockError = validateStockFn();
        if (stockError) {
            return stockError; // Return error to be handled by parent
        }

        let newItem = {
            id: Date.now(),
            ...orderState,
        };

        // SPECIAL HANDLING FOR LOCAL VARIADO
        if (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Local') {
            newItem = {
                ...newItem,
                beerType: `Variado (${orderState.beerType})`,
                displayBase: orderState.beerType,
                baseBeer: orderState.beerType,
                // Charge price of SELECTED EMISSION (e.g. Media Caja)
                unitPriceBs: getBsPrice(orderState.beerType, orderState.emission, orderState.subtype, 'local') || 0,
                unitPriceUsd: getPrice(orderState.beerType, orderState.emission, orderState.subtype, 'local') || 0
            };
        }

        setCartItems(prev => [...prev, newItem]);
        resetOrderState();
        return null; // No error
    };

    /**
     * Remove item from cart
     */
    const handleRemoveFromCart = (id) => {
        setCartItems(prev => prev.filter(item => item.id !== id));
    };

    /**
     * Clear entire cart
     */
    const clearCart = () => {
        setCartItems([]);
    };

    /**
     * Add mixed case to cart
     */
    const addMixedToCart = (composition, unitPriceBs, unitPriceUsd) => {
        const newItem = {
            id: Date.now(),
            ...orderState,
            beerType: 'Variado',
            composition: { ...composition },
            unitPriceBs,
            unitPriceUsd
        };
        setCartItems(prev => [...prev, newItem]);
    };

    return {
        cartItems,
        setCartItems,
        isSelectionComplete,
        handleAddToCart,
        handleRemoveFromCart,
        clearCart,
        addMixedToCart
    };
}
