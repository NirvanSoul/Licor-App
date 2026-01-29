
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
    const [forceEditPrices, setForceEditPrices] = useState(false);

    // Guidance System
    const [guidance, setGuidance] = useState({
        show: false,
        step: null, // 'price', 'inventory'
        msg: '',
        target: '' // Product Name
    });
    const [searchTarget, setSearchTarget] = useState('');

    const triggerGuidance = (step, target, msg) => {
        setGuidance({ show: true, step, target, msg });
    };

    const handleGuidanceNext = () => {
        if (guidance.step === 'price') {
            setForceEditPrices(true);
            setSearchTarget(guidance.target);
            setCurrentView('dashboard');
        } else if (guidance.step === 'inventory') {
            setSearchTarget(guidance.target);
            setCurrentView('inventory');
        }
        setGuidance({ ...guidance, show: false });
    };

    const handleGuidanceCancel = () => {
        setGuidance({ ...guidance, show: false });
    };

    // Helper for Mobile check if needed, or CSS media queries
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

        // Listen for price save success to trigger inventory guidance
        const handlePriceSaved = (e) => {
            if (forceEditPrices) {
                // If we were in a guided flow, ask for inventory
                triggerGuidance('inventory', '', '¿Quieres agregar inventario para tus nuevos productos ahora?');
                setForceEditPrices(false); // Clear the flag
            }
        };
        window.addEventListener('price-saved-guide', handlePriceSaved);

        return () => {
            window.removeEventListener('reset-flow', handleResetFlow);
            window.removeEventListener('price-saved-guide', handlePriceSaved);
        };
    }, [forceEditPrices]);

    return (
        <div className="sales-container-v2" style={{ padding: '1rem' }}>
            {/* Header - Only show for subviews (Back Button + Title) */}
            {currentView !== 'main' && (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', position: 'relative' }}>
                    <button
                        onClick={() => {
                            setCurrentView('main');
                            setForceEditPrices(false);
                            setSearchTarget('');
                        }}
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
            {currentView === 'products' && <ProductsSection onGuide={triggerGuidance} />}
            {currentView === 'dashboard' && <PriceSection initialEditMode={forceEditPrices} initialSearch={searchTarget} />}
            {currentView === 'inventory' && <InventorySection searchTarget={searchTarget} />}
            {currentView === 'bcv' && <RatesSection />}
            {currentView === 'users' && <UsersSection />}
            {currentView === 'activation' && <ActivationSection />}

            {/* Guidance Modal */}
            {guidance.show && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 3000, backdropFilter: 'blur(5px)', padding: '1rem'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '24px', padding: '2rem',
                        width: '100%', maxWidth: '340px', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--accent-light)'
                    }}>
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%',
                            background: 'rgba(234, 88, 12, 0.1)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto'
                        }}>
                            <span style={{ fontSize: '2rem' }}>{guidance.step === 'price' ? '🏷️' : '📦'}</span>
                        </div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                            {guidance.step === 'price' ? 'Configurar Precios' : 'Cargar Inventario'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '2rem' }}>
                            {guidance.msg}
                        </p>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <button
                                onClick={handleGuidanceNext}
                                style={{
                                    padding: '12px', borderRadius: '14px',
                                    background: 'var(--accent-color)', color: 'white',
                                    border: 'none', fontWeight: 700, fontSize: '1rem', cursor: 'pointer',
                                    boxShadow: '0 4px 6px rgba(234, 88, 12, 0.2)'
                                }}
                            >
                                Sí, continuar
                            </button>
                            <button
                                onClick={handleGuidanceCancel}
                                style={{
                                    padding: '12px', borderRadius: '14px',
                                    background: 'var(--bg-card-hover)', color: 'var(--text-secondary)',
                                    border: '1px solid var(--accent-light)', fontWeight: 600, cursor: 'pointer'
                                }}
                            >
                                Quizás después
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
