import React, { useState } from 'react';
import { X, Beer, ChevronDown, ChevronUp } from 'lucide-react';
import ContainerSelector from '../../../components/ContainerSelector'; // Adjust path

export default function AddItemModal({ order, beerTypes, currencySymbol, getPrice, onAdd, onClose }) {
    const [quickAddSubtype, setQuickAddSubtype] = useState('Botella');

    return (
        <div className="pending-modal-overlay" onClick={onClose}>
            <div className="pending-modal-content" onClick={e => e.stopPropagation()}>
                <div className="pending-modal-header">
                    <div>
                        <h3 className="pending-modal-title" style={{ textAlign: 'left', width: 'auto' }}>Agregar Producto</h3>
                        <p className="pending-modal-subtitle">Cliente: {order.customerName}</p>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <div className="quick-add-form">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 className="section-title">Selecciona Producto</h4>
                        <ContainerSelector value={quickAddSubtype} onChange={setQuickAddSubtype} />
                    </div>

                    <div className="selector-grid" style={{ maxHeight: '300px', overflowY: 'auto', padding: '4px' }}>
                        {beerTypes.map(beer => (
                            <button
                                key={beer}
                                className="option-btn"
                                style={{
                                    padding: '0.75rem',
                                    fontSize: '0.9rem',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}
                                onClick={() => {
                                    onAdd(order.id, {
                                        beerType: beer,
                                        subtype: quickAddSubtype,
                                        emission: 'Unidad', // Default to unit for quick add bar service
                                        quantity: 1,
                                        price: getPrice(beer, 'Unidad', quickAddSubtype, 'local'),
                                        consumptionMode: 'Local'
                                    });
                                }}
                            >
                                <Beer size={18} />
                                <span style={{ textAlign: 'center' }}>{beer}</span>
                                <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                                    {currencySymbol}{getPrice(beer, 'Unidad', quickAddSubtype, 'local').toFixed(2)}
                                </span>
                            </button>
                        ))}
                    </div>
                    <p className="modal-footer-text" style={{ marginTop: '1rem' }}>
                        Se agregará 1 unidad ({quickAddSubtype}) al ticket.
                        <br />Puedes seguir agregando o cerrar para terminar.
                    </p>
                    <button
                        className="action-btn"
                        style={{ width: '100%', marginTop: '1rem', background: 'var(--accent-color)', color: 'white' }}
                        onClick={onClose}
                    >
                        Terminar de Agregar
                    </button>
                </div>
            </div>
        </div>
    );
}
