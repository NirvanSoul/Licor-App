import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCcw, Key, Copy, Plus, Trash2, Lock, X, CheckCircle2, Database, RefreshCw, ExternalLink } from 'lucide-react';
import { generateFakeData, clearAllData } from '../utils/DevDataGenerator';

export default function DeveloperPage() {
    const { role, loading } = useAuth();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState('LICENSE'); // 'LICENSE' | 'TOOLS'
    const [generatedKeys, setGeneratedKeys] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [genPlan, setGenPlan] = useState('monthly'); // 'monthly' | 'yearly' | 'free'
    const [copiedId, setCopiedId] = useState(null);

    // MFA States
    const [mfaEnrolled, setMfaEnrolled] = useState(false);
    const [showMfaEnroll, setShowMfaEnroll] = useState(false);
    const [mfaData, setMfaData] = useState(null);
    const [showMfaVerify, setShowMfaVerify] = useState(false);
    const [showMfaIntro, setShowMfaIntro] = useState(false);
    const [mfaCode, setMfaCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [mfaError, setMfaError] = useState('');

    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!loading && role !== 'DEVELOPER') {
            navigate('/');
        }
    }, [role, loading, navigate]);

    const isMobile = windowWidth < 768;


    const fetchKeys = async () => {
        const { data, error } = await supabase
            .from('license_keys')
            .select('*, organizations:used_by_org_id(name, license_expires_at)')
            .order('created_at', { ascending: false });
        if (!error) setGeneratedKeys(data || []);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const isExpiringSoon = (dateStr) => {
        if (!dateStr) return false;
        const expiry = new Date(dateStr);
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        const days = diff / (1000 * 60 * 60 * 24);
        return days <= 7 && days > 0;
    };

    const isExpired = (dateStr) => {
        if (!dateStr) return false;
        return new Date(dateStr) < new Date();
    };

    const getDaysRemaining = (dateStr) => {
        if (!dateStr) return null;
        const expiry = new Date(dateStr);
        expiry.setHours(23, 59, 59, 999); // Fin del día de vencimiento
        const now = new Date();
        const diff = expiry.getTime() - now.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        return days;
    };

    const checkMfaStatus = async () => {
        if (!supabase.auth.mfa) return;
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (data?.all?.some(f => f.status === 'verified')) {
            setMfaEnrolled(true);
        }
    };

    useEffect(() => {
        if (role === 'DEVELOPER') {
            fetchKeys();
            checkMfaStatus();
        }
    }, [role]);

    const startEnrollment = async () => {
        // SEGURIDAD: Si ya está enrolado, bloquear cualquier intento de generar nuevos secretos
        if (mfaEnrolled) {
            alert("Sistema Blindado: Tu cuenta ya tiene una seguridad activa. Por seguridad, no se permite generar nuevos seriales.");
            return;
        }

        // PREVENCIÓN: Bloquear antes de que Supabase intente usar criptografía si no es seguro
        if (!window.isSecureContext) {
            alert("⚠️ BLOQUEO POR SEGURIDAD:\n\nEl sistema de Google Authenticator no permite configurarse a través de una conexión no segura (HTTP) usando una dirección IP.\n\nSOLUCIÓN: Por favor, abre el sistema usando 'localhost' en esta computadora para configurar la seguridad por primera vez.");
            setShowMfaIntro(false);
            return;
        }

        if (!supabase.auth.mfa) {
            alert("Tu versión de Supabase SDK no soporta MFA. Actualiza @supabase/supabase-js.");
            return;
        }
        try {
            // 1. Limpiar intentos previos
            const { data: factors } = await supabase.auth.mfa.listFactors();
            if (factors?.all?.length > 0) {
                for (const f of factors.all) {
                    if (f.status === 'unverified') {
                        await supabase.auth.mfa.unenroll({ factorId: f.id });
                    }
                }
            }

            // 2. Iniciar nuevo enrolamiento (Solo TOTP)
            const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
            if (error) {
                alert("Error de Supabase: " + error.message);
                return;
            }
            if (data) {
                setMfaData(data);
                setShowMfaEnroll(true);
            }
        } catch (err) {
            console.error("MFA Error:", err);
            setShowMfaEnroll(false);
            setShowMfaIntro(false);
            alert("Error al conectar con el sistema de seguridad. Verifica tu conexión.");
        }
    };

    const confirmEnrollment = async () => {
        if (!mfaCode) return;
        setIsVerifying(true);
        setMfaError('');
        try {
            if (!mfaData?.id) throw new Error("No hay datos de enrolamiento activos.");
            const { data, error } = await supabase.auth.mfa.challenge({ factorId: mfaData.id });
            if (error) throw error;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: mfaData.id,
                challengeId: data.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;

            setMfaEnrolled(true);
            setShowMfaEnroll(false);
            setMfaCode('');
            setMfaData(null);
            alert("¡2FA configurado correctamente!");
        } catch (err) {
            setMfaError("Código incorrecto o expirado");
        } finally {
            setIsVerifying(false);
        }
    };

    const handleGenerateClick = () => {
        if (!mfaEnrolled) {
            setShowMfaIntro(true);
            return;
        }
        setShowMfaVerify(true);
        setMfaCode('');
        setMfaError('');
    };

    const verifyAndGenerate = async () => {
        if (!mfaCode) return;
        setIsVerifying(true);
        setMfaError('');
        try {
            const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
            if (listError) throw listError;
            const factor = factors?.all?.find(f => f.status === 'verified');
            if (!factor) throw new Error("No se encontró un factor verificado.");

            const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
            if (challengeError) throw challengeError;

            const { error: verifyError } = await supabase.auth.mfa.verify({
                factorId: factor.id,
                challengeId: challengeData.id,
                code: mfaCode
            });

            if (verifyError) throw verifyError;

            setShowMfaVerify(false);
            setMfaCode('');
            await generateNewKey();
        } catch (err) {
            setMfaError("Código de seguridad inválido");
        } finally {
            setIsVerifying(false);
        }
    };

    const generateNewKey = async () => {
        setIsGenerating(true);
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const part = () => Array.from({ length: 4 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
        const newKey = `KAV-${part()}-${part()}-${part()}`;

        const { error } = await supabase
            .from('license_keys')
            .insert([{
                key: newKey,
                status: 'available',
                plan_type: genPlan
            }]);

        if (error) {
            alert("Error: " + error.message);
        } else {
            fetchKeys();
        }
        setIsGenerating(false);
    };

    const deleteKey = async (id) => {
        if (!window.confirm("¿Borrar clave?")) return;
        await supabase.from('license_keys').delete().eq('id', id);
        fetchKeys();
    };

    const handleShareLink = async (keyData) => {
        let token = keyData.activation_token;
        if (!token) {
            // Generate token if not exists (using UUID v4)
            const newToken = crypto.randomUUID();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // Valid for 7 days

            const { error } = await supabase
                .from('license_keys')
                .update({
                    activation_token: newToken,
                    activation_token_expires_at: expiresAt.toISOString()
                })
                .eq('id', keyData.id);

            if (error) {
                alert("Error generando link: " + error.message);
                return;
            }
            token = newToken;
            fetchKeys();
        }

        const activationUrl = `${window.location.origin}/activar/${token}`;
        handleCopy(keyData.id + '_link', activationUrl);
    };

    const handleCopy = async (id, text) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            // Fallback for non-secure contexts
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 2000);
            } catch (copyErr) {
                alert('No se pudo copiar la clave.');
            }
            document.body.removeChild(textArea);
        }
    };


    if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-app)', color: 'white' }}>Cargando...</div>;

    return (
        <div style={{ padding: isMobile ? '1rem' : '2rem', maxWidth: '1200px', margin: '0 auto', paddingBottom: '100px', minHeight: '100vh', background: 'var(--bg-app)' }}>
            {/* Header section */}
            <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: isMobile ? 'flex-start' : 'center',
                gap: isMobile ? '1rem' : '1.5rem',
                marginBottom: isMobile ? '2rem' : '3rem'
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#fff',
                    padding: isMobile ? '12px' : '16px',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)'
                }}>
                    <Shield size={isMobile ? 24 : 32} />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Developer Console</h1>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: isMobile ? '0.9rem' : '1.1rem' }}>Sistemas de Control & Analíticas Avanzadas</p>
                </div>
            </div>

            {/* Navigation Tabs - Horizontal Scroll on mobile */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '2rem',
                background: 'var(--bg-card)',
                padding: '6px',
                borderRadius: '16px',
                width: isMobile ? '100%' : 'fit-content',
                border: '1px solid var(--accent-light)',
                overflowX: 'auto',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none'
            }}>
                {[
                    { id: 'LICENSE', icon: Key, label: 'Licencias' },
                    { id: 'TOOLS', icon: Database, label: 'DevTools' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setViewMode(tab.id)}
                        style={{
                            padding: isMobile ? '8px 16px' : '10px 24px',
                            borderRadius: '12px',
                            background: viewMode === tab.id ? 'linear-gradient(135deg, #FA8E36 0%, #F97316 100%)' : 'transparent',
                            color: viewMode === tab.id ? '#fff' : 'var(--text-secondary)',
                            border: 'none',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: isMobile ? '0.85rem' : '1rem',
                            boxShadow: viewMode === tab.id ? '0 4px 12px rgba(249, 115, 22, 0.3)' : 'none'
                        }}
                    >
                        <tab.icon size={isMobile ? 16 : 18} /> {tab.label}
                    </button>
                ))}
            </div>


            {viewMode === 'LICENSE' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1.5rem' : '2.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(90deg, var(--bg-card) 0%, rgba(255,255,255,0.03) 100%)',
                        padding: isMobile ? '1.5rem' : '2.5rem',
                        borderRadius: '24px',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: isMobile ? 'stretch' : 'center',
                        gap: isMobile ? '1.5rem' : '2rem',
                        border: '1px solid var(--accent-light)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: 800 }}>Generar Licencia</h2>
                            {!isMobile && <p style={{ margin: '8px 0 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Formato Estándar: KAV-XXXX-XXXX-XXXX</p>}
                        </div>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: isMobile ? '1.25rem' : '2rem' }}>
                            <div style={{
                                display: 'flex',
                                background: 'var(--accent-light)',
                                padding: '4px',
                                borderRadius: '16px',
                                border: '1px solid var(--accent-light)',
                                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {[
                                    { id: 'free', label: 'FREE' },
                                    { id: 'monthly', label: '30 DÍAS' },
                                    { id: 'yearly', label: '1 AÑO' }
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setGenPlan(p.id)}
                                        style={{
                                            flex: 1,
                                            padding: isMobile ? '10px 12px' : '10px 20px',
                                            borderRadius: '12px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            background: genPlan === p.id ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                                            color: genPlan === p.id ? '#fff' : 'var(--text-primary)',
                                            opacity: genPlan === p.id ? 1 : 0.6,
                                            fontWeight: 800,
                                            transition: 'all 0.3s ease',
                                            fontSize: isMobile ? '0.75rem' : '0.85rem',
                                            boxShadow: genPlan === p.id ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none'
                                        }}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={handleGenerateClick}
                                disabled={isGenerating}
                                style={{
                                    padding: isMobile ? '14px' : '16px 32px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    gap: '12px',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >
                                <Plus size={22} strokeWidth={3} /> {isGenerating ? '...' : (isMobile ? 'Generar' : 'Generar Key')}
                            </button>
                        </div>
                    </div>

                    {!isMobile ? (
                        <div style={{ background: 'var(--bg-card)', borderRadius: '24px', border: '1px solid var(--accent-light)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Licencia</th>
                                        <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Estado</th>
                                        <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cliente</th>
                                        <th style={{ textAlign: 'left', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Vencimiento</th>
                                        <th style={{ textAlign: 'right', padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {generatedKeys.map(k => {
                                        const daysLeft = getDaysRemaining(k.organizations?.license_expires_at);
                                        const isExp = isExpired(k.organizations?.license_expires_at);
                                        const isSoon = isExpiringSoon(k.organizations?.license_expires_at);

                                        return (
                                            <tr key={k.id} style={{ borderTop: '1px solid var(--accent-light)', transition: 'background 0.2s' }}>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <code style={{ background: 'rgba(16, 185, 129, 0.12)', padding: '8px 16px', borderRadius: '10px', fontSize: '1.1rem', color: '#10b981', fontWeight: 800, letterSpacing: '2px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>{k.key}</code>
                                                        <button onClick={() => handleCopy(k.id, k.key)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${copiedId === k.id ? '#10b981' : 'var(--accent-light)'}`, background: copiedId === k.id ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-hover)', cursor: 'pointer', color: copiedId === k.id ? '#10b981' : 'var(--text-primary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            {copiedId === k.id ? <><Shield size={16} /><span style={{ fontSize: '0.75rem', fontWeight: 800 }}>¡OK!</span></> : <Copy size={16} />}
                                                        </button>
                                                        {k.status === 'available' && (
                                                            <button onClick={() => handleShareLink(k)} style={{ padding: '10px', borderRadius: '10px', border: `1px solid ${copiedId === k.id + '_link' ? '#10b981' : 'var(--accent-light)'}`, background: copiedId === k.id + '_link' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-card-hover)', cursor: 'pointer', color: copiedId === k.id + '_link' ? '#10b981' : 'var(--text-primary)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                {copiedId === k.id + '_link' ? <><CheckCircle2 size={16} /><span style={{ fontSize: '0.75rem', fontWeight: 800 }}>LINK!</span></> : <ExternalLink size={16} />}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <span style={{ fontSize: '0.8rem', padding: '4px 12px', borderRadius: '20px', background: k.status === 'available' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: k.status === 'available' ? '#10b981' : '#f87171', width: 'fit-content', fontWeight: 800, textTransform: 'uppercase' }}>
                                                            {k.status === 'available' ? 'Disponible' : 'En Uso'}
                                                        </span>
                                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: k.plan_type === 'yearly' ? '#3b82f6' : (k.plan_type === 'free' ? '#94a3b8' : '#f97316') }}></div>
                                                            {k.plan_type === 'yearly' ? 'ANUAL' : (k.plan_type === 'free' ? 'PRUEBA' : '30 DÍAS')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    {k.organizations?.name ? (
                                                        <span style={{ fontWeight: 600 }}>{k.organizations.name}</span>
                                                    ) : <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Libre</span>}
                                                </td>
                                                <td style={{ padding: '1.5rem' }}>
                                                    {k.organizations?.license_expires_at ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isExp ? '#f87171' : (isSoon ? '#fbbf24' : 'var(--text-primary)') }}>{formatDate(k.organizations.license_expires_at)}</span>
                                                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isExp ? '#f87171' : (isSoon ? '#fbbf24' : '#10b981') }}>{isExp ? 'EXPIRADA' : `${daysLeft}d restantes`}</span>
                                                        </div>
                                                    ) : '-'}
                                                </td>
                                                <td style={{ padding: '1.5rem', textAlign: 'right' }}>
                                                    <button onClick={() => deleteKey(k.id)} style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer', padding: '10px', borderRadius: '10px' }}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {generatedKeys.map(k => {
                                const daysLeft = getDaysRemaining(k.organizations?.license_expires_at);
                                const isExp = isExpired(k.organizations?.license_expires_at);
                                const isSoon = isExpiringSoon(k.organizations?.license_expires_at);

                                return (
                                    <div key={k.id} style={{ background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--accent-light)' }}>
                                        {/* License Key - Full Width */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <code style={{
                                                display: 'block',
                                                background: 'rgba(16, 185, 129, 0.12)',
                                                padding: '12px 16px',
                                                borderRadius: '12px',
                                                fontSize: '1rem',
                                                color: '#10b981',
                                                fontWeight: 800,
                                                letterSpacing: '1px',
                                                textAlign: 'center',
                                                wordBreak: 'break-all'
                                            }}>{k.key}</code>
                                        </div>

                                        {/* Action Buttons - Below Key */}
                                        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
                                            <button
                                                onClick={() => handleCopy(k.id, k.key)}
                                                style={{
                                                    flex: 1,
                                                    padding: '10px',
                                                    borderRadius: '10px',
                                                    border: '1px solid var(--accent-light)',
                                                    background: copiedId === k.id ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-card-hover)',
                                                    color: copiedId === k.id ? '#10b981' : 'var(--text-primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {copiedId === k.id ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                                {copiedId === k.id ? 'Copiado' : 'Copiar'}
                                            </button>
                                            <button
                                                onClick={() => deleteKey(k.id)}
                                                style={{
                                                    padding: '10px 16px',
                                                    borderRadius: '10px',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#f87171',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    fontWeight: 600,
                                                    fontSize: '0.85rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {/* Info Grid */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Estado</div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: k.status === 'available' ? '#10b981' : '#f87171' }}>{k.status === 'available' ? 'DISPONIBLE' : 'EN USO'}</span>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Plan</div>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{k.plan_type === 'yearly' ? 'ANUAL' : (k.plan_type === 'free' ? 'PRUEBA' : '30 DÍAS')}</span>
                                            </div>
                                            {k.organizations?.name && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Organización</div>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{k.organizations.name}</span>
                                                </div>
                                            )}
                                            {k.organizations?.license_expires_at && (
                                                <div style={{ gridColumn: 'span 2' }}>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Vencimiento</div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isExp ? '#f87171' : (isSoon ? '#fbbf24' : '#10b981') }}>
                                                        {formatDate(k.organizations.license_expires_at)} ({isExp ? 'EXPIRADA' : `${daysLeft}d restantes`})
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {viewMode === 'TOOLS' && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', padding: isMobile ? '10px' : '20px' }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        backdropFilter: 'blur(12px)',
                        padding: isMobile ? '1.5rem' : '2.5rem',
                        borderRadius: '24px',
                        border: '1px solid var(--accent-light)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        width: '100%',
                        maxWidth: '420px'
                    }}>
                        <h4 style={{ margin: 0, background: 'linear-gradient(135deg, #FA8E36 0%, #F97316 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', fontSize: '1.1rem', fontWeight: 800, textAlign: 'center', letterSpacing: '1px' }}>
                            DEVs TOOLS
                        </h4>

                        <button
                            onClick={generateFakeData}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                background: 'linear-gradient(135deg, #FA8E36 0%, #F97316 50%, #EA580C 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '18px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 800,
                                transition: 'all 0.2s',
                                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.35)'
                            }}
                        >
                            <RefreshCw size={20} />
                            Generar Data (1 Mes)
                        </button>

                        <button
                            onClick={clearAllData}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                padding: '18px',
                                borderRadius: '16px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                fontWeight: 800,
                                transition: 'all 0.2s'
                            }}
                        >
                            <Trash2 size={20} />
                            Resetear Todo
                        </button>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 0, fontWeight: 500, padding: '0 1rem' }}>
                            * Genera ventas, inventario, tipos de cerveza y costos de adquisición configurados.
                        </p>
                    </div>
                </div>
            )}

            {/* Modal de Enrolamiento 2FA */}
            {showMfaEnroll && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: isMobile ? '10px' : '20px' }}>
                    <div style={{ background: '#1a1a1a', borderRadius: '32px', border: '1px solid #333', width: '100%', maxWidth: '450px', padding: isMobile ? '1.5rem' : '2.5rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflowX: 'hidden', maxHeight: '95vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowMfaEnroll(false)} style={{ position: 'absolute', top: isMobile ? '15px' : '24px', right: isMobile ? '15px' : '24px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1.5rem' }}>
                                <Lock size={isMobile ? 24 : 32} />
                            </div>
                            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>Seguridad Requerida</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.6' }}>Vincula tu app de <b>Google Authenticator</b> usando el código debajo:</p>

                            <div style={{ marginBottom: isMobile ? '1.5rem' : '2.5rem', background: 'rgba(255,255,255,0.03)', padding: isMobile ? '1rem' : '1.5rem', borderRadius: '16px', border: '1px solid #333' }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 800, marginBottom: '12px' }}>Código de Configuración (Secret):</p>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                                    <code style={{
                                        background: 'rgba(16, 185, 129, 0.15)',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        color: '#10b981',
                                        fontSize: isMobile ? '0.9rem' : '1.1rem',
                                        fontWeight: 800,
                                        letterSpacing: '1px',
                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                        width: '100%',
                                        wordBreak: 'break-all',
                                        lineHeight: '1.4'
                                    }}>
                                        {mfaData?.totp?.secret || '--------'}
                                    </code>
                                    <button
                                        onClick={() => handleCopy('mfa-secret', mfaData?.totp?.secret)}
                                        style={{
                                            background: 'rgba(16, 185, 129, 0.15)',
                                            border: '1px solid #10b981',
                                            color: '#10b981',
                                            padding: '10px 20px',
                                            borderRadius: '12px',
                                            cursor: 'pointer',
                                            fontWeight: 800,
                                            fontSize: '0.75rem',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        {copiedId === 'mfa-secret' ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                                        {copiedId === 'mfa-secret' ? '¡COPIADO!' : 'COPIAR CÓDIGO'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Código de Verificación</label>
                                <input
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '14px', padding: isMobile ? '12px' : '16px', color: 'white', fontSize: isMobile ? '1.25rem' : '1.5rem', textAlign: 'center', letterSpacing: isMobile ? '4px' : '8px', fontWeight: 'bold' }}
                                />
                                {mfaError && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '8px', textAlign: 'center', fontWeight: 'bold' }}>{mfaError}</p>}
                            </div>

                            <button
                                onClick={confirmEnrollment}
                                disabled={mfaCode.length !== 6 || isVerifying}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 900,
                                    cursor: mfaCode.length === 6 ? 'pointer' : 'not-allowed',
                                    opacity: mfaCode.length === 6 ? 1 : 0.5,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}
                            >
                                {isVerifying ? 'Verificando...' : 'Confirmar Configuración'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Verificación 2FA para Generar */}
            {showMfaVerify && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: isMobile ? '10px' : '20px' }}>
                    <div style={{ background: '#1a1a1a', borderRadius: '32px', border: '1px solid #333', width: '100%', maxWidth: '400px', padding: isMobile ? '1.5rem' : '2.5rem', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <button onClick={() => setShowMfaVerify(false)} style={{ position: 'absolute', top: isMobile ? '15px' : '20px', right: isMobile ? '15px' : '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}><X size={24} /></button>

                        <div style={{ textAlign: 'center' }}>
                            <div style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1.25rem' }}>
                                <Shield size={isMobile ? 24 : 32} />
                            </div>
                            <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, marginBottom: '0.75rem', color: 'white' }}>Seguridad</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Ingresa el código de <b>Google Authenticator</b>.</p>

                            <div style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="000000"
                                    maxLength={6}
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid #333', borderRadius: '18px', padding: isMobile ? '14px' : '20px', color: 'white', fontSize: isMobile ? '1.5rem' : '2rem', textAlign: 'center', letterSpacing: isMobile ? '4px' : '8px', fontWeight: 'bold' }}
                                />
                                {mfaError && <p style={{ color: '#f87171', fontSize: '0.85rem', marginTop: '12px', textAlign: 'center', fontWeight: 'bold' }}>{mfaError}</p>}
                            </div>

                            <button
                                onClick={verifyAndGenerate}
                                disabled={mfaCode.length !== 6 || isVerifying}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '16px' : '20px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 900,
                                    cursor: mfaCode.length === 6 ? 'pointer' : 'not-allowed',
                                    opacity: mfaCode.length === 6 ? 1 : 0.5,
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)'
                                }}
                            >
                                {isVerifying ? 'Verificando...' : 'Autorizar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Introducción 2FA (Estético) */}
            {showMfaIntro && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000, padding: isMobile ? '10px' : '20px' }}>
                    <div style={{ background: '#1a1a1a', borderRadius: '32px', border: '1px solid #333', width: '100%', maxWidth: '420px', padding: isMobile ? '1.5rem' : '2.5rem', textAlign: 'center', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
                        <div style={{ width: isMobile ? '48px' : '64px', height: isMobile ? '48px' : '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', margin: '0 auto 1.25rem' }}>
                            <Shield size={isMobile ? 24 : 32} />
                        </div>
                        <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.75rem', fontWeight: 800, marginBottom: '1rem', color: 'white' }}>Nivel de Seguridad II</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
                            Vincula tu cuenta con <b>Google Authenticator</b> para proteger la generación de claves.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowMfaIntro(false);
                                    startEnrollment();
                                }}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '16px' : '18px',
                                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '16px',
                                    fontWeight: 900,
                                    cursor: 'pointer',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    boxShadow: '0 10px 25px rgba(5, 150, 105, 0.4)'
                                }}
                            >
                                Configurar Ahora
                            </button>
                            <button
                                onClick={() => setShowMfaIntro(false)}
                                style={{
                                    width: '100%',
                                    padding: isMobile ? '16px' : '18px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    border: '1px solid #333',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                }}
                            >
                                Tal vez después
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
