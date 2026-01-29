
import React, { useState } from 'react';
import { Box, Pencil, Save } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { useTheme } from '../../context/ThemeContext';

const RatesSection = () => {
    const { exchangeRates = {}, updateCustomRate, fetchRates, mainCurrency, setMainCurrency } = useProduct();
    const { theme } = useTheme();

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [isEditingCustomRate, setIsEditingCustomRate] = useState(false);
    const [draftCustomRate, setDraftCustomRate] = useState('');

    return (
        <div className="order-summary-card">
            <h3 className="modal-title" style={{ fontSize: '1.1rem', textAlign: 'left', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Tasas del Día:
                <button
                    onClick={() => setHistoryModalOpen(true)}
                    style={{
                        background: 'var(--bg-card-hover)',
                        border: '1px solid var(--accent-light)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        color: 'var(--text-primary)',
                        fontWeight: 500,
                        fontSize: '0.85rem'
                    }}
                >
                    <Box size={16} />
                    Historial
                </button>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', padding: '1rem 0' }}>
                <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Tasa BCV (USD)</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#34c759' }}>
                        {exchangeRates.bcv ? `${Number(exchangeRates.bcv).toLocaleString('en-US')} Bs` : '--.-- Bs'}
                    </div>
                    {exchangeRates.nextRates && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {/* Append noon time to prevent timezone rollback from UTC midnight */}
                            {new Date(exchangeRates.nextRates.date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric' })}: {exchangeRates.nextRates.usd} Bs
                        </span>
                    )}
                </div>
                <div style={{ background: 'var(--bg-card-hover)', padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.25rem' }}>Tasa BCV (Euro)</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {exchangeRates.euro ? `${Number(exchangeRates.euro).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs` : '--.-- Bs'}
                    </div>
                    {exchangeRates.nextRates && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            {new Date(exchangeRates.nextRates.date + 'T12:00:00').toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric' })}: {Number(exchangeRates.nextRates.eur).toFixed(2)} Bs
                        </span>
                    )}
                </div>
                <div style={{ background: 'var(--bg-card-hover)', padding: '1.25rem', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid #ff950040', position: 'relative', minWidth: '220px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>Tasa Personalizada</span>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '10px' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#ff9500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {isEditingCustomRate ? (
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    autoFocus
                                    value={draftCustomRate}
                                    onChange={(e) => {
                                        const rawValue = e.target.value.replace(/,/g, '');
                                        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                                            setDraftCustomRate(rawValue);
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            updateCustomRate(draftCustomRate);
                                            setIsEditingCustomRate(false);
                                        }
                                        if (e.key === 'Escape') {
                                            setIsEditingCustomRate(false);
                                        }
                                    }}
                                    style={{
                                        background: 'rgba(255, 149, 0, 0.1)',
                                        border: '1px solid #ff950060',
                                        borderRadius: '8px',
                                        outline: 'none',
                                        color: '#ff9500',
                                        fontWeight: 'bold',
                                        fontSize: '1.75rem',
                                        textAlign: 'center',
                                        width: '140px',
                                        padding: '2px 8px'
                                    }}
                                />
                            ) : (
                                <span style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                                    {(!exchangeRates.custom || isNaN(exchangeRates.custom)) ? '0.00' : Number(exchangeRates.custom).toLocaleString('en-US')}
                                </span>
                            )}
                            <span>Bs</span>
                        </div>

                        <button
                            onClick={() => {
                                if (isEditingCustomRate) {
                                    updateCustomRate(draftCustomRate);
                                    setIsEditingCustomRate(false);
                                } else {
                                    const currentVal = exchangeRates.custom;
                                    setDraftCustomRate((!currentVal || isNaN(currentVal)) ? '' : currentVal.toString());
                                    setIsEditingCustomRate(true);
                                }
                            }}
                            style={{
                                background: isEditingCustomRate ? '#34c759' : 'rgba(128, 128, 128, 0.1)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isEditingCustomRate ? 'white' : 'var(--text-secondary)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                flexShrink: 0
                            }}
                        >
                            {isEditingCustomRate ? <Save size={18} /> : <Pencil size={16} />}
                        </button>
                    </div>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#999', marginBottom: '1rem' }}>
                    Última Actualización: {exchangeRates.lastUpdate || 'Nunca'}
                </span>

                {/* Selector de Moneda Principal */}
                <div style={{
                    background: 'var(--bg-card-hover)',
                    padding: '1rem',
                    borderRadius: '16px',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%',
                    border: '1px solid var(--accent-light)'
                }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Moneda Principal de Negocio</span>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <button
                            onClick={() => setMainCurrency('USD')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '12px',
                                background: mainCurrency === 'USD' ? '#34c759' : 'transparent',
                                color: mainCurrency === 'USD' ? 'white' : 'var(--text-secondary)',
                                border: mainCurrency === 'USD' ? 'none' : '1px solid var(--accent-light)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            Dolar BCV ($)
                        </button>
                        <button
                            onClick={() => setMainCurrency('EUR')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '12px',
                                background: mainCurrency === 'EUR' ? '#3b82f6' : 'transparent',
                                color: mainCurrency === 'EUR' ? 'white' : 'var(--text-secondary)',
                                border: mainCurrency === 'EUR' ? 'none' : '1px solid var(--accent-light)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            Euro BCV (€)
                        </button>
                        <button
                            onClick={() => setMainCurrency('CUSTOM')}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '12px',
                                background: mainCurrency === 'CUSTOM' ? '#ff9500' : 'transparent',
                                color: mainCurrency === 'CUSTOM' ? 'white' : 'var(--text-secondary)',
                                border: mainCurrency === 'CUSTOM' ? 'none' : '1px solid var(--accent-light)',
                                cursor: 'pointer',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            Tasa Personalizada ($)
                        </button>
                    </div>
                </div>

                <button className="create-ticket-btn" onClick={fetchRates}>
                    Actualizar Tasas
                </button>
            </div>

            {/* HISTORY MODAL */}
            {historyModalOpen && (
                <div
                    onClick={() => setHistoryModalOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        style={{
                            background: 'var(--bg-card)', width: '90%', maxWidth: '400px',
                            borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
                        }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--accent-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Historial (7 Días)</h3>
                            <button onClick={() => setHistoryModalOpen(false)} style={{ color: 'var(--text-primary)' }}>&times;</button>
                        </div>
                        <div style={{ padding: '1rem', overflowY: 'auto', maxHeight: '60vh' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'center' }}>
                                <thead>
                                    <tr style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--accent-light)' }}>
                                        <th style={{ padding: '0.75rem', textAlign: 'left' }}>Fecha</th>
                                        <th style={{ padding: '0.75rem' }}>USD</th>
                                        <th style={{ padding: '0.75rem' }}>EUR</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!exchangeRates.history || exchangeRates.history.length === 0) ? (
                                        <tr><td colSpan="3" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Cargando datos...</td></tr>
                                    ) : (
                                        exchangeRates.history.map((rate, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid var(--bg-card-hover)' }}>
                                                <td style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 500 }}>{rate.date}</td>
                                                <td style={{ padding: '0.75rem', color: '#34c759', fontWeight: 600 }}>{rate.usd}</td>
                                                <td style={{ padding: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>{rate.eur}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ padding: '1rem', borderTop: '1px solid var(--accent-light)' }}>
                            <button onClick={() => setHistoryModalOpen(false)} style={{ width: '100%', padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RatesSection;
