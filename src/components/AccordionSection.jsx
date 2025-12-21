import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './AccordionSection.css';

export default function AccordionSection({ title, isOpen, onToggle, children, selectionLabel, headerAction }) {

    return (
        <div className={`accordion-section ${isOpen ? 'open' : 'closed'}`}>
            <div
                className="accordion-header-row"
                onClick={(e) => {
                    e.preventDefault();
                    if (onToggle) onToggle();
                }}
                style={{ cursor: 'pointer', userSelect: 'none' }}
            >
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '0.5rem' }}>
                    {isOpen ? <ChevronDown size={20} className="text-secondary" /> : <ChevronRight size={20} className="text-secondary" />}
                    <span className="accordion-title" style={{ fontWeight: 600 }}>{title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {!isOpen && selectionLabel && (
                        <span className="selection-preview" style={{ marginRight: '1rem' }}>{selectionLabel}</span>
                    )}

                    {isOpen && headerAction && (
                        <div onClick={(e) => e.stopPropagation()}>
                            {headerAction}
                        </div>
                    )}
                </div>
            </div>

            <div className="accordion-content">
                <div className="accordion-inner">
                    {children}
                </div>
            </div>
        </div>
    );
}
