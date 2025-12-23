import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'master', 'admin', 'employee', 'normal'
    const [organizationId, setOrganizationId] = useState(null);
    const [organizationName, setOrganizationName] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initial Session Check
    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                setLoading(false);
            }
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session) {
                fetchProfile(session.user);
            } else {
                setUser(null);
                setRole(null);
                setOrganizationId(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (currentUser) => {
        try {
            // 1. Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);
            }

            setUser(currentUser);

            if (profile) {
                setRole(profile.role);
                setOrganizationId(profile.organization_id);

                // 2. Fetch Organization Name (Separate Query to avoid RLS recursion)
                if (profile.organization_id) {
                    const { data: org, error: orgError } = await supabase
                        .from('organizations')
                        .select('name')
                        .eq('id', profile.organization_id)
                        .single();

                    if (!orgError && org) {
                        setOrganizationName(org.name);
                    } else {
                        console.error('Error fetching org name:', orgError);
                        setOrganizationName('Desconocida');
                    }
                }
            } else {
                console.warn('No profile found for user');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        setLoading(true);
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setLoading(false);
            throw error;
        }
        return data;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // State updates handled by onAuthStateChange
    };

    const value = {
        user,
        role,
        organizationId,
        organizationName,
        loading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
