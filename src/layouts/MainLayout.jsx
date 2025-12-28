import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Receipt, ClipboardList, Settings, Shield } from 'lucide-react';
import InventoryFab from '../components/InventoryFab';
import FreeTrialReminder from '../components/FreeTrialReminder';
import { useAuth } from '../context/AuthContext';
import './MainLayout.css';

export default function MainLayout() {
    const { role, isLicenseActive } = useAuth();
    const location = useLocation();
    const isAjustes = location.pathname === '/ajustes';
    const isDeveloper = location.pathname === '/developer';

    const getBlockMessage = () => {
        const path = location.pathname;
        if (path.includes('vender')) return 'Para usar las funciones del menú Vender activa la licencia.';
        if (path.includes('caja')) return 'Para usar las funciones del menú Caja activa la licencia.';
        if (path.includes('pendientes')) return 'Para usar las funciones del menú Consumos activa la licencia.';
        return 'Activa Licencias en el menú activación en Ajustes para continuar usando la aplicación.';
    };

    const navItems = [
        { path: '/vender', label: 'Vender', icon: ShoppingBag },
        { path: '/pendientes', label: 'Pendientes', icon: ClipboardList },
        { path: '/caja', label: 'Caja', icon: Receipt },
        { path: '/ajustes', label: 'Ajustes', icon: Settings },
    ];

    if (role === 'DEVELOPER') {
        navItems.push({ path: '/developer', label: 'Dev', icon: Shield });
    }

    const [isCompact, setIsCompact] = React.useState(false);
    const lastScrollY = React.useRef(0);

    React.useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Only trigger on mobile/tablet widths if needed, but CSS media queries handle the display.
            // Logic: Scroll DOWN -> Compact (True), Scroll UP -> Expanded (False)
            // Threshold: 50px to avoid jitter at very top

            if (currentScrollY > 50) {
                if (currentScrollY > lastScrollY.current) {
                    // Scrolling DOWN
                    setIsCompact(true);
                } else {
                    // Scrolling UP
                    setIsCompact(false);
                }
            } else {
                // At the top
                setIsCompact(false);
            }

            lastScrollY.current = currentScrollY;
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Get active index for sliding pill animation - pure CSS approach, no DOM measurements
    const activeIndex = navItems.findIndex(item => location.pathname === item.path);
    const sliderPosition = activeIndex >= 0 ? activeIndex : 0;

    // Swipe navigation for mobile
    const navigate = useNavigate();
    const touchStart = React.useRef({ x: 0, y: 0 });
    const touchEnd = React.useRef({ x: 0, y: 0 });
    const containerRef = React.useRef(null);
    const isTransitioning = React.useRef(false);
    const [swipeDirection, setSwipeDirection] = React.useState(null);

    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleTouchStart = (e) => {
            if (isTransitioning.current) return;
            touchStart.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
            touchEnd.current = { x: 0, y: 0 };
        };

        const handleTouchMove = (e) => {
            if (isTransitioning.current) return;
            touchEnd.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        };

        const handleTouchEnd = () => {
            if (isTransitioning.current || touchEnd.current.x === 0) return;

            const deltaX = touchStart.current.x - touchEnd.current.x;
            const deltaY = Math.abs(touchStart.current.y - touchEnd.current.y);
            const minSwipeDistance = 80;

            if (Math.abs(deltaX) > minSwipeDistance && Math.abs(deltaX) > deltaY * 1.8) {
                let nextPath = null;
                let outClass = '';
                let inClass = '';

                if (deltaX > 0) {
                    // Swiped LEFT -> Next
                    const nextIndex = activeIndex + 1;
                    if (nextIndex < navItems.length) {
                        nextPath = navItems[nextIndex].path;
                        outClass = 'slide-out-left';
                        inClass = 'slide-in-right';
                    }
                } else {
                    // Swiped RIGHT -> Prev
                    const prevIndex = activeIndex - 1;
                    if (prevIndex >= 0) {
                        nextPath = navItems[prevIndex].path;
                        outClass = 'slide-out-right';
                        inClass = 'slide-in-left';
                    }
                }

                if (nextPath) {
                    isTransitioning.current = true;
                    setSwipeDirection(outClass);

                    // Tiempo sincronizado con el CSS (0.12s)
                    setTimeout(() => {
                        window.scrollTo(0, 0);
                        navigate(nextPath);
                        // Aplicamos la entrada en el mismo ciclo para evitar el "blink"
                        setSwipeDirection(inClass);

                        // Limpiamos después de que la animación de entrada termine (0.2s)
                        setTimeout(() => {
                            setSwipeDirection(null);
                            isTransitioning.current = false;
                        }, 250);
                    }, 120);
                }
            }
        };

        container.addEventListener('touchstart', handleTouchStart, { passive: true });
        container.addEventListener('touchmove', handleTouchMove, { passive: true });
        container.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
        };
    }, [activeIndex, navItems, navigate]);

    return (
        <div ref={containerRef} className="layout-container">
            <nav className={`main-nav ${isCompact ? 'compact-wrapper' : ''}`}>
                <div className={`nav-pill ${isCompact ? 'compact' : ''}`} style={{ '--nav-items': navItems.length, '--active-index': sliderPosition }}>
                    {/* Sliding background pill - uses CSS calc() for position */}
                    <div className="nav-slider" />
                    {navItems.map((item, index) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                            onClick={(e) => {
                                // If clicking the active tab, dispatch reset event
                                if (window.location.pathname === item.path) {
                                    window.dispatchEvent(new CustomEvent('reset-flow', { detail: item.path }));
                                }
                            }}
                        >
                            <item.icon className="nav-icon" strokeWidth={2} />
                            <span className="nav-label">{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <main key={location.pathname} className={`main-content ${swipeDirection ? swipeDirection : ''}`}>
                {(isLicenseActive === false && !isAjustes && !isDeveloper) ? (
                    <div style={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2rem',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            background: 'rgba(234, 88, 12, 0.1)',
                            border: '1px solid #f97316',
                            padding: '2rem',
                            borderRadius: '24px',
                            maxWidth: '400px'
                        }}>
                            <h2 style={{ color: '#f97316', marginBottom: '1rem' }}>Acceso Restringido</h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                                {getBlockMessage()}
                            </p>
                            <NavLink
                                to="/ajustes?view=activation"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    padding: '12px 24px',
                                    background: '#10B981',
                                    color: 'white',
                                    borderRadius: '12px',
                                    textDecoration: 'none',
                                    fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <img src="/Whatsapp.svg" alt="WhatsApp" style={{ width: '20px', height: '20px' }} />
                                Activar Ahora
                            </NavLink>
                        </div>
                    </div>
                ) : (
                    <>
                        <FreeTrialReminder />
                        <Outlet />
                    </>
                )}
            </main>

            <InventoryFab />
        </div>
    );
}
