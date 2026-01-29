import React, { useState } from 'react';
// import { supabase } from '../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import './SalesPage.css';

import StoreIcon from '../assets/Store Icon.svg';
import EmployeeIcon from '../assets/Employe Icon.svg';

export default function Login() {
    const navigate = useNavigate();

    const location = useLocation();

    // UI State: 'selection' | 'login'
    // Check if role is pre-selected via URL params (e.g. redirect from Register)
    const params = new URLSearchParams(location.search);
    const initialRole = params.get('role');

    const [viewMode, setViewMode] = useState(initialRole ? 'login' : 'selection');
    const [selectedRole, setSelectedRole] = useState(initialRole || null); // 'owner' | 'employee'

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();

    // Hover State for Cards
    const [hoveredCard, setHoveredCard] = useState(null);

    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setViewMode('login');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            const params = new URLSearchParams(window.location.search);
            const redirectPath = params.get('redirect');
            navigate(redirectPath || '/vender');
        } catch (err) {
            console.error(err);
            setError('Credenciales inválidas o error de conexión.');
        } finally {
            setLoading(false);
        }
    };

    // --- VIEW: ROLE SELECTION MODAL ---
    if (viewMode === 'selection') {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: 'var(--bg-app)', padding: '1rem',
                transition: 'background var(--transition-smooth)'
            }}>
                <div style={{
                    background: 'var(--bg-card)', padding: '3rem 2rem', borderRadius: '32px',
                    width: '100%', maxWidth: '480px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--accent-light)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        marginTop: '0.5rem', marginBottom: '2rem',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <img src="/KavasAppLogo.svg" alt="App Logo" style={{ width: '80px', height: '80px', borderRadius: '20px' }} />
                    </div>

                    <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        Bienvenido a Kavas
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.5' }}>
                        Selecciona tu tipo de perfil para continuar
                    </p>

                    <div className="role-selection-grid">
                        {/* CARD DUENO (App Orange Gradient) */}
                        <button
                            onClick={() => handleRoleSelect('owner')}
                            className="role-card"
                            onMouseEnter={() => setHoveredCard('owner')}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{
                                background: 'linear-gradient(135deg, #FA8E36 0%, #F97316 100%)', // Matches btn-primary-gradient
                                border: 'none',
                                transform: hoveredCard === 'owner' ? 'translateY(-6px)' : 'none',
                                padding: '1.75rem 1rem', borderRadius: '28px', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: hoveredCard === 'owner' ? '0 20px 25px -5px rgba(234, 88, 12, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                position: 'relative', overflow: 'hidden'
                            }}
                        >
                            {/* Decorative Glow */}
                            <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '100px', height: '100px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(20px)' }}></div>

                            <div style={{
                                width: '68px', height: '68px', borderRadius: '50%',
                                background: '#ffffff', // White Circle
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                                {/* Gradient Icon via Mask */}
                                <div style={{
                                    width: '34px', height: '34px',
                                    background: 'linear-gradient(135deg, #F97316 80%, #FA8E36 20%)', // Orange Gradient
                                    maskImage: `url("${StoreIcon}")`,
                                    WebkitMaskImage: `url("${StoreIcon}")`,
                                    maskSize: 'contain',
                                    WebkitMaskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    WebkitMaskPosition: 'center'
                                }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '0.5px' }}>Empleador</h3>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4', fontWeight: 500 }}>Dueño de negocio, gestiona inventario y finanzas.</p>
                            </div>
                        </button>

                        {/* CARD EMPLEADO (App Green Gradient) */}
                        <button
                            onClick={() => handleRoleSelect('employee')}
                            className="role-card"
                            onMouseEnter={() => setHoveredCard('employee')}
                            onMouseLeave={() => setHoveredCard(null)}
                            style={{
                                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)', // Matches standard Emerald Success/Active green
                                border: 'none',
                                transform: hoveredCard === 'employee' ? 'translateY(-6px)' : 'none',
                                padding: '1.75rem 1rem', borderRadius: '28px', cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: hoveredCard === 'employee' ? '0 20px 25px -5px rgba(16, 185, 129, 0.4)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                position: 'relative', overflow: 'hidden'
                            }}
                        >
                            {/* Decorative Glow */}
                            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)', borderRadius: '50%', filter: 'blur(20px)' }}></div>

                            <div style={{
                                width: '68px', height: '68px', borderRadius: '50%',
                                background: '#ffffff', // White Circle
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}>
                                {/* Gradient Icon via Mask */}
                                <div style={{
                                    width: '34px', height: '34px',
                                    background: 'linear-gradient(135deg, #10B981 100%, #34D399 0%)', // Green Gradient
                                    maskImage: `url("${EmployeeIcon}")`,
                                    WebkitMaskImage: `url("${EmployeeIcon}")`,
                                    maskSize: 'contain',
                                    WebkitMaskSize: 'contain',
                                    maskRepeat: 'no-repeat',
                                    WebkitMaskRepeat: 'no-repeat',
                                    maskPosition: 'center',
                                    WebkitMaskPosition: 'center'
                                }} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', marginBottom: '6px', letterSpacing: '0.5px' }}>Empleado</h3>
                                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', lineHeight: '1.4', fontWeight: 500 }}>Vendedor, caja y atención al cliente.</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: LOGIN FORM ---
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'var(--bg-app)', padding: '1rem',
            transition: 'background var(--transition-smooth)'
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: '32px',
                width: '100%', maxWidth: '400px',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid var(--accent-light)',
                transition: 'all var(--transition-smooth)',
                position: 'relative'
            }}>
                <button
                    onClick={() => setViewMode('selection')}
                    className="back-btn"
                >
                    <ArrowLeft size={18} />
                    Volver
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1.5rem auto'
                    }}>
                        <img src="/KavasAppLogo.svg" alt="Kavas App Logo" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {selectedRole === 'owner' ? 'Acceso Dueños' : 'Acceso Empleados'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>Ingresa tus credenciales</p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEE2E2', color: '#991B1B', padding: '0.75rem',
                        borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group-large">
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ position: 'relative', width: '100%' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box', paddingRight: '48px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '14px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary-gradient"
                        style={{ marginTop: '1rem' }}
                    >
                        {loading ? 'Entrando...' : 'Ingresar'}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    ¿No tienes cuenta?{' '}
                    <Link
                        to={selectedRole === 'employee' ? '/register?mode=employee' : '/register'}
                        style={{ color: 'var(--accent-color)', fontWeight: 700, textDecoration: 'none' }}
                    >
                        {selectedRole === 'employee' ? 'Solicitar Acceso' : 'Registrar Negocio'}
                    </Link>
                </div>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <Link to="/forgot-password" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none', opacity: 0.8 }}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>

            <style jsx>{`
                /* Grid Layout for Roles */
                .role-selection-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1rem;
                    width: 100%;
                }

                /* Default Card Styles (Desktop) - Inherits inline styles but adding overrides if needed */
                .role-card {
                    /* Default is vertical column as per inline styles */
                }

                /* Mobile Adjustments */
                @media (max-width: 600px) {
                    .role-selection-grid {
                        grid-template-columns: 1fr; /* Stack vertically */
                        gap: 0.75rem; /* Slightly tighter gap */
                    }
                    
                    .role-card {
                        flex-direction: row !important; /* Horizontal internal layout */
                        align-items: center !important;
                        text-align: left !important;
                        padding: 1rem 1.25rem !important; /* Reduced padding */
                        gap: 1rem !important;
                        min-height: 80px; /* Reduced height */
                        border-radius: 20px !important; /* Slightly reduced radius for better proportion */
                    }

                    .role-card > div:first-child {
                        /* Icon Container */
                        width: 42px !important; /* Smaller icon container */
                        height: 42px !important;
                        flex-shrink: 0;
                        border-radius: 12px !important; /* Softer square or circle */
                    }

                    .role-card > div:first-child > div {
                        /* Icon Mask */
                        width: 20px !important;
                        height: 20px !important;
                    }

                    .role-card > div:last-child {
                        /* Text Container */
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                        justify-content: center;
                    }
                    
                    .role-card h3 {
                        margin-bottom: 2px !important;
                        font-size: 1rem !important; /* Slightly smaller text */
                    }
                    
                    .role-card p {
                        font-size: 0.75rem !important;
                        line-height: 1.3 !important;
                        margin: 0;
                        opacity: 0.9;
                    }
                }

                /* Volver Button - Light Mode Compatibility */
                .back-btn {
                    position: absolute;
                    top: 24px;
                    left: 24px;
                    background: rgba(128, 128, 128, 0.1); /* Visible on both dark and light */
                    border: 1px solid rgba(128, 128, 128, 0.2);
                    color: var(--text-primary);
                    cursor: pointer;
                    padding: 8px 16px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                    box-shadow: none;
                }

                .back-btn:hover {
                    background: rgba(128, 128, 128, 0.2);
                    transform: translateY(-1px);
                    color: var(--text-primary);
                }
            `}</style>
        </div>
    );
}
