import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Clock, X, Zap, AlertTriangle } from 'lucide-react';

const DISMISS_KEY = 'freeTrialReminderDismissedUntil';

/**
 * FreeTrialReminder - Muestra un banner para usuarios con plan free
 * indicando cuántos días les quedan de su período de prueba.
 */
export default function FreeTrialReminder() {
    const { planType, licenseExpiresAt, isLicenseActive, role } = useAuth();
    const navigate = useNavigate();
    const [dismissed, setDismissed] = useState(false);
    const [daysLeft, setDaysLeft] = useState(null);

    // Calcular días restantes
    useEffect(() => {
        if (licenseExpiresAt) {
            const expiryDate = new Date(licenseExpiresAt);
            const now = new Date();
            const diffTime = expiryDate - now;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysLeft(diffDays);
        }
    }, [licenseExpiresAt]);

    // Handler for dismiss (Session only)
    const handleDismiss = () => {
        setDismissed(true);
    };

    // No mostrar si no es plan free o si el usuario cerró el banner
    const isFree = planType?.toLowerCase() === 'free';
    const isDeveloper = role?.toUpperCase() === 'DEVELOPER';

    if (!isFree || dismissed || !isLicenseActive || isDeveloper || daysLeft === null) {
        return null;
    }

    // Determinar estilo según días restantes
    const isUrgent = daysLeft <= 3;
    const isWarning = daysLeft <= 7 && daysLeft > 3;

    const getProgressColor = () => {
        if (isUrgent) return '#ef4444'; // Rojo
        if (isWarning) return '#f59e0b'; // Naranja
        return '#3b82f6'; // Azul
    };

    const getMessage = () => {
        if (daysLeft <= 0) return '¡Tu período de prueba ha terminado!';
        if (daysLeft === 1) return '¡Último día de prueba!';
        if (daysLeft <= 3) return `¡Solo ${daysLeft} días restantes!`;
        if (daysLeft <= 7) return `${daysLeft} días restantes de tu prueba`;
        return `Te quedan ${daysLeft} días de prueba gratuita`;
    };

    const getIcon = () => {
        if (isUrgent) return AlertTriangle;
        return Clock;
    };

    const Icon = getIcon();
    const progressPercent = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100));

    return (
        <div style={{
            background: isUrgent
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.1) 100%)'
                : isWarning
                    ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)'
                    : 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)',
            border: `1px solid ${isUrgent ? 'rgba(239, 68, 68, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`,
            borderRadius: '16px',
            padding: '12px 16px',
            marginBottom: '1rem',
            position: 'relative',
            overflow: 'hidden',
            animation: isUrgent ? 'pulseUrgent 2s ease-in-out infinite' : 'none'
        }}>
            {/* Barra de progreso */}
            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                width: `${progressPercent}%`,
                background: getProgressColor(),
                transition: 'width 0.5s ease',
                borderRadius: '0 2px 2px 0'
            }} />

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
            }}>
                {/* Icono y mensaje */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        background: getProgressColor(),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: `0 4px 12px ${getProgressColor()}40`
                    }}>
                        <Icon size={18} color="white" />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            lineHeight: 1.2
                        }}>
                            {getMessage()}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            opacity: 0.8
                        }}>
                            {isUrgent
                                ? '¡Activa ahora para no perder acceso!'
                                : isWarning
                                    ? 'Activa un plan para continuar sin interrupciones'
                                    : 'Activa un plan premium para desbloquear todo'}
                        </span>
                    </div>
                </div>

                {/* Botones */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => navigate('/ajustes?view=activation')}
                        style={{
                            background: getProgressColor(),
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: `0 4px 12px ${getProgressColor()}30`,
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        <Zap size={14} />
                        Activar
                    </button>

                    <button
                        onClick={handleDismiss}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            padding: '6px',
                            cursor: 'pointer',
                            opacity: 0.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                        title="Cerrar"
                    >
                        <X size={16} color="var(--text-primary)" />
                    </button>
                </div>
            </div>

            {/* CSS Animation */}
            <style>{`
                @keyframes pulseUrgent {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.85; }
                }
            `}</style>
        </div>
    );
}
