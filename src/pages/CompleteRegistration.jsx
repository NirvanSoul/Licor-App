import React, { useState, useEffect } from 'react';
// import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { UserCheck, Lock, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function CompleteRegistration() {
    const navigate = useNavigate();
    const { user, signOut } = useAuth(); // User should be logged in via Magic Link
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // If no user is found after a short delay (auth state loading), we might want to redirect to login.
        // For now, we assume useAuth handles the initial load.
        // If user is already fully set up (has password?), technically they could reuse this page to reset, but let's assume it's for new invites.

        // Try to pre-fill name if available (unlikely for magic link invite)
    }, [user]);

    const handleComplete = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // MOCK COMPLETE
        setTimeout(() => {
            alert('¡Cuenta configurada con éxito!');
            navigate('/');
        }, 1000);

        /*
        try {
            if (!user) throw new Error("No hay sesión activa. Por favor usa el enlace de tu correo nuevamente.");

            // 1. Update Password
            const { error: passError } = await supabase.auth.updateUser({
                password: password
            });
            if (passError) throw passError;

            // 2. Update Profile Name
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name: fullName })
                .eq('id', user.id);

            if (profileError) {
                console.warn("Error actualizando nombre:", profileError);
                // Non-blocking error, but good to know
            }

            // 3. Delete the invite (Consume it) - Optional cleanup
            // We can delete by email
            await supabase
                .from('organization_invites')
                .delete()
                .eq('email', user.email);

            alert('¡Cuenta configurada con éxito!');
            navigate('/'); // Go to dashboard

        } catch (err) {
            console.error(err);
            setError(err.message || "Error al completar registro.");
        } finally {
            setLoading(false);
        }
        */
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            height: '100vh', background: '#f5f5f7', padding: '1rem'
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '24px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: '#34c759', width: '48px', height: '48px',
                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem auto'
                    }}>
                        <UserCheck color="white" size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Completar Registro</h2>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>Configura tu cuenta para continuar</p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEE2E2', color: '#991B1B', padding: '0.75rem',
                        borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleComplete} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div className="input-group-large">
                        <div style={{ color: '#888', marginBottom: '4px', fontSize: '0.8rem', marginLeft: '4px' }}>Nombre Completo</div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '12px', padding: '0 12px', background: 'white' }}>
                            <User size={20} color="#999" />
                            <input
                                type="text"
                                placeholder="Ej: Juan Pérez"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required
                                style={{
                                    border: 'none', outline: 'none', padding: '12px', width: '100%', fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <div className="input-group-large">
                        <div style={{ color: '#888', marginBottom: '4px', fontSize: '0.8rem', marginLeft: '4px' }}>Nueva Contraseña</div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '12px', padding: '0 12px', background: 'white' }}>
                            <Lock size={20} color="#999" />
                            <input
                                type="password"
                                placeholder="********"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                style={{
                                    border: 'none', outline: 'none', padding: '12px', width: '100%', fontSize: '1rem'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#000', color: 'white', padding: '1rem',
                            borderRadius: '16px', border: 'none', fontSize: '1rem',
                            fontWeight: 600, cursor: 'pointer', marginTop: '1rem',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Guardando...' : 'Finalizar Registro'}
                    </button>
                </form>

                {!user && (
                    <div style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.8rem', color: '#666' }}>
                        Esperando autenticación... (Si no carga, vuelve a hacer clic en el correo)
                    </div>
                )}
            </div>
        </div>
    );
}
