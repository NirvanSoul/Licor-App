import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';

export default function ActivatePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, refreshSession } = useAuth();

    const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error' | 'login_required'
    const [message, setMessage] = useState('');
    const [licenseDetails, setLicenseDetails] = useState(null);

    const token = searchParams.get('token');

    useEffect(() => {
        const activateLicense = async () => {
            if (!token) {
                setStatus('error');
                setMessage('Token de activación no proporcionado.');
                return;
            }

            // Check if user is logged in
            if (!user) {
                setStatus('login_required');
                setMessage('Por favor, inicia sesión o crea una cuenta para activar tu licencia.');
                // Store token in session storage for after login
                sessionStorage.setItem('pending_activation_token', token);
                return;
            }

            try {
                // 1. Find the license by token
                const { data: license, error: fetchError } = await supabase
                    .from('license_keys')
                    .select('*')
                    .eq('activation_token', token)
                    .single();

                if (fetchError || !license) {
                    setStatus('error');
                    setMessage('Link de activación inválido o expirado.');
                    return;
                }

                // 2. Check if already used
                if (license.status === 'used') {
                    setStatus('error');
                    setMessage('Esta licencia ya ha sido activada.');
                    return;
                }

                // 3. Check expiration
                if (license.activation_token_expires_at && new Date(license.activation_token_expires_at) < new Date()) {
                    setStatus('error');
                    setMessage('Este link de activación ha expirado. Contacta al administrador para obtener uno nuevo.');
                    return;
                }

                // 4. Get user's organization
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('organization_id')
                    .eq('id', user.id)
                    .single();

                if (!profile?.organization_id) {
                    setStatus('error');
                    setMessage('Tu cuenta no tiene una organización asociada. Contacta soporte.');
                    return;
                }

                // 5. Calculate expiration date based on plan
                let expiresAt;
                const now = new Date();

                if (license.plan_type === 'yearly') {
                    expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
                } else if (license.plan_type === 'monthly') {
                    expiresAt = new Date(now.setDate(now.getDate() + 30));
                } else { // free / trial
                    expiresAt = new Date(now.setDate(now.getDate() + 7));
                }

                // 6. Update organization with license
                const { error: orgError } = await supabase
                    .from('organizations')
                    .update({
                        license_expires_at: expiresAt.toISOString(),
                        license_status: 'active'
                    })
                    .eq('id', profile.organization_id);

                if (orgError) {
                    console.error('Error updating organization:', orgError);
                    setStatus('error');
                    setMessage('Error al activar la licencia. Por favor intenta de nuevo.');
                    return;
                }

                // 7. Mark license as used
                await supabase
                    .from('license_keys')
                    .update({
                        status: 'used',
                        used_by_org_id: profile.organization_id,
                        used_at: new Date().toISOString(),
                        activated_at: new Date().toISOString(),
                        activated_by_email: user.email,
                        activation_token: null // Invalidate token after use
                    })
                    .eq('id', license.id);

                // 8. Refresh session to get updated claims
                if (refreshSession) await refreshSession();

                setLicenseDetails({
                    plan: license.plan_type,
                    expiresAt: expiresAt.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    })
                });
                setStatus('success');
                setMessage('¡Tu licencia ha sido activada exitosamente!');

            } catch (err) {
                console.error('Activation error:', err);
                setStatus('error');
                setMessage('Error inesperado. Por favor intenta de nuevo.');
            }
        };

        activateLicense();
    }, [token, user]);

    const handleLoginRedirect = () => {
        navigate('/login');
    };

    const handleGoToApp = () => {
        navigate('/');
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-app)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
        }}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                padding: '3rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                border: '1px solid var(--accent-light)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
                {status === 'loading' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            animation: 'pulse 2s infinite'
                        }}>
                            <Loader2 size={40} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 800 }}>
                            Activando Licencia...
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                            Por favor espera un momento
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
                        }}>
                            <CheckCircle2 size={40} color="white" />
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 800 }}>
                            ¡Activación Exitosa!
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '1rem',
                            color: '#10b981'
                        }}>
                            <Sparkles size={20} />
                            <span style={{ fontWeight: 700 }}>Tu cuenta está lista</span>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}>
                            {message}
                        </p>

                        {licenseDetails && (
                            <div style={{
                                background: 'rgba(16, 185, 129, 0.1)',
                                borderRadius: '16px',
                                padding: '1.25rem',
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(16, 185, 129, 0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Plan:</span>
                                    <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                                        {licenseDetails.plan === 'yearly' ? 'Anual' :
                                            licenseDetails.plan === 'monthly' ? '30 Días' : 'Prueba'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Válido hasta:</span>
                                    <span style={{ fontWeight: 700, color: '#10b981' }}>
                                        {licenseDetails.expiresAt}
                                    </span>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleGoToApp}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                        >
                            Entrar a la App
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.4)'
                        }}>
                            <AlertCircle size={40} color="white" />
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 800 }}>
                            Error de Activación
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}>
                            {message}
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'var(--accent-light)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--accent-light)',
                                borderRadius: '16px',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            Ir al Inicio
                        </button>
                    </>
                )}

                {status === 'login_required' && (
                    <>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1.5rem',
                            boxShadow: '0 10px 30px rgba(245, 158, 11, 0.4)'
                        }}>
                            <AlertCircle size={40} color="white" />
                        </div>
                        <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 800 }}>
                            Inicia Sesión
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '0 0 1.5rem' }}>
                            {message}
                        </p>
                        <button
                            onClick={handleLoginRedirect}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                fontWeight: 800,
                                fontSize: '1rem',
                                cursor: 'pointer',
                                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)'
                            }}
                        >
                            Iniciar Sesión
                        </button>
                    </>
                )}
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `}</style>
        </div>
    );
}
