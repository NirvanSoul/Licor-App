import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Store, Eye, EyeOff, PartyPopper } from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [liquorStoreName, setLiquorStoreName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // 1. Validación estricta antes de enviar nada
        if (isOwner && !liquorStoreName.trim()) {
            setError('El nombre de la licorería es obligatorio para dueños.');
            setLoading(false);
            return;
        }

        try {
            // 2. Preparamos la metadata con cuidado
            const metadata = {
                full_name: fullName,
                // IMPORTANTE: Si es dueño, mandamos el nombre. Si no, no mandamos la clave o mandamos null.
                liquor_store_name: isOwner ? liquorStoreName : null,
            };

            console.log('Enviando registro a Supabase:', metadata);

            // 3. Enviamos a Supabase
            const { data, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: metadata, // Aquí viaja la información para el Trigger SQL
                },
            });

            if (authError) throw authError;

            // 4. Éxito
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
            height: '100vh', background: '#f5f5f7', padding: '1rem'
        }}>
            <div style={{
                background: 'white', padding: '2rem', borderRadius: '24px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        background: '#000', width: '48px', height: '48px',
                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem auto'
                    }}>
                        <UserPlus color="white" size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Crear Cuenta</h2>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>Únete a la plataforma</p>
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
                            style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}
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
                            style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}
                        />
                    </div>
                    <div className="input-group-large" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: '12px', top: '50%',
                                transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    {/* Checkbox de Dueño */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '1rem', background: '#f9fafb', borderRadius: '16px',
                        border: isOwner ? '1px solid #000' : '1px solid #e5e7eb',
                        cursor: 'pointer'
                    }} onClick={() => setIsOwner(!isOwner)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '36px', height: '36px', borderRadius: '50%',
                                background: isOwner ? '#000' : '#e5e7eb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Store size={18} color={isOwner ? 'white' : '#6b7280'} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Soy Dueño de Negocio</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>Crear nueva licorería</span>
                            </div>
                        </div>
                        <div style={{
                            width: '20px', height: '20px', borderRadius: '50%',
                            border: isOwner ? '6px solid #000' : '2px solid #ccc',
                            background: 'white'
                        }}></div>
                    </div>

                    {isOwner && (
                        <div className="input-group-large" style={{ animation: 'fadeIn 0.3s' }}>
                            <input
                                type="text"
                                placeholder="Nombre de tu Licorería"
                                value={liquorStoreName}
                                onChange={(e) => setLiquorStoreName(e.target.value)}
                                required={isOwner}
                                className="ticket-input-large"
                                style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #000', padding: '12px', borderRadius: '12px' }}
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#000', color: 'white', padding: '1rem',
                            borderRadius: '16px', border: 'none', fontSize: '1rem',
                            fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>
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
                        background: 'white', borderRadius: '32px', padding: '2rem',
                        width: '100%', maxWidth: '360px', textAlign: 'center',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                        <div style={{
                            background: '#FFF3E0', width: '80px', height: '80px',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 1.5rem auto'
                        }}>
                            <PartyPopper size={40} color="#E65100" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>¡Bienvenido!</h3>
                        <p style={{ color: '#666', marginBottom: '2rem' }}>Tu licorería ha sido registrada.</p>
                        <button
                            onClick={() => navigate('/login')}
                            style={{
                                background: '#000', color: 'white', width: '100%', padding: '16px',
                                borderRadius: '20px', border: 'none', fontWeight: 700, cursor: 'pointer'
                            }}
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}