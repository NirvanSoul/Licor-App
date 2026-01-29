import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { UserPlus, Store, Eye, EyeOff, PartyPopper, Hash, ShieldCheck, User, ArrowLeft } from 'lucide-react';
import './SalesPage.css';

export default function Register() {
    const navigate = useNavigate();
    const location = useLocation();

    // Check URL params for explicit mode
    const params = new URLSearchParams(location.search);
    const initialModeIsEmployee = params.get('mode') === 'employee';

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Role State: Default to Owner unless explicitly Employee mode
    const [isOwner, setIsOwner] = useState(!initialModeIsEmployee);

    const [liquorStoreName, setLiquorStoreName] = useState('');
    const [orgCode, setOrgCode] = useState(''); // New Field for Employees

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (initialModeIsEmployee) {
            setIsOwner(false);
        }
    }, [initialModeIsEmployee]);

    // Validation (Derived immediately for responsiveness)
    const isCommonValid = fullName.trim().length > 0 && email.includes('@') && password.length >= 6;
    const isFormValid = isOwner
        ? (isCommonValid && liquorStoreName.trim().length > 0)
        : isCommonValid; // Org Code is optional

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Double check just in case
        if (!isFormValid) {
            setLoading(false);
            return;
        }

        try {
            // 2. Prepare Metadata
            const metadata = {
                full_name: fullName,
                liquor_store_name: isOwner ? liquorStoreName : null,
                org_code: (!isOwner && orgCode.trim().length > 0) ? orgCode.toUpperCase() : null
            };

            console.log('Enviando registro a Supabase:', metadata);

            // 3. Send to Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: metadata,
                },
            });

            if (authError) throw authError;

            // 5. Success
            setShowSuccess(true);

        } catch (err) {
            console.error("Error en registro:", err);
            setError(err.message || 'Ocurrió un error al registrarse.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'var(--bg-app)', padding: '1rem',
            transition: 'background var(--transition-smooth)'
        }}>
            {/* Same Container Styles */}
            <div style={{
                background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: '32px',
                width: '100%', maxWidth: '400px',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid var(--accent-light)',
                transition: 'all var(--transition-smooth)',
                position: 'relative'
            }}>
                <button
                    onClick={() => navigate('/login')}
                    style={{
                        position: 'absolute', top: '24px', left: '24px',
                        background: 'var(--bg-card-hover)', border: '1px solid var(--accent-light)',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        padding: '8px 16px', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontWeight: 600, fontSize: '0.9rem',
                        transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--text-muted)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--accent-light)';
                    }}
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
                        {isOwner ? 'Crear Negocio' : 'Unete a un Equipo'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
                        {isOwner ? 'Registra tu Licorería' : 'Cuenta de Empleado'}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEE2E2', color: '#991B1B', padding: '0.75rem',
                        borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group-large">
                        <input
                            type="text"
                            placeholder="Nombre Completo"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
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
                    <div style={{ position: 'relative', width: '100%', marginBottom: '1.25rem' }}>
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
                                position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                                display: 'flex', alignItems: 'center', padding: '4px'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Checkbox de Dueño vs Empleado (Hidden if explicit mode) */}
                    {!initialModeIsEmployee && (
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '1rem', background: 'var(--bg-card-hover)', borderRadius: '16px',
                            border: isOwner ? '2px solid var(--accent-color)' : '1px solid var(--accent-light)',
                            cursor: 'pointer', transition: 'all 0.2s', marginBottom: '0.5rem'
                        }} onClick={() => setIsOwner(!isOwner)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: '50%',
                                    background: isOwner ? 'var(--accent-color)' : 'var(--accent-light)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Store size={18} color={isOwner ? 'white' : 'var(--text-secondary)'} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Soy Dueño de Negocio</span>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Crear nueva licorería</span>
                                </div>
                            </div>
                            <div style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                border: isOwner ? '6px solid var(--accent-color)' : '2px solid var(--text-muted)',
                                background: isOwner ? 'white' : 'transparent'
                            }}></div>
                        </div>
                    )}

                    {/* Conditional Fields */}
                    {isOwner ? (
                        <div className="input-group-large" style={{ animation: 'fadeIn 0.3s' }}>
                            <input
                                type="text"
                                placeholder="Nombre de tu Licorería"
                                value={liquorStoreName}
                                onChange={(e) => setLiquorStoreName(e.target.value)}
                                required={isOwner}
                                className="ticket-input-large"
                                style={{ width: '100%', boxSizing: 'border-box', border: '2px solid var(--accent-color)' }}
                            />
                        </div>
                    ) : (
                        <div className="input-group-large" style={{ animation: 'fadeIn 0.3s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                            {/* 1. Title */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 800,
                                margin: '0 0 4px 0'
                            }}>
                                <Hash size={20} color="var(--accent-color)" /> Código de Organización
                            </div>

                            {/* 2. Helper Text */}
                            <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Pídelo a tu empleador (Opcional). <br />
                                Puedes ingresar sin código y unirte después.
                            </div>

                            {/* 3. Input Bar */}
                            <input
                                type="text"
                                placeholder="------"
                                value={orgCode}
                                onChange={(e) => setOrgCode(e.target.value.toUpperCase())}
                                required={false}
                                maxLength={6}
                                className="ticket-input-large"
                                style={{
                                    width: '100%', boxSizing: 'border-box', border: '2px solid var(--accent-color)',
                                    textAlign: 'center', letterSpacing: '8px', fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    textTransform: 'uppercase', fontSize: '1.75rem', fontFamily: 'monospace',
                                    padding: '1rem', height: 'auto', borderRadius: '16px', background: 'var(--bg-input)'
                                }}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!isFormValid || loading}
                        className="btn-primary-gradient"
                        style={{
                            marginTop: '0.5rem',
                            opacity: (!isFormValid || loading) ? 0.5 : 1,
                            cursor: (!isFormValid || loading) ? 'not-allowed' : 'pointer',
                            background: (!isFormValid) ? 'var(--text-muted)' : 'linear-gradient(135deg, #FA8E36 0%, #F97316 100%)'
                        }}
                    >
                        {loading ? 'Procesando...' : (isOwner ? 'Registrar Negocio' : 'Enviar Solicitud')}
                    </button>
                </form>

                <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={{ color: 'var(--accent-color)', fontWeight: 700, textDecoration: 'none' }}>
                        Inicia Sesión
                    </Link>
                </div>
            </div>

            {/* Modal de Éxito */}
            {showSuccess && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', borderRadius: '32px', padding: '2.5rem 2rem',
                        width: '100%', maxWidth: '360px', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        border: '1px solid var(--accent-light)'
                    }}>
                        <div style={{
                            background: 'rgba(249, 115, 22, 0.1)', width: '84px', height: '84px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <PartyPopper size={44} color="var(--accent-color)" />
                        </div>
                        <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                            {isOwner ? '¡Bienvenido!' : '¡Solicitud Enviada!'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', fontWeight: 500 }}>
                            {isOwner
                                ? 'Tu licorería ha sido registrada.'
                                : 'Tu solicitud ha sido enviada al dueño para aprobación.'}
                        </p>
                        <button
                            onClick={() => navigate(isOwner ? '/login?role=owner' : '/login?role=employee')}
                            className="btn-primary-gradient"
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}