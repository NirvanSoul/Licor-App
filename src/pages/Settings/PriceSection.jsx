
import React, { useState, useEffect } from 'react';
import { Search, Pencil } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import BeerDashboardCard from './components/BeerDashboardCard';
import BeerPriceEditor from './components/BeerPriceEditor';
import PriceFab from '../../components/PriceFab';
import { getGlobalSearchScore } from '../../utils/searchUtils';

const PriceSection = ({ initialEditMode, initialSearch }) => {
    const { beerTypes } = useProduct();
    const { role } = useAuth();
    const { theme } = useTheme();

    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [isEditMode, setIsEditMode] = useState(initialEditMode || false);

    useEffect(() => {
        if (initialEditMode) setIsEditMode(true);
        if (initialSearch) setSearchQuery(initialSearch);
    }, [initialEditMode, initialSearch]);

    // Employees can only view, not edit
    const canEdit = role && ['OWNER', 'MANAGER', 'DEVELOPER'].includes(role);

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>

            <div className="app-search-container">
                <Search className="app-search-icon" size={20} />
                <input
                    type="text"
                    placeholder="Buscar cerveza, unidad, tipo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="app-search-input"
                />
            </div>

            {/* TOGGLE EDIT MODE BUTTON - Only visible to OWNER, MANAGER, DEVELOPER */}
            {canEdit && (
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: theme === 'dark' ? 'rgba(234, 88, 12, 0.15)' : '#FFF7ED',
                        color: theme === 'dark' ? '#FB923C' : '#EA580C',
                        border: theme === 'dark' ? '1px solid rgba(234, 88, 12, 0.2)' : '1px solid #FFEDD5',
                        fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        boxShadow: isEditMode ? '0 0 0 2px rgba(234, 88, 12, 0.4)' : 'none'
                    }}
                >
                    <Pencil size={18} />
                    {isEditMode ? 'Terminar Edición' : 'Editar Precios'}
                </button>
            )}


            <div style={{ display: 'grid', gap: '1rem' }}>
                {Array.isArray(beerTypes) && [...beerTypes]
                    .filter(beer => beer.toLowerCase() !== 'tercio')
                    .sort((a, b) => {
                        if (!searchQuery || searchQuery.length < 2) return 0;
                        const scoreA = getGlobalSearchScore(a, searchQuery);
                        const scoreB = getGlobalSearchScore(b, searchQuery);
                        return scoreB - scoreA;
                    })
                    .map(beer => (
                        (isEditMode && canEdit) ? (
                            <BeerPriceEditor key={beer} beerName={beer} searchFilter={searchQuery} />
                        ) : (
                            <BeerDashboardCard key={beer} beerName={beer} searchFilter={searchQuery} />
                        )
                    ))}
            </div>

            <div style={{ margin: '1rem 0', height: '1px', background: 'var(--accent-light)', opacity: 0.5 }}></div>

            {/* --- CONSTANT TERCIO SECTION AT THE BOTTOM --- */}
            <div style={{ marginTop: '1rem' }}>
                <div style={{
                    marginBottom: '1rem',
                    paddingLeft: '0.5rem',
                    borderLeft: '4px solid #EA580C',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '1.1rem'
                }}>
                    Zona Tercio
                </div>
                {beerTypes.some(b => b.toLowerCase() === 'tercio') && (
                    (isEditMode && canEdit) ? (
                        <BeerPriceEditor beerName="Tercio" searchFilter={searchQuery} />
                    ) : (
                        <BeerDashboardCard beerName="Tercio" searchFilter={searchQuery} />
                    )
                )}
            </div>

            {/* Floating Action Button for Price Changes */}
            {canEdit && isEditMode && <PriceFab />}
        </div>
    );
};

export default PriceSection;
