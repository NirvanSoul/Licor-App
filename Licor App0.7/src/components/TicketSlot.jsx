import React from 'react';

// getBeerColor removed from here, passed as prop


export default function TicketSlot({ content, onClick, isEmpty, count = 1, color }) {
    if (isEmpty) {
        return (
            <button
                onClick={onClick}
                className="ticket-slot-btn empty"
            >
                Agregar
            </button>
        );
    }

    const colors = color || { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' };

    return (
        <button
            onClick={onClick}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                padding: '0.5rem',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: colors.text,
                fontWeight: 700,
                height: '50px',
                height: '50px',
                width: '100%',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                position: 'relative', // For badge positioning
            }}
        >
            {content}
            {count > 1 && (
                <span
                    className="slot-badge"
                    style={{
                        background: colors.raw || colors.bg,
                        color: colors.text, // Or white if raw is used? usually white/contrast.
                        borderColor: '#fff' // Keep white border for separation
                    }}
                >
                    {count}
                </span>
            )}
        </button>
    );
}
