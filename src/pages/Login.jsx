import React, { useState } from 'react';
// import { supabase } from '../supabaseClient';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Mock Login for local mode
        setTimeout(() => {
            navigate('/vender');
        }, 1000);

        /*
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Context will pick up the change
            navigate('/vender'); // Default redirect
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
                        background: '#000', width: '48px', height: '48px',
                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 1rem auto'
                    }}>
                        <LogIn color="white" size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>Iniciar Sesión</h2>
                    <p style={{ color: '#666', marginTop: '0.5rem' }}>Bienvenido de nuevo</p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEE2E2', color: '#991B1B', padding: '0.75rem',
                        borderRadius: '12px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    <div className="input-group-large" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="ticket-input-large"
                            style={{ width: '100%', boxSizing: 'border-box', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#999',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            background: '#000', color: 'white',
                            padding: '1rem', borderRadius: '16px', border: 'none',
                            fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
                            marginTop: '1rem', opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Entrando...' : 'Ingresar'}
                    </button>
                </form>

                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: '#666' }}>
                    ¿No tienes cuenta?{' '}
                    <Link to="/register" style={{ color: '#000', fontWeight: 600, textDecoration: 'none' }}>
                        Regístrate
                    </Link>
                </div>
            </div>
        </div>
    );
}
