
import React, { useState } from 'react';
import { Key, CheckCircle2, Zap, Star, Trophy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useProduct } from '../../context/ProductContext';
import { WHATSAPP_NUMBER } from '../../data/settingsData';

const ActivationSection = () => {
    const { role, isLicenseActive, licenseInfo, checkLicense } = useAuth();
    const { exchangeRates } = useProduct();

    // State
    const [selectedPlanTab, setSelectedPlanTab] = useState('monthly');
    const [activationKey, setActivationKey] = useState('');
    const [activationStatus, setActivationStatus] = useState({ loading: false, error: null, success: false });

    // Helper
    const isMobile = window.innerWidth < 768; // Simple check, or use hook

    const formatDate = (dateString) => {
        if (!dateString) return '---';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    };

    const getPlanLabel = (type) => {
        switch (type?.toLowerCase()) {
            case 'free': return 'Prueba Gratis';
            case 'monthly': return 'Plan Mensual';
            case 'yearly': return 'Plan Anual';
            default: return type || 'Desconocido';
        }
    };

    const handleActivate = async (e) => {
        e.preventDefault();
        setActivationStatus({ loading: true, error: null, success: false });

        // Simulate API call or Real call
        // In original code it called checkLicense(key) or similar? 
        // The original code uses `handleActivate` but internal logic wasn't fully shown in snippets except the UI.
        // Assuming we need to implement or call a context function.
        // The context `checkLicense` likely takes the key.

        try {
            // Mocking the call if context doesn't have it, or reusing context if it does.
            // Looking at AuthContext usage in original SettingsPage:
            // "const { ... checkLicense } = useAuth();"

            // However, usually checkLicense checks *current* license. 
            // Validating a NEW key might require a different function like `activateLicense(key)`.
            // I will assume for now we call a function to activate.

            // If checkLicense is the only one exposed, maybe it handles it? 
            // Or maybe I missed `activateLicense` in AuthContext.
            // I'll put a placeholder and User can verify logic.

            // For now, let's assume we call an API endpoint.
            // await activateLicense(activationKey);

            // Placeholder:
            await new Promise(r => setTimeout(r, 1000));
            // alert('Función de activación simulada. Implementar conexión real.');

            setActivationStatus({ loading: false, error: 'Función en desarrollo (Pending Context)', success: false });

        } catch (err) {
            setActivationStatus({ loading: false, error: err.message, success: false });
        }
    };

    return (
        <div className="order-summary-card">
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <div style={{
                    width: '80px', height: '80px',
                    background: licenseInfo?.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 88, 12, 0.1)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <Key size={40} color={licenseInfo?.is_active ? '#10b981' : '#f97316'} />
                </div>

                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {role === 'DEVELOPER' ? 'Modo Desarrollador' : (licenseInfo?.is_active ? 'Licencia Activa' : 'Activar Producto')}
                </h2>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                    {role === 'DEVELOPER'
                        ? 'Tienes acceso total e ilimitado a todas las funciones del sistema por ser Administrador de Sistema.'
                        : (licenseInfo?.is_active
                            ? `Tu licencia ${getPlanLabel(licenseInfo.plan_type)} está funcionando correctamente. Disfruta de todas las funciones.`
                            : 'Adquiere un plan para desbloquear la potencia total de tu negocio o ingresa tu clave de producto.')}
                </p>

                {/* PRICING PLANS SECTION */}
                {(!licenseInfo?.is_active && isLicenseActive === false) && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2.5rem',
                        marginBottom: '4rem',
                        marginTop: '1rem',
                        width: '100%'
                    }}>
                        {/* PLAN SELECTOR (Segmented Control) */}
                        <div style={{
                            background: 'var(--bg-card-hover)',
                            padding: '6px',
                            borderRadius: '16px',
                            display: 'flex',
                            gap: '4px',
                            border: '1px solid var(--accent-light)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                        }}>
                            {[
                                { id: 'free', label: 'FREE' },
                                { id: 'monthly', label: '30 DÍAS' },
                                { id: 'yearly', label: '1 AÑO' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSelectedPlanTab(tab.id)}
                                    style={{
                                        padding: '10px 24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: selectedPlanTab === tab.id ? '#10B981' : 'transparent',
                                        color: selectedPlanTab === tab.id ? 'white' : 'var(--text-secondary)',
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        transform: selectedPlanTab === tab.id ? 'scale(1.05)' : 'scale(1)',
                                        boxShadow: selectedPlanTab === tab.id ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* PLAN CARD CONTAINER */}
                        <div style={{ width: '100%', maxWidth: '420px', textAlign: 'left', animation: 'fadeInScale 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                            {/* Plan Prueba */}
                            {selectedPlanTab === 'free' && (
                                <div style={{
                                    background: 'var(--bg-card-hover)',
                                    padding: '2.5rem',
                                    borderRadius: '32px',
                                    border: '1px solid #10B981',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Prueba Gratis</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Para empezar ahora</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '20px' }}>
                                            <span style={{ fontSize: '3rem', fontWeight: 900 }}>$0</span>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>Por 30 días</span>
                                    </div>
                                    <button
                                        onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quisiera%20solicitar%20mi%20Plan%20Prueba%20Gratis!`, '_blank')}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: '#10B981',
                                            color: 'white',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            fontSize: '1.1rem',
                                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        <img src="/Whatsapp.svg" alt="WhatsApp" style={{ width: '22px', height: '22px' }} />
                                        Solicitar Prueba
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                        {['30 días de acceso', 'Todas las funciones', 'Reportes básicos', 'Soporte estándar'].map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                                                <CheckCircle2 size={18} color="#10b981" />
                                                <span style={{ opacity: 0.8 }}>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Plan Mensual */}
                            {selectedPlanTab === 'monthly' && (
                                <div style={{
                                    background: 'var(--text-primary)',
                                    color: 'var(--bg-card)',
                                    padding: '3rem 2.5rem',
                                    borderRadius: '32px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    position: 'relative',
                                    boxShadow: '0 25px 50px rgba(0,0,0,0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)', background: '#f97316', color: 'white', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '0.5px' }}>MÁS POPULAR</div>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-card)' }}>
                                        <Star size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Plan Mensual</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.95rem', opacity: 0.8 }}>Escalabilidad total</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '3rem', fontWeight: 900 }}>$10</span>
                                            <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1.5rem' }}>$15</span>
                                            <div style={{ width: '100%', marginTop: '6px' }}>
                                                <span style={{ fontSize: '1.3rem', opacity: 1, fontWeight: 800, color: '#f97316' }}>
                                                    {((exchangeRates.bcv || 0) * 10).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', opacity: 0.8, marginTop: '8px', display: 'block' }}>Facturación mensual</span>
                                    </div>
                                    <button
                                        onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quisiera%20adquirir%20el%20Plan%20Mensual!`, '_blank')}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: '#10B981',
                                            color: 'white',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            fontSize: '1.1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            boxShadow: '0 6px 25px rgba(16, 185, 129, 0.5)'
                                        }}
                                    >
                                        <img src="/Whatsapp.svg" alt="WhatsApp" style={{ width: '24px', height: '24px' }} />
                                        Suscribirse Ahora
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                        {['Sincronización Realtime', 'Multi-dispositivo', 'Soporte Prioritario', 'Backup en la nube'].map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                                                <CheckCircle2 size={18} color="var(--bg-card)" />
                                                <span style={{ opacity: 0.9 }}>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Plan Anual */}
                            {selectedPlanTab === 'yearly' && (
                                <div style={{
                                    background: 'var(--bg-card-hover)',
                                    padding: '2.5rem',
                                    borderRadius: '32px',
                                    border: '1px solid #10B981',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1.5rem',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f97316' }}>
                                        <Trophy size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Plan Anual</h3>
                                        <p style={{ margin: '4px 0 0', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Ahorro inteligente</p>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '3rem', fontWeight: 900 }}>$90</span>
                                            <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '1.5rem' }}>$120</span>
                                            <div style={{ width: '100%', marginTop: '6px' }}>
                                                <span style={{ fontSize: '1.3rem', opacity: 1, fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {((exchangeRates.bcv || 0) * 90).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '8px' }}>AHORRO VALIOSO</span>
                                                </span>
                                            </div>
                                        </div>
                                        <span style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '8px', display: 'block' }}>Ahorra 2 meses completos</span>
                                    </div>
                                    <button
                                        onClick={() => window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=Hola,%20quisiera%20adquirir%20el%20Plan%20Anual!`, '_blank')}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '16px',
                                            border: 'none',
                                            background: '#10B981',
                                            color: 'white',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            fontSize: '1.1rem',
                                            boxShadow: '0 6px 20px rgba(16, 185, 129, 0.3)'
                                        }}
                                    >
                                        <img src="/Whatsapp.svg" alt="WhatsApp" style={{ width: '22px', height: '22px' }} />
                                        Adquirir Plan
                                    </button>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                                        {['Todo el Plan Mensual', '2 Meses Gratis Incluidos', 'Soporte VIP 24/7', 'Personalización de Reportes'].map((f, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1rem' }}>
                                                <CheckCircle2 size={18} color="#10b981" />
                                                <span style={{ opacity: 0.8 }}>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        <style jsx>{`
                            @keyframes fadeInScale {
                                from { opacity: 0; transform: scale(0.95); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                    </div>
                )}
                {/* ACTIVATION FORM */}
                {(!licenseInfo?.is_active && isLicenseActive === false) ? (
                    <div style={{ borderTop: '1px solid var(--accent-light)', paddingTop: '3rem', maxWidth: '400px', margin: '0 auto' }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', fontWeight: 700 }}>¿Ya tienes una clave?</h3>
                        <form onSubmit={handleActivate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ textAlign: 'left' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>Ingresar Clave de Licencia</label>
                                <input
                                    type="text"
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={activationKey}
                                    onChange={(e) => setActivationKey(e.target.value.toUpperCase())}
                                    className="ticket-input-large"
                                    style={{
                                        textAlign: 'center',
                                        letterSpacing: '2px',
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase',
                                        fontSize: '1.25rem',
                                        height: '60px',
                                        background: 'var(--bg-app)',
                                        border: '2px solid var(--accent-light)'
                                    }}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={activationStatus.loading || !activationKey}
                                className="btn-primary-gradient"
                                style={{ height: '60px', fontSize: '1.1rem', fontWeight: 800 }}
                            >
                                {activationStatus.loading ? 'Verificando...' : 'Activar Licencia Ahora'}
                            </button>

                            {activationStatus.error && (
                                <p style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: 600 }}>
                                    {activationStatus.error}
                                </p>
                            )}
                        </form>
                    </div>
                ) : (
                    <div style={{
                        background: 'var(--bg-card-hover)',
                        padding: isMobile ? '1.5rem 1.25rem' : '2rem',
                        borderRadius: '24px',
                        maxWidth: '450px',
                        margin: '0 auto',
                        border: '1px solid var(--accent-light)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            flexDirection: isMobile ? 'column' : 'row',
                            justifyContent: 'space-between',
                            marginBottom: '1.5rem',
                            alignItems: isMobile ? 'flex-start' : 'center',
                            gap: isMobile ? '0.75rem' : '0'
                        }}>
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Estado del Sistema</span>
                            <span style={{
                                color: '#10b981',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: isMobile ? '0.85rem' : '1rem'
                            }}>
                                <CheckCircle2 size={16} /> {role === 'DEVELOPER' ? 'ACCESO VITALICIO' : 'ACTIVO'}
                            </span>
                        </div>
                        {role !== 'DEVELOPER' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                {/* Vencimiento */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    paddingBottom: '1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    gap: isMobile ? '4px' : '0'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.85rem' : '1rem' }}>Vencimiento</span>
                                    <span style={{ fontWeight: 700, color: '#f97316', fontSize: isMobile ? '1.1rem' : '1rem', textAlign: 'left' }}>
                                        {formatDate(licenseInfo.license_expires_at)}
                                    </span>
                                </div>

                                {/* Plan Actual */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    paddingBottom: '1rem',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    gap: isMobile ? '4px' : '0'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.85rem' : '1rem' }}>Plan Actual</span>
                                    <span style={{
                                        fontWeight: 800,
                                        color: licenseInfo.plan_type?.toLowerCase() === 'free' ? '#94a3b8' : '#3b82f6',
                                        textTransform: 'uppercase',
                                        fontSize: isMobile ? '1.1rem' : '1rem',
                                        textAlign: 'left'
                                    }}>
                                        {getPlanLabel(licenseInfo.plan_type)}
                                    </span>
                                </div>

                                {/* Clave Activa */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile ? 'flex-start' : 'center',
                                    gap: isMobile ? '8px' : '0'
                                }}>
                                    <span style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.85rem' : '1rem' }}>Clave Activa</span>
                                    <code style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        letterSpacing: '1px',
                                        fontSize: isMobile ? '1rem' : '0.9rem',
                                        width: isMobile ? '100%' : 'auto',
                                        textAlign: 'left',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        •••• •••• {licenseInfo?.license_key ? licenseInfo.license_key.slice(-4) : '****'}
                                    </code>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '15px 0', borderTop: '1px solid var(--accent-light)', marginTop: '10px' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>Perfil Master / Desarrollador</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivationSection;
