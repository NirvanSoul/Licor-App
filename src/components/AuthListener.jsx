import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNotification } from '../context/NotificationContext';

/**
 * Componente que escucha eventos globales de autenticación 
 * para mostrar notificaciones automáticas (ej: verificación de correo).
 */
export default function AuthListener() {
    const { showNotification } = useNotification();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            // Detectar inicio de sesión exitoso
            if (event === 'SIGNED_IN') {
                const hash = window.location.hash;

                // Caso 1: Confirmación de Correo (Signup)
                if (hash.includes('type=signup') || hash.includes('type=invite')) {
                    showNotification('¡Correo verificado con éxito! Bienvenido.', 'success');
                    // Limpiamos los tokens de la URL para que se vea limpia
                    window.history.replaceState(null, null, window.location.pathname);
                }

                // Caso 2: Recuperación de Contraseña
                if (hash.includes('type=recovery')) {
                    showNotification('Enlace de recuperación validado.', 'success');
                    window.history.replaceState(null, null, window.location.pathname);
                }
            }

            // Detectar renovación de token o errores
            if (event === 'USER_UPDATED') {
                // Podría usarse para confirmar cambios de perfil
            }
        });

        return () => {
            if (subscription) subscription.unsubscribe();
        };
    }, [showNotification]);

    return null;
}
