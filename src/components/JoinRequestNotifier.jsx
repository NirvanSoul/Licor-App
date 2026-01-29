import React, { useState, useEffect } from 'react';
import { Bell, Check, X, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function JoinRequestNotifier() {
    const { user, role, organizationId } = useAuth(); // Ensure these are available from AuthContext
    const { showNotification } = useNotification();
    const [requests, setRequests] = useState([]);
    const [showPopup, setShowPopup] = useState(false);

    // Only show for Owners/Managers
    const canApprove = role === 'OWNER' || role === 'MANAGER';

    const fetchRequests = async () => {
        if (!organizationId) return;

        const { data, error } = await supabase
            .from('organization_join_requests')
            .select(`
                id,
                created_at,
                user:user_id ( id, email, raw_user_meta_data )
            `)
            .eq('organization_id', organizationId)
            .eq('status', 'pending');

        if (error) {
            console.error('Error fetching requests:', error);
        } else {
            setRequests(data || []);
        }
    };

    useEffect(() => {
        if (!user || !canApprove || !organizationId) return;

        // Initial Fetch
        fetchRequests();

        // Realtime Subscription
        const channel = supabase
            .channel('join_requests_watch')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT (new request) or UPDATE (status change)
                    schema: 'public',
                    table: 'organization_join_requests',
                    filter: `organization_id=eq.${organizationId}`
                },
                (payload) => {
                    console.log('Join Request Change:', payload);
                    fetchRequests(); // Refresh on any change
                    if (payload.eventType === 'INSERT') {
                        showNotification('Nueva solicitud de acceso recibida', 'info');
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, canApprove, organizationId]);

    const handleAction = async (requestId, userId, action) => {
        // action: 'approved' | 'rejected'
        try {
            // 1. Update Request Status
            const { error: reqError } = await supabase
                .from('organization_join_requests')
                .update({ status: action })
                .eq('id', requestId);

            if (reqError) throw reqError;

            // 2. If Approved, Update Profile Role & Org
            if (action === 'approved') {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .update({
                        organization_id: organizationId,
                        role: 'EMPLOYEE'
                    })
                    .eq('id', userId);

                if (profileError) throw profileError;
                showNotification('Empleado aprobado y añadido al equipo', 'success');
            } else {
                showNotification('Solicitud rechazada', 'info');
            }

            // Refresh list (optimistic update could be faster, but this is safer)
            fetchRequests();

            // Close popup if empty
            if (requests.length <= 1) setShowPopup(false);

        } catch (err) {
            console.error('Error handling request:', err);
            showNotification('Error al procesar solicitud', 'error');
        }
    };

    if (!user || !canApprove || requests.length === 0) return null;

    return (
        <>
            {/* FLOATING BELL BUTTON */}
            <button
                onClick={() => setShowPopup(!showPopup)}
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    left: '24px', // Left side to avoid conflict with Chat/Support buttons often on right
                    zIndex: 9999,
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: 'var(--accent-color)', // Orange
                    color: 'white',
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1.0)'}
            >
                <div style={{ position: 'relative' }}>
                    <Bell size={24} fill="currentColor" />
                    {/* Badge */}
                    <span style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        background: '#EF4444', // Red
                        color: 'white',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '2px solid var(--bg-app)'
                    }}>
                        {requests.length}
                    </span>
                </div>
            </button>

            {/* POPUP LIST */}
            {showPopup && (
                <div style={{
                    position: 'fixed',
                    bottom: '90px',
                    left: '24px',
                    width: '320px',
                    background: 'var(--bg-card)',
                    borderRadius: '24px',
                    boxShadow: 'var(--shadow-xl)',
                    border: '1px solid var(--accent-light)',
                    padding: '1.5rem',
                    zIndex: 9999,
                    animation: 'slideUp 0.3s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                            Solicitudes ({requests.length})
                        </h3>
                        <button
                            onClick={() => setShowPopup(false)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '300px', overflowY: 'auto' }}>
                        {requests.map((req) => (
                            <div key={req.id} style={{
                                background: 'var(--bg-app)',
                                borderRadius: '16px',
                                padding: '1rem',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        background: 'rgba(99, 102, 241, 0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <User size={20} color="#6366f1" />
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {req.user?.raw_user_meta_data?.full_name || 'Usuario'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {req.user?.email}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleAction(req.id, req.user?.id, 'rejected')}
                                        style={{
                                            padding: '0.5rem', borderRadius: '12px', border: '1px solid #FECACA',
                                            background: '#FEF2F2', color: '#EF4444', fontWeight: 600, cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, req.user?.id, 'approved')}
                                        style={{
                                            padding: '0.5rem', borderRadius: '12px', border: 'none',
                                            background: '#ECFDF5', color: '#10B981', fontWeight: 600, cursor: 'pointer',
                                            fontSize: '0.85rem'
                                        }}
                                    >
                                        Aceptar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

// Simple animation styles could be added to index.css if not present
// @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
