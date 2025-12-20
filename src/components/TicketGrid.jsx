import React, { useState } from 'react';
import TicketSlot from './TicketSlot';
import { useProduct } from '../context/ProductContext';
import { useOrder } from '../context/OrderContext';

export default function TicketGrid({ orderId, item, itemIndex }) {
    const { beerTypes, getPrice, getUnitsPerEmission, getBeerColor } = useProduct();
    const { updateOrderItemSlot } = useOrder();

    const totalUnits = item.quantity * getUnitsPerEmission(item.emission, item.subtype);

    // Helper to get safe slots array
    const getSlots = () => {
        // Create full array of nulls based on current definition
        const displaySlots = Array(totalUnits).fill(null);

        // Merge stored slots if they exist
        if (item.slots && Array.isArray(item.slots)) {
            item.slots.forEach((val, idx) => {
                if (idx < totalUnits && val !== undefined) {
                    displaySlots[idx] = val;
                }
            });
        }

        return displaySlots;
    };

    const slots = getSlots();

    // Grouping Logic
    const getGroupedItems = () => {
        const groups = [];
        const seen = new Map(); // Map<BeerName, GroupIndex>

        slots.forEach((beer, index) => {
            if (beer) {
                if (seen.has(beer)) {
                    // Increment existing
                    groups[seen.get(beer)].count++;
                    groups[seen.get(beer)].indices.push(index); // Track indices to know which one to remove
                } else {
                    // New Group
                    seen.set(beer, groups.length);
                    groups.push({ type: beer, count: 1, indices: [index] });
                }
            }
        });
        return groups;
    };

    const groupedItems = getGroupedItems();
    const isFull = slots.every(s => s !== null);

    // Beer Selector
    const handleBeerSelect = (beer) => {
        // Find first empty slot
        const emptyIndex = slots.findIndex(s => s === null);
        if (emptyIndex !== -1) {
            updateOrderItemSlot(orderId, itemIndex, emptyIndex, beer);
        } else {
            alert('Ticket lleno');
        }
    };

    const handleRemoveItem = (group) => {
        if (confirm(`¿Eliminar 1 ${group.type}?`)) {
            // Remove the LAST added instance (highest index) naturally?
            // Or just the last index in our tracking array
            const indexToRemove = group.indices[group.indices.length - 1];
            updateOrderItemSlot(orderId, itemIndex, indexToRemove, null);
        }
    };

    return (
        <div className="ticket-grid-container">
            <div className="ticket-grid-header">
                <span className="ticket-grid-header-text">
                    {item.beerType} {item.subtype} - {item.emission} ({slots.filter(s => s !== null).length}/{totalUnits})
                </span>
                {/* Clear Button? */}
            </div>

            {/* The Grid (Aggregated) */}
            <div className="ticket-slots-grid">
                {/* Render Grouped Items */}
                {groupedItems.map((group, idx) => (
                    <TicketSlot
                        key={`${group.type}-${idx}`}
                        content={group.type}
                        count={group.count}
                        isEmpty={false}
                        color={getBeerColor(group.type)}
                        onClick={() => handleRemoveItem(group)}
                    />
                ))}

                {/* Render Single "Add" Button if space exists */}
                {!isFull && (
                    <TicketSlot
                        key="add-btn"
                        isEmpty={true}
                        content="Agregar"
                        onClick={() => {
                            // Optional: Focus the beer selector below?
                            // Or just visual cue. The user knows to click below.
                        }}
                    />
                )}
            </div>

            {/* Beer Selector Keyboard */}
            <div className="beer-selector-container">
                <p className="beer-selector-label">
                    Selecciona para llenar espacios vacíos
                </p>
                <div className="beer-selector-grid">
                    {beerTypes.map(beer => {
                        const color = getBeerColor(beer);
                        return (
                            <button
                                key={beer}
                                onClick={() => handleBeerSelect(beer)}
                                className="beer-selector-btn"
                                style={{
                                    background: color.bg, // Use user defined color
                                    color: color.text,
                                    borderColor: color.border
                                }}
                            >
                                {beer}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
