import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import { Copy, Plus, UserCheck, UserX, Shield, RefreshCw, Key, Users, CheckCircle, XCircle, Clock, Share2 } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext'; // Assuming context exists
import CustomConfirmationModal from '../../components/CustomConfirmationModal';

const UsersSection = () => {
    const { user, organizationId, role, organizationName, loading, refreshProfile } = useAuth();
    const { showNotification } = useNotification();
    const [showDebug, setShowDebug] = useState(false);

    // Debug logging
    console.log('🎯 [UsersSection] Render - role:', role, 'organizationId:', organizationId, 'loading:', loading);

    // UI State
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'requests'

    // Data State
    const [orgCode, setOrgCode] = useState('------');
    const [employees, setEmployees] = useState([]);
    const [requests, setRequests] = useState([]);
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [joinStatus, setJoinStatus] = useState(null); // 'idle' | 'pending' | 'rejected'

    // 1. Loading Guard: Wait for AuthContext to resolve
    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                <div className="animate-pulse">Cargando datos de organización...</div>
            </div>
        );
    }

    // Mock Data for UI Dev
    // Real Data Fetching
    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            if (!organizationId) {
                // If user is not yet in an Org, check if they have a pending request
                if (user?.id) {
                    const { data: myReq } = await supabase
                        .from('organization_join_requests')
                        .select('status')
                        .eq('user_id', user.id)
                        .eq('status', 'pending')
                        .maybeSingle();

                    if (mounted && myReq) {
                        setJoinStatus('pending');
                    }
                }
                return;
            }

            try {
                // 1. Fetch Org Code
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('code')
                    .eq('id', organizationId)
                    .single();

                if (mounted && orgData) setOrgCode(orgData.code);

                // 2. Fetch Employees (RLS disabled on profiles table)
                const { data: empData, error: empError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('organization_id', organizationId);

                if (empError) {
                    console.error('Error fetching employees:', empError);
                }

                if (mounted && empData) {
                    setEmployees(empData.map(e => ({
                        ...e,
                        status: 'active'
                    })));
                }

                // 3. Fetch Pending Requests (NO JOIN - fetch separately)
                console.log('🔔 [UsersSection] Fetching requests for org:', organizationId);

                const { data: reqData, error: reqError } = await supabase
                    .from('organization_join_requests')
                    .select('id, created_at, user_id, status')
                    .eq('organization_id', organizationId)
                    .eq('status', 'pending');

                if (reqError) {
                    console.error("❌ [UsersSection] Error fetching requests:", reqError);
                } else {
                    console.log('📬 [UsersSection] Requests data received:', reqData);
                    console.log('📊 [UsersSection] Number of requests:', reqData?.length || 0);
                }

                // 4. If we have requests, fetch the user profiles for each
                if (mounted && reqData && reqData.length > 0) {
                    const userIds = reqData.map(r => r.user_id);
                    console.log('👥 [UsersSection] Fetching profiles for user IDs:', userIds);

                    const { data: profilesData, error: profilesError } = await supabase
                        .from('profiles')
                        .select('id, email, full_name')
                        .in('id', userIds);

                    if (profilesError) {
                        console.error("❌ [UsersSection] Error fetching profiles:", profilesError);
                    } else {
                        console.log('📋 [UsersSection] Profiles data received:', profilesData);
                    }

                    // Map requests with profile data
                    const mappedRequests = reqData.map(r => {
                        const profile = profilesData?.find(p => p.id === r.user_id);
                        return {
                            id: r.id,
                            user_id: r.user_id,
                            full_name: profile?.full_name || 'Desconocido',
                            email: profile?.email || 'Desconocido',
                            created_at: r.created_at
                        };
                    });

                    console.log('✅ [UsersSection] Setting requests state:', mappedRequests);
                    setRequests(mappedRequests);
                } else if (mounted && reqData) {
                    console.log('ℹ️ [UsersSection] No pending requests');
                    setRequests([]);
                }

            } catch (err) {
                console.error("Error fetching user section data:", err);
            }
        };

        fetchData();

        // 4. Realtime Subscription
        const channel = supabase
            .channel(`public:organization_join_requests:${organizationId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'organization_join_requests',
                filter: `organization_id=eq.${organizationId}`
            }, async (payload) => {
                console.log('Realtime Request Update:', payload);

                if (payload.eventType === 'INSERT') {
                    // New request: Fetch full user details to show name/email
                    const { data: fullReq, error: fullError } = await supabase
                        .from('organization_join_requests')
                        .select(`
                            id, created_at, user_id, status,
                            profiles:user_id ( email, full_name )
                        `)
                        .eq('id', payload.new.id)
                        .single();

                    if (fullError) console.error("Error fetching live request details:", fullError);

                    if (fullReq) {
                        setRequests(prev => {
                            // Avoid duplicates
                            if (prev.find(r => r.id === fullReq.id)) return prev;
                            const formatted = {
                                id: fullReq.id,
                                user_id: fullReq.user_id,
                                full_name: fullReq.profiles?.full_name || 'Desconocido',
                                email: fullReq.profiles?.email || 'Desconocido',
                                created_at: fullReq.created_at
                            };
                            return [...prev, formatted];
                        });
                        showNotification('¡Nueva solicitud de acceso!', 'success');
                    }
                } else if (payload.eventType === 'UPDATE' || payload.eventType === 'DELETE') {
                    // If status changed to approved/rejected, remove from list
                    // Or if row deleted
                    const shouldRemove = payload.eventType === 'DELETE' || (payload.new && payload.new.status !== 'pending');

                    if (shouldRemove) {
                        setRequests(prev => prev.filter(r => r.id !== (payload.old?.id || payload.new?.id)));
                    }
                }
            })
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [organizationId, user]);

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(orgCode);
            showNotification('¡Código copiado al portapapeles!', 'success');
        } catch (err) {
            showNotification('Error al intentar copiar', 'error');
        }
    };

    const handleShare = async () => {
        const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Hola';
        const shareData = {
            title: 'Únete a mi equipo en Kavas',
            text: `👋 Hola, soy ${firstName}. Únete a mi equipo usando mi código de organización: *${orgCode}*`,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback for Desktop / Browsers without share API
                const message = encodeURIComponent(`👋 Hola, soy ${firstName}. Quiero que te unas a mi equipo en Kavas usando mi código de organización: *${orgCode}* 🚀📲`);
                window.open(`https://wa.me/?text=${message}`, '_blank');
            }
        } catch (err) {
            console.error('Error sharing', err);
        }
    };

    const handleJoinRequest = async (e) => {
        e.preventDefault();
        setActionLoading(true);

        const codeToJoin = joinCodeInput.trim().toUpperCase();

        try {
            // 1. Validate Code (Using Secure RPC to bypass RLS)
            const { data: org, error: orgError } = await supabase
                .rpc('get_org_by_code', { code_input: codeToJoin })
                .maybeSingle();

            if (orgError || !org) {
                console.warn('Org lookup failed:', orgError);
                alert('Código de organización no válido o no encontrado.');
                setActionLoading(false);
                return;
            }

            // 2. Create Request
            const { error: reqError } = await supabase
                .from('organization_join_requests')
                .insert([{
                    user_id: user.id,
                    organization_id: org.id,
                    org_code: codeToJoin,
                    status: 'pending'
                }]);

            if (reqError) {
                if (reqError.code === '23505') { // Unique violation
                    alert('Ya tienes una solicitud pendiente para esta organización.');
                    setJoinStatus('pending'); // Assume pending
                } else {
                    console.error('Request Error:', reqError);
                    alert('Error al enviar solicitud. Intenta nuevamente.');
                }
            } else {
                setJoinStatus('pending');
                alert(`Solicitud enviada a ${org.name}.`);
            }

        } catch (err) {
            console.error('Join Error:', err);
            alert('Error de conexión.');
        } finally {
            setActionLoading(false);
        }
    };

    // --- CONFIRMATION MODAL STATE ---
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        type: 'info', // info | success | danger | warning
        title: '',
        message: '',
        action: null // function to execute
    });

    const closeConfirmation = () => setConfirmation(prev => ({ ...prev, isOpen: false }));

    const handleApproveClick = (reqId) => {
        const req = requests.find(r => r.id === reqId);
        setConfirmation({
            isOpen: true,
            type: 'success',
            title: '¿Aprobar Acceso?',
            message: `¿Estás seguro de aceptar a ${req?.full_name || 'este usuario'} en tu organización?`,
            confirmText: 'Sí, Aprobar',
            action: () => executeApprove(reqId)
        });
    };

    const handleRejectClick = (reqId) => {
        const req = requests.find(r => r.id === reqId);
        setConfirmation({
            isOpen: true,
            type: 'danger',
            title: '¿Rechazar Solicitud?',
            message: `¿Estás seguro de rechazar a ${req?.full_name || 'este usuario'}? Esta acción no se puede deshacer.`,
            confirmText: 'Sí, Rechazar',
            action: () => executeReject(reqId)
        });
    };

    const executeApprove = async (reqId) => {
        closeConfirmation();
        try {
            const req = requests.find(r => r.id === reqId);
            if (!req) return;

            // 1. Update Request Status
            const { error: reqError } = await supabase
                .from('organization_join_requests')
                .update({ status: 'approved' })
                .eq('id', reqId);

            if (reqError) throw reqError;

            // 2. Update Profile (Link to Org & Role)
            const { error: profError } = await supabase
                .from('profiles')
                .update({
                    organization_id: organizationId,
                    role: 'EMPLOYEE'
                })
                .eq('id', req.user_id);

            if (profError) throw profError;

            // 3. UI Updates
            showNotification('Usuario aprobado con éxito.', 'success');
            setRequests(prev => prev.filter(r => r.id !== reqId));

            // Optimistically add
            setEmployees(prev => [...prev, {
                id: req.user_id,
                full_name: req.full_name,
                email: req.email,
                role: 'EMPLOYEE',
                status: 'active'
            }]);

        } catch (err) {
            console.error(err);
            showNotification('Error al aprobar usuario.', 'error');
        }
    };

    const executeReject = async (reqId) => {
        closeConfirmation();
        try {
            const { error } = await supabase
                .from('organization_join_requests')
                .update({ status: 'rejected' })
                .eq('id', reqId);

            if (error) throw error;

            showNotification('Solicitud rechazada.', 'info');
            setRequests(prev => prev.filter(r => r.id !== reqId));
        } catch (err) {
            console.error(err);
            showNotification('Error al rechazar usuario.', 'error');
        }
    };

    // --- RENDER: UNASSIGNED USER (JOIN FLOW) ---
    if (!organizationId) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                    background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '24px',
                    boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)'
                }}>
                    <div style={{
                        width: '64px', height: '64px', background: 'rgba(99, 102, 241, 0.1)',
                        borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 1.5rem auto'
                    }}>
                        <Shield size={32} color="#6366f1" />
                    </div>

                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                        Únete a una Organización
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Pide el <strong>Código de Acceso</strong> al dueño o administrador para unirte a su equipo.
                    </p>

                    {joinStatus === 'pending' ? (
                        <div style={{
                            padding: '1.5rem', background: 'rgba(234, 179, 8, 0.1)', borderRadius: '16px',
                            border: '1px solid rgba(234, 179, 8, 0.3)', color: '#ca8a04'
                        }}>
                            <Clock size={40} style={{ marginBottom: '1rem' }} />
                            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Solicitud Enviada</h3>
                            <p style={{ fontSize: '0.9rem' }}>Esperando aprobación del administrador.</p>
                            <button
                                onClick={() => setJoinStatus('idle')}
                                style={{
                                    marginTop: '1rem', background: 'none', border: 'none',
                                    color: '#ca8a04', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.85rem'
                                }}>
                                Cancelar solicitud
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleJoinRequest}>
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <Key size={20} color="var(--text-secondary)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="text"
                                    placeholder="Código de 6 caracteres (Ej: A1B2C3)"
                                    value={joinCodeInput}
                                    onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                                    maxLength={6}
                                    className="ticket-input-large"
                                    style={{
                                        width: '100%', paddingLeft: '48px', textAlign: 'center', letterSpacing: '2px',
                                        fontWeight: 700, fontSize: '1.1rem', textTransform: 'uppercase'
                                    }}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!joinCodeInput.trim() || actionLoading}
                                className="btn-primary-gradient"
                                style={{ width: '100%', padding: '1rem', borderRadius: '16px', fontSize: '1rem' }}
                            >
                                {actionLoading ? 'Enviando...' : 'Solicitar Acceso'}
                            </button>

                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                                    ¿Deberías ser el dueño? Intenta refrescar tu perfil.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        refreshProfile?.();
                                        showNotification('Refrescando datos...', 'info');
                                    }}
                                    className="option-btn"
                                    style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                                >
                                    <RefreshCw size={18} /> Refrescar Perfil
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    // --- RENDER: MASTER / ADMIN (MANAGEMENT FLOW) ---
    return (
        <div className="animate-fade-in" style={{ paddingBottom: '4rem' }}>

            {/* 1. ORGANIZATION CODE CARD - Only for OWNER, MANAGER, DEVELOPER */}
            {role && ['OWNER', 'MANAGER', 'DEVELOPER'].includes(role) && (
                <div style={{
                    background: 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
                    borderRadius: '24px', padding: '2rem', color: 'white', marginBottom: '2rem',
                    boxShadow: '0 10px 25px -5px rgba(249, 115, 22, 0.4)', position: 'relative',
                    overflow: 'hidden', fontFamily: "'Poppins', sans-serif"
                }}>
                    <div style={{ position: 'relative', zIndex: 2 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h2 style={{ fontSize: '1.2rem', opacity: 0.95, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Shield size={20} /> Código de Organización
                                </h2>
                                <p style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '8px', maxWidth: '350px', lineHeight: '1.5' }}>
                                    Comparte este código único con tu equipo para que se unan a <strong>{organizationName || 'tu negocio'}</strong>.
                                </p>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '1.5rem', background: 'rgba(255,255,255,0.2)',
                            backdropFilter: 'blur(10px)', borderRadius: '16px', padding: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            <div style={{
                                fontFamily: "'Poppins', monospace", fontSize: '2.5rem', fontWeight: 800, letterSpacing: '4px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                {orgCode}
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={handleCopyCode}
                                    title="Copiar código"
                                    style={{
                                        background: 'white', color: '#f97316', border: 'none',
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)', transition: 'transform 0.2s'
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Copy size={24} />
                                </button>

                                <button
                                    onClick={handleShare}
                                    title="Compartir"
                                    style={{
                                        background: '#ffffffff', color: '#F97B20', border: 'none',
                                        width: '48px', height: '48px', borderRadius: '14px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)', transition: 'transform 0.2s'
                                    }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <Share2 size={24} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. TABS */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('active')}
                    style={{
                        flex: 1, padding: '1rem', borderRadius: '16px',
                        background: activeTab === 'active' ? 'var(--bg-card)' : 'transparent',
                        border: activeTab === 'active' ? '1px solid var(--accent-light)' : 'none',
                        color: activeTab === 'active' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s'
                    }}>
                    <Users size={18} />
                    Equipo Activo ({employees.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    style={{
                        flex: 1, padding: '1rem', borderRadius: '16px',
                        background: activeTab === 'requests' ? 'var(--bg-card)' : 'transparent',
                        border: activeTab === 'requests' ? '1px solid var(--accent-light)' : 'none',
                        color: activeTab === 'requests' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        position: 'relative', transition: 'all 0.2s'
                    }}>
                    <UserCheck size={18} />
                    Solicitudes
                    {requests.length > 0 && (
                        <span style={{
                            background: '#ef4444', color: 'white', fontSize: '0.75rem',
                            padding: '2px 8px', borderRadius: '10px', marginLeft: '4px'
                        }}>
                            {requests.length}
                        </span>
                    )}
                </button>
            </div >

            {/* 3. LISTS */}
            < div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                {activeTab === 'requests' && (
                    <>
                        {requests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                <UserCheck size={48} style={{ marginBottom: '1rem' }} />
                                <p>No hay solicitudes pendientes</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <div key={req.id} className="animate-slide-up" style={{
                                    background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px',
                                    border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '40px', height: '40px', borderRadius: '50%', background: '#fb923c', color: 'white',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                        }}>
                                            {req.full_name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{req.full_name || 'Sin Nombre'}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{req.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleRejectClick(req.id)}
                                            style={{
                                                background: '#fee2e2', color: '#dc2626', border: 'none',
                                                width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            <XCircle size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleApproveClick(req.id)}
                                            style={{
                                                background: '#dcfce7', color: '#16a34a', border: 'none',
                                                width: '40px', height: '40px', borderRadius: '12px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            <CheckCircle size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </>
                )}

                {
                    activeTab === 'active' && (
                        <>
                            {employees.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                    <Users size={48} style={{ marginBottom: '1rem' }} />
                                    <p>Aún no tienes empleados.</p>
                                </div>
                            ) : (
                                employees.map(emp => (
                                    <div key={emp.id} style={{
                                        background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '16px',
                                        border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div style={{
                                                width: '40px', height: '40px', borderRadius: '50%', background: '#e5e7eb', color: '#374151',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700
                                            }}>
                                                {emp.full_name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '1rem' }}>{emp.full_name || 'Sin Nombre'}</div>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                    {emp.role} • <span style={{ color: '#16a34a' }}>Activo</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                            <Shield size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </>
                    )
                }

            </div >

            {/* Generic Confirmation Modal */}
            <CustomConfirmationModal
                isOpen={confirmation.isOpen}
                title={confirmation.title}
                message={confirmation.message}
                confirmText={confirmation.confirmText}
                type={confirmation.type}
                onConfirm={confirmation.action}
                onCancel={closeConfirmation}
            />
        </div >
    );
};

export default UsersSection;
