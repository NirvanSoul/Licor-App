import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ShoppingBag, Receipt, ClipboardList, Settings } from 'lucide-react';
import InventoryFab from '../components/InventoryFab';
import './MainLayout.css';

export default function MainLayout() {
    const navItems = [
        { path: '/vender', label: 'Vender', icon: ShoppingBag },
        { path: '/caja', label: 'Caja', icon: Receipt },
        { path: '/pendientes', label: 'Pendientes', icon: ClipboardList },
        { path: '/ajustes', label: 'Ajustes', icon: Settings },
    ];

    return (
        <div className="layout-container">
            <nav className="main-nav">
                <div className="nav-pill">
                    {navItems.map((item) => (
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

            <main className="main-content">
                <Outlet />
            </main>

            <InventoryFab />
        </div>
    );
}
