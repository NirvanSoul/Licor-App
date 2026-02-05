/**
 * useSalesState Hook
 * Manages the main sales order state and selection handlers
 */

import { useState } from 'react';
import { DEFAULT_ORDER_STATE } from '../constants/salesConstants';

export function useSalesState() {
    const [orderState, setOrderState] = useState(DEFAULT_ORDER_STATE);
    const [openSection, setOpenSection] = useState('consumption');
    const [showMixedBuilder, setShowMixedBuilder] = useState(false);

    /**
     * Handle consumption mode selection (Local / Para Llevar)
     */
    const handleConsumptionSelect = (mode) => {
        setOrderState(prev => ({
            ...prev,
            consumptionMode: mode
        }));
        if (mode === 'Local') setShowMixedBuilder(false);
        setOpenSection('emission');
    };

    /**
     * Handle emission selection (Caja, Media Caja, etc.)
     */
    const handleEmissionSelect = (option) => {
        setOrderState(prev => ({ ...prev, emission: option }));
        setOpenSection('beer');
    };

    /**
     * Handle beer variety toggle (Normal / Variado)
     */
    const handleVarietyToggle = (variety) => {
        setOrderState(prev => ({ ...prev, beerVariety: variety }));

        if (variety === 'Variado') {
            if (orderState.consumptionMode === 'Para Llevar' && orderState.emission) {
                setShowMixedBuilder(true);
            }
        } else {
            setShowMixedBuilder(false);
        }
    };

    /**
     * Handle beer type selection
     */
    const handleBeerSelect = (option) => {
        // Don't allow direct beer selection for Variado Para Llevar
        if (orderState.beerVariety === 'Variado' && orderState.consumptionMode === 'Para Llevar') {
            return;
        }

        setOrderState(prev => ({ ...prev, beerType: option }));
        setOpenSection(null);
    };

    /**
     * Handle subtype change (Botella, Lata, Tercio)
     */
    const handleSubtypeChange = (val) => {
        setOrderState(prev => ({
            ...prev,
            subtype: val,
            emission: null,
            // If switching to Botella Tercio, auto-select beerType
            beerType: val === 'Botella Tercio' ? 'Tercio' : (prev.beerType === 'Tercio' ? null : prev.beerType)
        }));
        setOpenSection('emission');
    };

    /**
     * Handle Tercio toggle
     */
    const handleTercioToggle = () => {
        const isTercioActive = orderState.subtype === 'Botella Tercio';
        setOrderState(prev => ({
            ...prev,
            subtype: isTercioActive ? 'Botella' : 'Botella Tercio',
            beerType: isTercioActive ? null : 'Tercio',
        }));
        setOpenSection('beer');
    };

    /**
     * Toggle accordion section
     */
    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    /**
     * Reset order state to default
     */
    const resetOrderState = () => {
        setOrderState(DEFAULT_ORDER_STATE);
        setOpenSection('consumption');
        setShowMixedBuilder(false);
    };

    /**
     * Increase quantity
     */
    const increaseQuantity = () => {
        setOrderState(prev => ({ ...prev, quantity: prev.quantity + 1 }));
    };

    /**
     * Decrease quantity
     */
    const decreaseQuantity = () => {
        setOrderState(prev => ({
            ...prev,
            quantity: prev.quantity > 1 ? prev.quantity - 1 : 1
        }));
    };

    /**
     * Set quantity directly
     */
    const setQuantity = (val) => {
        const quantity = parseInt(val, 10);
        if (!isNaN(quantity)) {
            setOrderState(prev => ({ ...prev, quantity: Math.max(1, quantity) }));
        } else if (val === '') {
            setOrderState(prev => ({ ...prev, quantity: 1 }));
        }
    };

    return {
        orderState,
        setOrderState,
        openSection,
        setOpenSection,
        showMixedBuilder,
        setShowMixedBuilder,
        handleConsumptionSelect,
        handleEmissionSelect,
        handleVarietyToggle,
        handleBeerSelect,
        handleSubtypeChange,
        handleTercioToggle,
        toggleSection,
        resetOrderState,
        increaseQuantity,
        decreaseQuantity,
        setQuantity
    };
}
