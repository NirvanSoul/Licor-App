
import React, { useState } from 'react';
import { Plus, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { useProduct } from '../../context/ProductContext';
import { presetColors } from '../../data/settingsData';

// Reusable Accordion Section separate from the main one if needed, 
// or import the shared one if it's generic.
// Assuming we want to keep it self-contained or use the one in components/
import AccordionSection from '../../components/AccordionSection';

const ProductsSection = ({ onGuide }) => {
    const {
        beerTypes, addBeerType, removeBeerType,
        prices, getEmissionsForSubtype, addEmissionType, removeEmissionType,
        getUnitsPerEmission, updateConversion, getBeerColor, beerCategories
    } = useProduct();

    // Local State for Products
    const [openSections, setOpenSections] = useState({ beers: true, emissions: false });
    const [newBeerName, setNewBeerName] = useState('');
    const [newBeerColor, setNewBeerColor] = useState('#FFBC00');
    const [newBeerSubtype, setNewBeerSubtype] = useState('Botella'); // 'Botella' | 'Lata'
    const [lataSize, setLataSize] = useState('Lata Pequeña'); // 'Lata Pequeña' | 'Lata Grande'
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });

    // Local State for Emissions
    const [selectedConversionSubtype, setSelectedConversionSubtype] = useState('Botella');
    const [newEmissionName, setNewEmissionName] = useState('');

    const toggleSettingSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleAddBeer = async () => {
        if (!newBeerName.trim()) return;
        const nameToAdd = newBeerName.trim();
        const finalCategory = newBeerSubtype === 'Lata' ? lataSize : 'Botella';
        await addBeerType(nameToAdd, newBeerColor, finalCategory);
        setNewBeerName('');
        setNewBeerColor('#FFBC00'); // Reset to default gold

        // Trigger Guidance
        if (onGuide) {
            onGuide('price', nameToAdd, `¡${nameToAdd} agregado! ¿Quieres configurar sus precios ahora?`);
        }
    };

    const handleAddEmission = async () => {
        if (!newEmissionName.trim()) return;
        const nameToAdd = newEmissionName.trim();
        // Default to 1 unit when creating - user will adjust with +/- buttons
        await addEmissionType(nameToAdd, 1, selectedConversionSubtype);
        setNewEmissionName('');

        // Trigger Guidance
        if (onGuide) {
            onGuide('price', nameToAdd, `¡Emisión "${nameToAdd}" agregada! ¿Quieres configurar los precios para este formato ahora?`);
        }
    };



    const normalizeSubtype = (st) => st.toLowerCase().includes('lata') ? 'Lata' : 'Botella';

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {/* --- TIPOS DE CERVEZA --- */}
            <AccordionSection title="Tipos de Cerveza" isOpen={!!openSections['beers']} onToggle={() => toggleSettingSection('beers')}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-card-hover)', padding: '1.25rem', borderRadius: '20px', border: '1px solid var(--accent-light)' }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <button
                                onClick={(e) => {
                                    const rect = e.target.getBoundingClientRect();
                                    setPickerPos({ top: rect.bottom + 10, left: rect.left });
                                    setShowColorPicker(!showColorPicker);
                                }}
                                style={{ width: '32px', height: '32px', borderRadius: '50%', background: newBeerColor, border: '2px solid rgba(0,0,0,0.1)', cursor: 'pointer', flexShrink: 0 }}
                            />
                            <input
                                type="text"
                                placeholder="Ej: Polar Pilsen, Solera..."
                                className="ticket-input-large"
                                value={newBeerName}
                                onChange={(e) => setNewBeerName(e.target.value)}
                                style={{ flex: 1, padding: '0.75rem 1.25rem', fontSize: '1rem', height: '48px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* Selector Group */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {/* Primary Toggle: Botella / Lata */}
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    background: 'var(--bg-app)',
                                    borderRadius: '999px',
                                    padding: '2px',
                                    height: '36px',
                                    width: '180px',
                                    isolation: 'isolate'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '2px', bottom: '2px', left: '2px',
                                        width: 'calc(50% - 2px)',
                                        background: 'var(--text-primary)',
                                        borderRadius: '999px',
                                        transform: newBeerSubtype === 'Lata' ? 'translateX(100%)' : 'translateX(0)',
                                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                        zIndex: 1
                                    }} />
                                    <button
                                        onClick={() => setNewBeerSubtype('Botella')}
                                        style={{ flex: 1, border: 'none', background: 'transparent', color: newBeerSubtype === 'Botella' ? 'var(--bg-card)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', zIndex: 2, cursor: 'pointer' }}
                                    >
                                        Botella
                                    </button>
                                    <button
                                        onClick={() => setNewBeerSubtype('Lata')}
                                        style={{ flex: 1, border: 'none', background: 'transparent', color: newBeerSubtype === 'Lata' ? 'var(--bg-card)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', zIndex: 2, cursor: 'pointer' }}
                                    >
                                        Lata
                                    </button>
                                </div>

                                {/* Secondary Toggle: Tamaño (Only if Lata) */}
                                {newBeerSubtype === 'Lata' && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        animation: 'fadeIn 0.3s ease'
                                    }}>
                                        <div style={{
                                            position: 'relative',
                                            display: 'flex',
                                            background: 'var(--bg-app)',
                                            borderRadius: '999px',
                                            padding: '2px',
                                            height: '32px',
                                            width: '180px',
                                            isolation: 'isolate'
                                        }}>
                                            <div style={{
                                                position: 'absolute',
                                                top: '2px', bottom: '2px', left: '2px',
                                                width: 'calc(50% - 2px)',
                                                background: 'var(--text-primary)',
                                                borderRadius: '999px',
                                                transform: lataSize === 'Lata Grande' ? 'translateX(100%)' : 'translateX(0)',
                                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                                zIndex: 1
                                            }} />
                                            <button
                                                onClick={() => setLataSize('Lata Pequeña')}
                                                style={{ flex: 1, border: 'none', background: 'transparent', color: lataSize === 'Lata Pequeña' ? 'var(--bg-card)' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', zIndex: 2, cursor: 'pointer' }}
                                            >
                                                Pequeña
                                            </button>
                                            <button
                                                onClick={() => setLataSize('Lata Grande')}
                                                style={{ flex: 1, border: 'none', background: 'transparent', color: lataSize === 'Lata Grande' ? 'var(--bg-card)' : 'var(--text-secondary)', fontWeight: 700, fontSize: '0.75rem', zIndex: 2, cursor: 'pointer' }}
                                            >
                                                Grande
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Final Action Button */}
                            <button
                                onClick={handleAddBeer}
                                className="option-btn selected"
                                style={{
                                    width: '100%',
                                    height: '46px',
                                    borderRadius: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    fontSize: '1rem',
                                    marginTop: '0.25rem',
                                    boxShadow: '0 4px 15px rgba(255, 188, 0, 0.2)'
                                }}
                            >
                                <Plus size={20} />
                                <span>Agregar Producto</span>
                            </button>
                        </div>
                    </div>

                    {showColorPicker && (
                        <div style={{ position: 'fixed', top: pickerPos.top, left: pickerPos.left, zIndex: 1000, background: 'var(--bg-card)', padding: '1.25rem', borderRadius: '20px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--accent-light)', width: '280px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px' }}>
                                {presetColors.map(color => (
                                    <button key={color} onClick={() => { setNewBeerColor(color); setShowColorPicker(false); }} style={{ width: '100%', aspectRatio: '1', borderRadius: '50%', background: color, border: newBeerColor === color ? '3px solid var(--text-primary)' : '2px solid transparent' }} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="options-grid" style={{ gridTemplateColumns: '1fr', gap: '0.5rem' }}>
                    {Array.isArray(beerTypes) && beerTypes
                        .filter(beer => {
                            const activeTab = newBeerSubtype.toLowerCase(); // 'botella' or 'lata'
                            const storedCategory = beerCategories[beer];

                            // 1. If we have a stored category, prioritize it
                            if (storedCategory) {
                                return storedCategory.toLowerCase().includes(activeTab);
                            }

                            // 2. Fallback for legacy data (based on prices)
                            const relatedKeys = Object.keys(prices || {}).filter(key => key.startsWith(beer + '_'));
                            if (relatedKeys.length > 0) {
                                return relatedKeys.some(key => {
                                    const parts = key.split('_');
                                    const pSubtype = (parts[2] || '').toLowerCase();
                                    return pSubtype.includes(activeTab);
                                });
                            }

                            // 3. If NO category and NO prices, it shouldn't show up here 
                            // unless it was just added in this tab (which should have category now)
                            return false;
                        })
                        .map(beer => (
                            <div key={beer} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-card-hover)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: getBeerColor(beer).bg,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 0 8px ' + getBeerColor(beer).bg + '40'
                                    }} />
                                    <span style={{ fontWeight: 500 }}>{beer}</span>
                                </div>
                                <button onClick={() => removeBeerType(beer)} style={{ color: '#ff3b30', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={20} /></button>
                            </div>
                        ))}
                </div>
            </AccordionSection>

            {/* --- FORMAS DE EMISIÓN --- */}
            <AccordionSection
                title="Formas de Emisión"
                isOpen={!!openSections['emissions']}
                onToggle={() => toggleSettingSection('emissions')}
            >
                <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Tercio Toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--accent-light)' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Formato Tercio</span>
                        <button
                            onClick={() => {
                                const isTercio = selectedConversionSubtype === 'Botella Tercio';
                                setSelectedConversionSubtype(isTercio ? 'Botella' : 'Botella Tercio');
                            }}
                            style={{
                                width: '42px',
                                height: '24px',
                                borderRadius: '12px',
                                background: selectedConversionSubtype === 'Botella Tercio' ? 'var(--accent-color)' : 'rgba(128, 128, 128, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '2px',
                                cursor: 'pointer',
                                border: 'none',
                                transition: 'all 0.3s ease',
                                position: 'relative'
                            }}
                        >
                            <div style={{
                                width: '20px',
                                height: '20px',
                                background: 'white',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: selectedConversionSubtype === 'Botella Tercio' ? 'translateX(18px)' : 'translateX(0)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                                {selectedConversionSubtype === 'Botella Tercio' && <Check size={12} color="var(--accent-color)" strokeWidth={4} />}
                            </div>
                        </button>
                    </div>

                    {selectedConversionSubtype !== 'Botella Tercio' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                background: 'var(--bg-app)',
                                borderRadius: '999px',
                                padding: '2px',
                                height: '36px',
                                isolation: 'isolate',
                                maxWidth: '200px'
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    top: '2px', bottom: '2px', left: '2px',
                                    width: 'calc(50% - 2px)',
                                    background: 'var(--text-primary)',
                                    borderRadius: '999px',
                                    transform: normalizeSubtype(selectedConversionSubtype) === 'Lata' ? 'translateX(100%)' : 'translateX(0)',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    zIndex: 1
                                }} />
                                <button
                                    onClick={() => setSelectedConversionSubtype('Botella')}
                                    style={{ flex: 1, border: 'none', background: 'transparent', color: normalizeSubtype(selectedConversionSubtype) === 'Botella' ? 'var(--bg-card)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', zIndex: 2, cursor: 'pointer' }}
                                >
                                    Botella
                                </button>
                                <button
                                    onClick={() => setSelectedConversionSubtype('Lata Pequeña')}
                                    style={{ flex: 1, border: 'none', background: 'transparent', color: normalizeSubtype(selectedConversionSubtype) === 'Lata' ? 'var(--bg-card)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.85rem', zIndex: 2, cursor: 'pointer' }}
                                >
                                    Lata
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* INPUTS NUEVOS */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        background: 'var(--bg-card-hover)',
                        padding: '1.25rem',
                        borderRadius: '20px',
                        border: '1px solid var(--accent-light)'
                    }}>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                            <input
                                type="text"
                                placeholder="Nueva forma (ej: Pack 12, Combo)"
                                className="ticket-input-large"
                                value={newEmissionName}
                                onChange={(e) => setNewEmissionName(e.target.value)}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem 1.25rem',
                                    fontSize: '1rem',
                                    height: '48px'
                                }}
                            />
                            <button
                                onClick={handleAddEmission}
                                className="option-btn selected"
                                style={{
                                    padding: '0 1.5rem',
                                    height: '48px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '0.9rem',
                                    minWidth: '120px'
                                }}
                            >
                                <Plus size={18} />
                                <span>Agregar</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {getEmissionsForSubtype(selectedConversionSubtype).map(emission => {
                        // Standard emissions that are locked (cannot modify units or delete)
                        const standardEmissions = ['Unidad', 'Media Caja', 'Caja', 'Six Pack'];
                        const isStandard = standardEmissions.includes(emission);
                        const currentUnits = getUnitsPerEmission(emission, selectedConversionSubtype);

                        return (
                            <div key={emission} style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                padding: '0.8rem 1rem',
                                marginBottom: '0.75rem',
                                background: 'var(--bg-card-hover)',
                                borderRadius: '12px',
                                border: '1px solid var(--accent-light)'
                            }}>
                                {/* Emission Name */}
                                <span style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>{emission}</span>

                                {/* Units Label */}
                                <span style={{
                                    fontSize: '0.85rem',
                                    color: 'var(--text-secondary)',
                                    marginRight: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    Uni.
                                </span>

                                {/* Units Control - Only show +/- for CUSTOM emissions */}
                                {isStandard ? (
                                    // Standard emission: just show the number
                                    <span style={{
                                        minWidth: '45px',
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        fontSize: '1.1rem',
                                        color: 'var(--text-primary)',
                                        marginRight: '1rem'
                                    }}>
                                        {currentUnits}
                                    </span>
                                ) : (
                                    // Custom emission: show [-] [number] [+] controls
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginRight: '0.5rem' }}>
                                        {/* Minus button on LEFT */}
                                        <button
                                            onClick={() => {
                                                if (currentUnits > 1) {
                                                    updateConversion(emission, currentUnits - 1, selectedConversionSubtype);
                                                }
                                            }}
                                            disabled={currentUnits <= 1}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: '#5B5B5C',
                                                border: '1px solid rgba(128,128,128,0.2)',
                                                color: 'white',
                                                cursor: currentUnits <= 1 ? 'not-allowed' : 'pointer',
                                                fontSize: '1.3rem',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0,
                                                opacity: currentUnits <= 1 ? 1 : 1
                                            }}
                                        >
                                            −
                                        </button>

                                        <span style={{
                                            minWidth: '50px',
                                            textAlign: 'center',
                                            fontWeight: 700,
                                            fontSize: '1.1rem',
                                            color: 'var(--text-primary)'
                                        }}>
                                            {currentUnits}
                                        </span>

                                        {/* Plus button on RIGHT */}
                                        <button
                                            onClick={() => {
                                                updateConversion(emission, currentUnits + 1, selectedConversionSubtype);
                                            }}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                background: 'rgba(200,200,200,0.3)',
                                                border: '1px solid rgba(128,128,128,0.2)',
                                                color: 'var(--text-primary)',
                                                cursor: 'pointer',
                                                fontSize: '1.3rem',
                                                fontWeight: 700,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: 0
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                )}

                                {/* Delete button - Only for CUSTOM emissions */}
                                {!isStandard && (
                                    <button
                                        onClick={() => removeEmissionType(emission, selectedConversionSubtype)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            padding: '4px'
                                        }}
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </AccordionSection>
        </div>
    );
};

export default ProductsSection;
