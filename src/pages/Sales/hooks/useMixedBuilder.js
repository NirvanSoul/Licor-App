/**
 * useMixedBuilder Hook
 * Manages mixed/varied beer case construction
 */

import { useState } from 'react';
import { calculateMixedTotalUnits, getTargetUnits, validateMixedComposition, canAddToMix } from '../utils/mixedCaseHelpers';

export function useMixedBuilder(orderState, checkStock) {
    const [mixedComposition, setMixedComposition] = useState({});

    /**
     * Add beer to mixed composition
     */
    const addToMix = (beer, getUnitsPerEmission) => {
        const target = getTargetUnits(orderState.emission, orderState.subtype, getUnitsPerEmission);
        const currentCount = calculateMixedTotalUnits(mixedComposition);

        if (currentCount >= target) return;
        if (!checkStock(beer, 'Unidad', orderState.subtype, 1)) return;

        setMixedComposition(prev => ({
            ...prev,
            [beer]: (prev[beer] || 0) + 1
        }));
    };

    /**
     * Remove beer from mixed composition
     */
    const removeFromMix = (beer) => {
        setMixedComposition(prev => {
            const current = prev[beer] || 0;
            if (current <= 0) return prev;

            const next = current - 1;
            if (next === 0) {
                const { [beer]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [beer]: next };
        });
    };

    /**
     * Reset mixed composition
     */
    const resetMixedComposition = () => {
        setMixedComposition({});
    };

    /**
     * Get validation status of current composition
     */
    const getMixedValidation = (getUnitsPerEmission) => {
        const target = getTargetUnits(orderState.emission, orderState.subtype, getUnitsPerEmission);
        return validateMixedComposition(mixedComposition, target);
    };

    return {
        mixedComposition,
        setMixedComposition,
        addToMix,
        removeFromMix,
        resetMixedComposition,
        getMixedValidation
    };
}
