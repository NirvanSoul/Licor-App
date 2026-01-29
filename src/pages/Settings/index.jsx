
import React, { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// Import Sub-sections
import SettingsMenu from './SettingsMenu';
import ProductsSection from './ProductsSection';
import InventorySection from './InventorySection';
import PriceSection from './PriceSection';
import RatesSection from './RatesSection';
import UsersSection from './UsersSection';
import ActivationSection from './ActivationSection';

const Settings = () => {
    // State
    const [currentView, setCurrentView] = useState('main'); // 'main', 'products', 'dashboard', 'inventory', 'bcv', 'users', 'activation'

    // Helper for Mobile check if needed, or CSS media queries
    // Using simple check for title styling logic (copied from original)
    const isMobile = window.innerWidth < 768;

    const getTitle = () => {
        switch (currentView) {
            case 'bcv': return 'Tasas ';
            case 'products': return 'Gestion de Productos';
            case 'dashboard': return 'Precios Actuales';
            case 'users': return 'Usuarios';
            case 'inventory': return 'Inventario';
            case 'activation': return 'Activación de Licencia';
            default: return 'Ajustes';
        }
    };

    // Listen for Menu Reset
    useEffect(() => {
        const handleResetFlow = (e) => {
            if (e.detail === '/ajustes') {
                setCurrentView('main');
            }
        };
        window.addEventListener('reset-flow', handleResetFlow);
        return () => window.removeEventListener('reset-flow', handleResetFlow);
    }, []);

    return (
        <div className="sales-container-v2" style={{ padding: '1rem' }}>
            {/* Header - Only show for subviews (Back Button + Title) */}
            {currentView !== 'main' && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
                    <button
                        onClick={() => setCurrentView('main')}
                        style={{ position: 'absolute', left: 0, background: 'none', border: 'none', padding: '8px', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={28} color="var(--text-primary)" />
                    </button>
                    <h1 className="payment-section-title" style={{ fontSize: isMobile ? '1.25rem' : '1.5rem', margin: '0 auto', paddingLeft: isMobile ? '32px' : '48px', paddingRight: isMobile ? '32px' : '48px', textAlign: 'center' }}>
                        {getTitle()}
                    </h1>
                </div>
            )}

            {/* Main Menu */}
            {currentView === 'main' && (
                <div style={{ paddingBottom: '2rem' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h1 className="payment-section-title" style={{ fontSize: '1.5rem' }}>Ajustes</h1>
                    </div>
                    <SettingsMenu setCurrentView={setCurrentView} />
                </div>
            )}

            {/* Sub-Sections */}
            {currentView === 'products' && <ProductsSection />}
            {currentView === 'dashboard' && <PriceSection />} {/* Note: Mapping 'dashboard' -> PriceSection */}
            {currentView === 'inventory' && <InventorySection />}
            {currentView === 'bcv' && <RatesSection />}
            {currentView === 'users' && <UsersSection />}
            {currentView === 'activation' && <ActivationSection />}
        </div>
    );
};

export default Settings;
