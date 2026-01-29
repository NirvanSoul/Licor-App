import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null); // 'OWNER', 'MANAGER', 'EMPLOYEE', 'DEVELOPER'
    const [organizationId, setOrganizationId] = useState(null);
    const [organizationName, setOrganizationName] = useState(null);
    const [isLicenseActive, setIsLicenseActive] = useState(true); // Default to true to prevent flickering, then check
    const [planType, setPlanType] = useState(null); // 'free', 'monthly', 'yearly'
    const [licenseExpiresAt, setLicenseExpiresAt] = useState(null);
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
            console.log('🔍 [AuthContext] Fetching profile for user:', currentUser.id);

            // 1. Fetch Profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .single();

            if (profileError) {
                console.error('❌ [AuthContext] Error fetching profile (Check RLS):', {
                    code: profileError.code,
                    message: profileError.message,
                    details: profileError.details,
                    userId: currentUser.id
                });
            }

            console.log('📋 [AuthContext] Profile data received:', profile);

            setUser(currentUser);

            if (profile) {
                console.log('✅ [AuthContext] Setting role:', profile.role);
                console.log('✅ [AuthContext] Setting organizationId:', profile.organization_id);
                setRole(profile.role);
                setOrganizationId(profile.organization_id);

                // 2. Fetch Organization Name (Separate Query to avoid RLS recursion)
                if (profile.organization_id) {
                    const { data: org, error: orgError } = await supabase
                        .from('organizations')
                        .select('name, is_active, license_expires_at, plan_type')
                        .eq('id', profile.organization_id)
                        .single();

                    const isDev = profile.role?.toUpperCase() === 'DEVELOPER';

                    if (!orgError && org) {
                        setOrganizationName(org.name);
                        setPlanType(org.plan_type);
                        setLicenseExpiresAt(org.license_expires_at);

                        // Check if license is active AND not expired
                        const isActive = org.is_active === true;
                        const expiryDate = org.license_expires_at ? new Date(org.license_expires_at) : null;
                        const isExpired = expiryDate ? expiryDate < new Date() : false;

                        setIsLicenseActive(isDev || (isActive && !isExpired));
                    } else {
                        console.error('Error fetching org name:', orgError);
                        setOrganizationName('Desconocida');
                        setPlanType(null);
                        setLicenseExpiresAt(null);
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
        planType,
        licenseExpiresAt,
        refreshProfile: () => user ? fetchProfile(user) : null,
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
                const { data, error } = await supabase.from('organizations').select('is_active, license_expires_at, plan_type').eq('id', organizationId).single();
                if (!error && data) {
                    const isActive = data.is_active === true;
                    const expiryDate = data.license_expires_at ? new Date(data.license_expires_at) : null;
                    const isExpired = expiryDate ? expiryDate < new Date() : false;
                    setIsLicenseActive(isActive && !isExpired);
                    setPlanType(data.plan_type);
                    setLicenseExpiresAt(data.license_expires_at);
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
