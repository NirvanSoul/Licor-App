import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import './SalesPage.css';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { updatePassword, user, loading: authLoading } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await updatePassword(password);
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            console.error(err);
            setError(err.message || 'Error al actualizar la contraseña.');
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
            <div style={{
                background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: '32px',
                width: '100%', maxWidth: '400px',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid var(--accent-light)',
                transition: 'all var(--transition-smooth)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: '64px', height: '64px',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1.5rem auto'
                    }}>
                        <img src="/KavasAppLogo.svg" alt="Kavas App Logo" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Nueva Contraseña</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>Ingresa tu nueva clave de acceso</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem',
                        borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.95rem',
                        textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)',
                        fontWeight: 600
                    }}>
                        {error}
                    </div>
                )}

                {!success ? (
                    <>
                        {authLoading ? (
                            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                Verificando sesión...
                            </div>
                        ) : (
                            <>
                                {!user ? (
                                    <div style={{
                                        background: 'rgba(249, 115, 22, 0.1)', color: 'var(--accent-color)', padding: '1.25rem',
                                        borderRadius: '16px', marginBottom: '1.5rem', fontSize: '0.95rem',
                                        textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.2)',
                                        fontWeight: 600
                                    }}>
                                        Sesión no detectada. Asegúrate de haber entrado por el link de tu correo.
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        <div className="input-group-large" style={{ position: 'relative' }}>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Nueva Contraseña"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="ticket-input-large"
                                                style={{ width: '100%', boxSizing: 'border-box', paddingRight: '48px' }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                style={{
                                                    position: 'absolute', right: '14px', top: '50%',
                                                    transform: 'translateY(-50%)', background: 'none',
                                                    border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                            </button>
                                        </div>

                                        <div className="input-group-large">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Confirmar Contraseña"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                className="ticket-input-large"
                                                style={{ width: '100%', boxSizing: 'border-box' }}
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="btn-primary-gradient"
                                        >
                                            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </>
                ) : (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2rem',
                            borderRadius: '24px', marginBottom: '1.5rem', fontSize: '1.1rem',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                            fontWeight: 600, border: '1px solid rgba(16, 185, 129, 0.2)'
                        }}>
                            <CheckCircle size={48} />
                            <span>¡Contraseña actualizada con éxito! Redirigiendo...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
