import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLicenseByToken, activateLicenseByToken } from '../services/api';
import { CheckCircle2, AlertCircle, Loader2, Rocket, ArrowRight } from 'lucide-react';

export default function ActivateLicense() {
    const { token } = useParams();
    const navigate = useNavigate();
    const { user, organizationId, organizationName, loading: authLoading, refreshLicense } = useAuth();

    const [license, setLicense] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Token de activación no proporcionado.");
            setLoading(false);
            return;
        }

        const fetchLicense = async () => {
            const { data, error } = await getLicenseByToken(token);
            if (error || !data) {
                setError("Este enlace de activación es inválido o ya ha sido utilizado.");
            } else {
                setLicense(data);
            }
            setLoading(false);
        };

        fetchLicense();
    }, [token]);

    const handleActivate = async () => {
        if (!user || !organizationId) return;

        setActivating(true);
        setError(null);

        try {
            const { success, error } = await activateLicenseByToken(token, organizationId, user.email);
            if (success) {
                setSuccess(true);
                await refreshLicense();
                setTimeout(() => {
                    navigate('/vender');
                }, 3000);
            } else {
                setError(error?.message || "Error al activar la licencia.");
            }
        } catch (err) {
            setError("Error de conexión al activar.");
        } finally {
            setActivating(false);
        }
    };

    if (loading || authLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'white' }}>
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent-color)' }} />
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Validando enlace...</p>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: 'var(--bg-app)', padding: '1rem'
        }}>
            <div style={{
                background: 'var(--bg-card)', padding: '2.5rem 2rem', borderRadius: '32px',
                width: '100%', maxWidth: '450px',
                boxShadow: 'var(--shadow-soft)',
                border: '1px solid var(--accent-light)',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '24px',
                        background: success ? 'rgba(16, 185, 129, 0.1)' : (error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(249, 115, 22, 0.1)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        {success ? <CheckCircle2 size={40} color="#10b981" /> :
                            error ? <AlertCircle size={40} color="#ef4444" /> :
                                <Rocket size={40} color="#f97316" />}
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {success ? '¡Activado con éxito!' : (error ? 'Error de Enlace' : 'Activar Licencia')}
                    </h2>
                </div>

                {error ? (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>{error}</p>
                        <button onClick={() => navigate('/')} className="btn-primary-gradient" style={{ width: '100%' }}>
                            Volver al Inicio
                        </button>
                    </>
                ) : success ? (
                    <>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                            Tu cuenta ha sido actualizada. El plan <strong>{license?.plan_type?.toUpperCase()}</strong> ya está activo.
                        </p>
                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.2)', marginBottom: '2rem' }}>
                            <p style={{ margin: 0, color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>Redirigiendo al panel...</p>
                        </div>
                    </>
                ) : (
                    <>
                        {!user ? (
                            <>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: 1.6 }}>
                                    Para activar esta licencia de <strong>{license?.plan_type?.toUpperCase()}</strong>, primero debes iniciar sesión en tu cuenta.
                                </p>
                                <Link to={`/login?redirect=/activar/${token}`} className="btn-primary-gradient" style={{ display: 'block', textDecoration: 'none', textAlign: 'center' }}>
                                    Iniciar Sesión para Activar
                                </Link>
                            </>
                        ) : (
                            <>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                    ¿Deseas activar esta licencia de <strong>{license?.plan_type?.toUpperCase()}</strong> para la organización <strong>{organizationName}</strong>?
                                </p>
                                <div style={{ background: 'var(--accent-light)', padding: '1rem', borderRadius: '16px', marginBottom: '2rem', textAlign: 'left' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Usuario:</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{user.email}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Organización:</span>
                                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{organizationName}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={handleActivate}
                                    disabled={activating}
                                    className="btn-primary-gradient"
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
                                >
                                    {activating ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Activación'}
                                    {!activating && <ArrowRight size={20} />}
                                </button>
                                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', marginTop: '1.5rem', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                                    Cancelar
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
