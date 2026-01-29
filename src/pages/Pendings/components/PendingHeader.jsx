import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import BrokenBottleIcon from './BrokenBottleIcon'; // Adjust path if needed

export default function PendingHeader({
    openOrdersCount,
    searchTerm,
    setSearchTerm,
    onOpenTicket,
    onOpenWaste
}) {
    return (
        <header className="page-header" style={{ marginBottom: '1.5rem', display: 'block' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                    <h1 className="text-2xl font-bold text-primary">Cuentas Abiertas</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Gestión de tickets y consumos pendientes</p>
                </div>
                <div className="header-badges" style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge-active">{openOrdersCount} Activas</span>
                </div>
            </div>

            {/* QUICK ACTIONS */}
            <div style={{
                background: 'var(--bg-card)',
                padding: '1rem',
                borderRadius: '16px',
                border: '1px solid var(--accent-light)',
                marginBottom: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
            }}>
                <button onClick={onOpenTicket} className="open-tab-btn">
                    <Plus size={20} />
                    Abrir Carta
                </button>

                <button
                    onClick={onOpenWaste}
                    className="waste-report-btn"
                    style={{
                        background: 'var(--bg-card)',
                        color: '#EF4444',
                        border: '1px solid #ef444440',
                        padding: '0 1.25rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap'
                    }}
                >
                    <X size={18} />
                    Botella Rota
                </button>
            </div>

            {/* SEARCH BAR */}
            <div className="app-search-container">
                <Search className="app-search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Buscar por cliente o número de ticket..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="app-search-input"
                />
            </div>
        </header>
    );
}
