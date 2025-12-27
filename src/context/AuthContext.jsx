import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'master', 'admin', 'employee', 'normal'
    const [organizationId, setOrganizationId] = useState(null);
    const [organizationName, setOrganizationName] = useState(null);
    const [isLicenseActive, setIsLicenseActive] = useState(true); // Default to true to prevent flickering, then check
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
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                // We'll handle this in the app or via a direct check, 
                // but let's make sure it doesn't just log them in and stay on home
                window.location.href = `${window.location.origin}/reset-password`;
            }

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
                        .select('name, is_active, license_expires_at')
                        .eq('id', profile.organization_id)
                        .single();

                    const isDev = profile.role?.toUpperCase() === 'DEVELOPER';

                    if (!orgError && org) {
                        setOrganizationName(org.name);

                        // Check if license is active AND not expired
                        const isActive = org.is_active === true;
                        const expiryDate = org.license_expires_at ? new Date(org.license_expires_at) : null;
                        const isExpired = expiryDate ? expiryDate < new Date() : false;

                        setIsLicenseActive(isDev || (isActive && !isExpired));
                    } else {
                        console.error('Error fetching org name:', orgError);
                        setOrganizationName('Desconocida');
                        setIsLicenseActive(isDev);
                    }
                } else {
                    // No org, but check if dev
                    setIsLicenseActive(profile.role?.toUpperCase() === 'DEVELOPER');
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

    const resetPassword = async (email) => {
        // Enviar el correo de recuperación a través de Supabase
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });
        if (error) throw error;
    };

    const value = {
        user,
        role,
        organizationId,
        organizationName,
        loading,
        login,
        logout,
        resetPassword,
        updatePassword,
        isLicenseActive,
        refreshLicense: async (forcedValue = null) => {
            const isDev = role?.toUpperCase() === 'DEVELOPER';
            if (isDev) {
                setIsLicenseActive(true);
                return;
            }

            if (forcedValue !== null) {
                setIsLicenseActive(forcedValue === true);
                return;
            }
            if (organizationId) {
                const { data, error } = await supabase.from('organizations').select('is_active, license_expires_at').eq('id', organizationId).single();
                if (!error && data) {
                    const isActive = data.is_active === true;
                    const expiryDate = data.license_expires_at ? new Date(data.license_expires_at) : null;
                    const isExpired = expiryDate ? expiryDate < new Date() : false;
                    setIsLicenseActive(isActive && !isExpired);
                }
            } else {
                setIsLicenseActive(false);
            }
        }
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
