
import React from 'react';
import { Package, Star, Box, CircleDollarSign, Users, ShieldCheck, Sun, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const SettingsMenu = ({ setCurrentView }) => {
    const { role, isLicenseActive, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const isInactive = isLicenseActive === false;

    const SectionSeparator = ({ label }) => (
        <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0 1rem 0', gap: '1rem', padding: '0 0.5rem' }}>
            <div style={{
                flex: 1,
                height: '1px',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }}></div>
            <span style={{
                fontSize: '0.9rem',
                fontWeight: 600,
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                letterSpacing: '0.5px',
                textTransform: 'capitalize'
            }}>{label}</span>
            <div style={{
                flex: 1,
                height: '1px',
                background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
            }}></div>
        </div>
    );

    const MenuOption = ({ item }) => {
        const isDisabled = isInactive && !['activation', 'users'].includes(item.id);
        const [isHovered, setIsHovered] = React.useState(false);

        return (
            <button
                key={item.id}
                className={`option-btn ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && setCurrentView(item.id)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{
                    height: 'auto',
                    padding: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '16px',
                    background: theme === 'dark' ? '#111111' : '#ffffff',
                    border: theme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    marginBottom: '1rem',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: theme === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
                }}
            >
                {/* Glow effect on hover */}
                {isHovered && !isDisabled && (
                    <div style={{
                        position: 'absolute',
                        left: 0, top: 0, bottom: 0,
                        width: '4px',
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}`
                    }} />
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: item.color,
                        width: '44px', height: '44px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '12px', flexShrink: 0,
                        boxShadow: `0 0 15px ${item.color}40`
                    }}>
                        <item.icon size={22} color="white" />
                    </div>
                    <span style={{
                        fontSize: '1rem',
                        fontWeight: 700,
                        color: theme === 'dark' ? 'white' : '#111827',
                        textAlign: 'left'
                    }}>{item.label}</span>
                </div>
                {!isDisabled && <ChevronRight size={20} color={theme === 'dark' ? "#444" : "#9ca3af"} />}
            </button>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
            {isInactive && (
                <div style={{
                    background: 'rgba(234, 88, 12, 0.1)',
                    border: '1px solid #f97316',
                    padding: '1rem',
                    borderRadius: '16px',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    color: '#f97316',
                    fontWeight: 600
                }}>
                    Para usar las funciones del menú Ajustes activa la licencia.
                </div>
            )}

            {/* --- GESTIÓN --- */}
            <SectionSeparator label="Gestion" />
            {/* Only OWNER, MANAGER, DEVELOPER can access Product Management and Inventory */}
            {role && ['OWNER', 'MANAGER', 'DEVELOPER'].includes(role) && (
                <>
                    <MenuOption item={{ id: 'products', label: 'Gestion de Productos', icon: Package, color: '#4ade80' }} />
                    <MenuOption item={{ id: 'dashboard', label: 'Precios Actuales', icon: Star, color: '#3b82f6' }} />
                    <MenuOption item={{ id: 'inventory', label: 'Inventario', icon: Box, color: '#a3e635' }} />
                </>
            )}

            {/* Employees only see Prices (read-only, enforced in PriceSection) */}
            {role && role === 'EMPLOYEE' && (
                <MenuOption item={{ id: 'dashboard', label: 'Precios Actuales', icon: Star, color: '#3b82f6' }} />
            )}

            {/* --- GENERAL --- */}
            <SectionSeparator label="General" />
            <MenuOption item={{ id: 'bcv', label: 'Tasas', icon: CircleDollarSign, color: '#f97316' }} />
            <MenuOption item={{ id: 'users', label: 'Usuarios', icon: Users, color: '#ef4444' }} />
            {(role && ['OWNER', 'MANAGER', 'DEVELOPER'].includes(role)) && (
                <MenuOption item={{ id: 'activation', label: 'Activacion', icon: ShieldCheck, color: '#10b981' }} />
            )}

            {/* --- APARIENCIA Y CIERRE (Acercados) --- */}
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div
                    onClick={toggleTheme}
                    style={{
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderRadius: '16px',
                        background: theme === 'dark' ? '#111111' : '#ffffff',
                        border: theme === 'dark' ? '1px solid #222' : '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: theme === 'light' ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <div style={{
                            background: '#6366f1',
                            width: '44px', height: '44px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            borderRadius: '12px', flexShrink: 0,
                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Sun size={22} color="white" />
                        </div>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: theme === 'dark' ? 'white' : '#111827' }}>Apariencia</span>
                    </div>

                    <div style={{
                        width: '46px',
                        height: '24px',
                        background: theme === 'dark' ? '#6366f1' : '#e5e7eb',
                        borderRadius: '20px',
                        padding: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.3s',
                        position: 'relative'
                    }}>
                        <div style={{
                            width: '18px', height: '18px',
                            background: 'white', borderRadius: '50%',
                            transform: theme === 'dark' ? 'translateX(22px)' : 'translateX(0)',
                            transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                        }} />
                    </div>
                </div>

                <button
                    onClick={logout}
                    style={{
                        height: 'auto',
                        padding: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1.25rem',
                        borderRadius: '16px',
                        background: theme === 'dark' ? '#1a1111' : '#fff1f2',
                        border: theme === 'dark' ? '1px solid #331111' : '1px solid #fecaca',
                        cursor: 'pointer',
                        width: '100%',
                        transition: 'all 0.2s ease',
                    }}
                >
                    <div style={{ background: '#ef4444', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', flexShrink: 0, boxShadow: '0 0 15px rgba(239, 68, 68, 0.25)' }}>
                        <LogOut size={22} color="white" />
                    </div>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default SettingsMenu;
