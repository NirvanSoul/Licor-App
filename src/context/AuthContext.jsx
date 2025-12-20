import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [organizationId, setOrganizationId] = useState(null);
    const [organizationName, setOrganizationName] = useState(null); // <--- NUEVO ESTADO
    const [loading, setLoading] = useState(true);

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchProfile = async (userId, attempts = 0) => {
        try {
            // AQUÍ ESTÁ EL CAMBIO CLAVE:
            // Usamos organizations(name) para hacer el "JOIN" y traer el nombre
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    role, 
                    organization_id,
                    organizations (name) 
                `)
                .eq('id', userId)
                .single();

            if (error) {
                if (attempts < 3) {
                    console.warn(`Perfil no encontrado, reintentando... (${attempts + 1}/3)`);
                    await wait(1000);
                    return fetchProfile(userId, attempts + 1);
                }
                throw error;
            }

            if (data) {
                console.log("✅ Perfil y Organización cargados:", data);
                setRole(data.role);
                setOrganizationId(data.organization_id);
                // Extraemos el nombre de la relación anidada
                setOrganizationName(data.organizations?.name || 'Sin Nombre');
            }
        } catch (err) {
            console.error('Error obteniendo perfil:', err.message);
        }
    };

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                await fetchProfile(session.user.id);
            }
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                setUser(session.user);
                if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
                    await fetchProfile(session.user.id);
                }
            } else {
                setUser(null);
                setRole(null);
                setOrganizationId(null);
                setOrganizationName(null);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setOrganizationId(null);
        setOrganizationName(null);
    };

    const value = {
        user,
        role,
        organizationId,
        organizationName, // <--- EXPORTAMOS EL NOMBRE
        signOut,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);