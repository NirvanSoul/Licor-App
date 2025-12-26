import React from 'react';

// Helper Component: Sliding Pill Toggle
// "Miniature" sizing: height 32px, text 0.75rem (12px)
const SlidingSegmentedControl = ({ options, onSelect }) => {
    // Find active index for sliding mechanics
    const activeIndex = options.findIndex(o => o.isActive);

    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            background: 'var(--accent-light)',
            borderRadius: '9999px',
            padding: '2px', // Minimal padding
            height: '32px', // Compact height
            width: '100%',
            boxSizing: 'border-box',
            isolation: 'isolate' // Create stacking context
        }}>
            {/* 1. The Sliding Black Pill (Background) */}
            <div style={{
                position: 'absolute',
                top: '2px',
                bottom: '2px',
                // Logic: Width is (100% - 4px padding) / 2
                width: 'calc(50% - 2px)',
                // Logic: Left starts at 2px. If index 1, move to 50%.
                left: activeIndex === 0 ? '2px' : '50%',
                background: 'var(--text-primary)',
                borderRadius: '9999px',
                pointerEvents: 'none', // Allow clicks to pass through to buttons
                zIndex: 1,
                transition: 'all 0.25s cubic-bezier(0.4, 0.0, 0.2, 1)', // Smooth sliding easing
                boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
            }} />

            {/* 2. The Text Options (Foreground) */}
            {
                options.map((opt) => (
                    <button
                        key={opt.label}
                        type="button" // Prevent form submission
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelect(opt);
                        }}
                        style={{
                            flex: 1,
                            position: 'relative',
                            zIndex: 2, // Sit on top of the pill
                            border: 'none',
                            background: 'transparent',
                            padding: '0',
                            // Dynamic Text Color based on selection
                            color: opt.isActive ? 'var(--bg-card)' : 'var(--text-secondary)',
                            fontWeight: 600,
                            fontSize: '0.75rem', // Tiny text (12px)
                            letterSpacing: '0.01em',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'color 0.2s ease', // Smooth text color swap
                            userSelect: 'none'
                        }}
                    >
                        {opt.label}
                    </button>
                ))
            }
        </div >
    );
};

export default function ContainerSelector({ value, onChange }) {
    // Parse current value
    const safeValue = value || '';
    const isCan = safeValue.includes('Lata');
    const isLarge = safeValue.includes('Grande');

    return (
        <div className="container-selector" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '150px', // Reduced from 200px for better responsiveness
            flexShrink: 0
        }}>

            {/* Level 1: Main Type (Botella vs Lata) */}
            <SlidingSegmentedControl
                onSelect={(opt) => {
                    if (opt.value === 'Botella') {
                        onChange('Botella');
                    } else {
                        // Default to small can if switching to can
                        onChange('Lata Pequeña');
                    }
                }}
                options={[
                    { label: 'Botella', value: 'Botella', isActive: !isCan },
                    { label: 'Lata', value: 'Lata', isActive: isCan }
                ]}
            />

            {/* Level 2: Sub-options (Conditional) */}
            {isCan && (
                <div style={{
                    animation: 'slideUpFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    transformOrigin: 'top center'
                }}>
                    <SlidingSegmentedControl
                        onSelect={(opt) => onChange(`Lata ${opt.value}`)}
                        options={[
                            { label: 'Pequeña', value: 'Pequeña', isActive: !isLarge },
                            { label: 'Grande', value: 'Grande', isActive: isLarge }
                        ]}
                    />
                </div>
            )}
            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(-4px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );
}
