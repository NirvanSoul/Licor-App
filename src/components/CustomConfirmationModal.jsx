import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

/**
 * A reusable confirmation modal with the application's visual style.
 * 
 * @param {boolean} isOpen - key to control visibility
 * @param {string} title - Modal Title
 * @param {string} message - Modal body text
 * @param {string} confirmText - Text for the confirm button
 * @param {string} cancelText - Text for the cancel button
 * @param {function} onConfirm - Function to call when confirmed
 * @param {function} onCancel - Function to call when cancelled
 * @param {string} type - 'danger' | 'success' | 'warning' | 'info' (Affects icon and colors)
 */
const CustomConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    onConfirm,
    onCancel,
    type = 'danger'
}) => {

    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Config based on type
    const configs = {
        danger: {
            icon: <AlertCircle size={32} color="#ef4444" />,
            iconBg: 'rgba(239, 68, 68, 0.1)',
            titleColor: '#ef4444',
            confirmBtnBg: 'var(--bg-card-hover)',
            confirmBtnColor: '#ef4444',
            confirmBtnBorder: '1px solid #ef4444'
        },
        warning: {
            icon: <HelpCircle size={32} color="#f97316" />,
            iconBg: 'rgba(249, 115, 22, 0.1)',
            titleColor: '#f97316',
            confirmBtnBg: 'var(--bg-card-hover)',
            confirmBtnColor: '#f97316',
            confirmBtnBorder: '1px solid #f97316'
        },
        success: {
            icon: <CheckCircle size={32} color="#10b981" />,
            iconBg: 'rgba(16, 185, 129, 0.1)',
            titleColor: '#10b981',
            confirmBtnBg: 'var(--bg-card-hover)',
            confirmBtnColor: '#10b981',
            confirmBtnBorder: '1px solid #10b981'
        },
        info: {
            icon: <HelpCircle size={32} color="#3b82f6" />,
            iconBg: 'rgba(59, 130, 246, 0.1)',
            titleColor: '#3b82f6',
            confirmBtnBg: 'var(--bg-card-hover)',
            confirmBtnColor: '#3b82f6',
            confirmBtnBorder: '1px solid #3b82f6'
        }
    };

    const config = configs[type] || configs.danger;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="modal-content"
                style={{
                    width: '320px',
                    padding: '2rem',
                    textAlign: 'center',
                    borderRadius: '20px'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: config.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem'
                    }}>
                        {config.icon}
                    </div>
                    <h3 className="modal-title" style={{ margin: 0, fontSize: '1.25rem', color: config.titleColor }}>
                        {title}
                    </h3>
                </div>

                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    {message}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        className="modal-close-btn"
                        onClick={onConfirm}
                        style={{
                            margin: 0,
                            background: config.confirmBtnBg,
                            color: config.confirmBtnColor,
                            border: config.confirmBtnBorder,
                            fontSize: '0.9rem',
                            fontWeight: 700
                        }}
                    >
                        {confirmText}
                    </button>
                    <button
                        className="create-ticket-btn"
                        onClick={onCancel}
                        style={{
                            margin: 0,
                            fontSize: '0.9rem',
                            padding: '0.75rem',
                            background: 'var(--accent-color)', // Default Primary for cancel usually safer? Or reverse?
                            // Typically "Cancel" is primary action to avoid mistakes, but user requested "style CSS".
                            // I'll stick to a neutral primary for cancel or secondary. 
                            // Let's use the 'create-ticket-btn' style which seems to be the primary generic button.
                        }}
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    animation: fadeIn 0.2s ease;
                }
                .modal-content {
                    background: var(--bg-card);
                    border: 1px solid var(--accent-light);
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    animation: scaleUp 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
};

export default CustomConfirmationModal;
