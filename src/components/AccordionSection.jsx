import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import './AccordionSection.css';

export default function AccordionSection({ title, isOpen, onToggle, children, selectionLabel, headerAction }) {
    return (
        <div className={`accordion-section ${isOpen ? 'open' : 'closed'}`}>
            <div className="accordion-header-row">
                <button className="accordion-toggle-btn" onClick={onToggle}>
                    <div className="header-left">
                        {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <span className="accordion-title">{title}</span>
                    </div>
                    {!isOpen && selectionLabel && (
                        <span className="selection-preview">{selectionLabel}</span>
                    )}
                </button>

                {/* Render custom action like the Toggle Switch if provided and section is Open */}
                {isOpen && headerAction && (
                    <div className="accordion-action">
                        {headerAction}
                    </div>
                )}
            </div>

            <div className="accordion-content">
                <div className="accordion-inner">
                    {children}
                </div>
            </div>
        </div>
    );
}
