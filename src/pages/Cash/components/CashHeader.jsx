import React from 'react';

export default function CashHeader({ date }) {
    return (
        <div style={{
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
        }}>
            <div>
                <h1 style={{
                    fontSize: '24px',
                    fontWeight: 800,
                    margin: '0 0 0.5rem 0',
                    background: 'linear-gradient(to right, #fff, #dadada)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                }}>
                    Control de Caja
                </h1>
                <p style={{
                    color: 'var(--text-secondary)',
                    margin: 0,
                    fontWeight: 500,
                    textTransform: 'capitalize'
                }}>
                    {date.toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </div>
            {/* Export button removed as requested */}
        </div>
    );
}
