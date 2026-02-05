import React, { useState } from 'react';
// import { supabase } from '../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff, ArrowLeft, ArrowRight, Mail, Lock } from 'lucide-react';
import './SalesPage.css';
import './Login.css';

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

    // --- VIEW: ROLE SELECTION ---
    if (viewMode === 'selection') {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                height: '100vh', background: '#09090b', // Deep dark bg
                padding: '1.5rem',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{
                    width: '100%', maxWidth: '420px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center'
                }}>
                    {/* App Logo & Welcome */}
                    <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', borderRadius: '22px',
                            background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
                            boxShadow: '0 20px 40px -10px rgba(249, 115, 22, 0.4)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <img src="/KavasAppLogo.svg" alt="App Logo" style={{ width: '100%', height: '100%', borderRadius: '22px' }} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>
                            Bienvenido a Kavas
                        </h2>
                        <p style={{ color: '#a1a1aa', fontSize: '1rem', fontWeight: 400 }}>
                            Selecciona tu perfil para continuar
                        </p>
                    </div>

                    <div className="role-grid">
                        {/* CARD DUENO */}
                        <button
                            onClick={() => handleRoleSelect('owner')}
                            className="role-btn owner-btn"
                        >
                            <div className="btn-glow" />
                            <div className="icon-box">
                                <img src={StoreIcon} alt="Owner" />
                            </div>
                            <div className="text-content">
                                <h3>Jefe</h3>
                                <p>Gestión total del negocio</p>
                            </div>
                            <ArrowRight className="arrow-icon" size={20} strokeWidth={3} />
                        </button>

                        {/* CARD EMPLEADO */}
                        <button
                            onClick={() => handleRoleSelect('employee')}
                            className="role-btn employee-btn"
                        >
                            <div className="btn-glow" />
                            <div className="icon-box">
                                <img src={EmployeeIcon} alt="Employee" />
                            </div>
                            <div className="text-content">
                                <h3>Empleado</h3>
                                <p>Ventas y caja</p>
                            </div>
                            <ArrowRight className="arrow-icon" size={20} strokeWidth={3} />
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
            height: '100vh', background: '#09090b', padding: '1.5rem',
            fontFamily: 'Inter, sans-serif'
        }}>
            <div style={{
                width: '100%', maxWidth: '400px',
                background: 'rgba(24, 24, 27, 0.8)',
                padding: '2.5rem 2rem',
                borderRadius: '32px',
                border: '1px solid #27272a',
                backdropFilter: 'blur(12px)',
                position: 'relative'
            }}>
                <button
                    onClick={() => setViewMode('selection')}
                    style={{
                        position: 'absolute', top: '24px', left: '24px',
                        background: '#27272a', border: '1px solid #3f3f46',
                        color: '#a1a1aa', cursor: 'pointer',
                        padding: '8px 16px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 600, fontSize: '0.85rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.color = 'white';
                        e.currentTarget.style.background = '#3f3f46';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.color = '#a1a1aa';
                        e.currentTarget.style.background = '#27272a';
                    }}
                >
                    <ArrowLeft size={18} strokeWidth={2.5} />
                    Volver
                </button>

                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: selectedRole === 'owner'
                            ? 'linear-gradient(135deg, #FA8E36 0%, #F97316 100%)'
                            : 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: selectedRole === 'owner'
                            ? '0 10px 20px -5px rgba(249, 115, 22, 0.4)'
                            : '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
                    }}>
                        <img src={selectedRole === 'owner' ? StoreIcon : EmployeeIcon} alt="Icon" style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', margin: 0 }}>
                        {selectedRole === 'owner' ? 'Login Jefe' : 'Login Jefe'}
                    </h2>
                    <p style={{ color: '#a1a1aa', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                        Ingresa tus credenciales para continuar
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem',
                        borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', textAlign: 'center',
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div className="input-group-large" style={{ position: 'relative' }}>
                        <Mail size={20} color="#52525b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '48px', background: '#09090b', border: '1px solid #27272a', color: 'white' }}
                        />
                    </div>
                    <div className="input-group-large" style={{ position: 'relative' }}>
                        <Lock size={20} color="#52525b" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }} />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box', paddingLeft: '48px', paddingRight: '48px', background: '#09090b', border: '1px solid #27272a', color: 'white' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: '#52525b',
                                display: 'flex', alignItems: 'center', padding: '4px', zIndex: 1
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <Link to="/forgot-password" style={{ color: '#a1a1aa', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}>
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary-gradient"
                        style={{
                            marginTop: '0.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            background: selectedRole === 'owner'
                                ? 'linear-gradient(135deg, #FA8E36 0%, #F97316 100%)'
                                : 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                            boxShadow: selectedRole === 'owner'
                                ? '0 10px 20px -5px rgba(249, 115, 22, 0.4)'
                                : '0 10px 20px -5px rgba(16, 185, 129, 0.4)'
                        }}
                    >
                        {loading ? 'Iniciando...' : (
                            <>
                                <LogIn size={20} strokeWidth={2.5} />
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: '#a1a1aa' }}>
                    ¿No tienes una cuenta?{' '}
                    <Link
                        to={selectedRole === 'owner' ? "/register" : "/register?mode=employee"}
                        style={{ color: selectedRole === 'owner' ? '#f97316' : '#10b981', fontWeight: 700, textDecoration: 'none' }}
                    >
                        Regístrate
                    </Link>
                </div>
            </div>
        </div>
    );
}

