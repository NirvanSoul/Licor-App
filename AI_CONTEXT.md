# AI Context & Developer Guide 🤖

> **CRITICAL FOR AI AGENTS:** Read this file BEFORE modifying the codebase. It contains the business logic, architectural decisions, and conventions that must be respected to avoid regression.

## 1. Project Overview
**Licor-App** is a Web POS (Point of Sale) specifically designed for Liquor Stores.
*   **Core platform:** Web App (React + Vite) designed with a "Mobile-First" approach (UI mimics a native app).
*   **Primary Goal:** Fast sales recording, inventory management (bottles/cases), and financial reporting.

## 2. Tech Stack & Architecture
*   **Frontend:** React 19 (Vite).
*   **Language:** JavaScript (ES Modules).
*   **State Management:** React Context API (No Redux/Zustand).
    *   `ProductContext`: Products, Prices, Inventory logic.
    *   `OrderContext`: Current cart, totals calculation.
    *   `AuthContext`: User session (Supabase).
    *   `NotificationContext`: Global toasts.
*   **Database:** Supabase (PostgreSQL).
*   **Styling:**
    *   **CSS Modules**: For specific components.
    *   **Vanilla CSS**: Global styles in `index.css` and `App.css`.
    *   **Theming**: CSS Variables (`--color-primary`, `--bg-dark`, etc.) for Dark/Light mode support.
*   **Icons:** `lucide-react`.

## 3. Key Business Logic (DO NOT BREAK)

### 3.1. Pricing Logic ("Mayor" vs "Detal")
The app automatically switches prices based on quantity or manual toggle:
*   **Detal (Retail):** Unit price (e.g., 1 Bottle).
*   **Mayor (Wholesale):** Case/Pack price.
*   **Open Tab (Carta Abierta):** Special pricing for on-premise consumption.

### 3.2. Inventory Management
*   **Dual Units:** Inventory is tracked in **Units** (bottles) but sold in **Cases** or **Units**.
*   **Conversion:** `1 Case = X Units`. The logic must always convert cases to units before updating Supabase.
*   **Variados (Mixed Cases):** Special product type where a case contains different sub-products. Deducting stock from a "Variado" sale effectively deducts from the individual sub-products.

### 3.3. Sales Flow
1.  **Selection:** User picks items -> `OrderContext` adds to cart.
2.  **Cart:** Calculates total in **USD** and **VES** (Bolivars) based on the daily rate.
3.  **Checkout:**
    *   Select Payment Method: `Efectivo $`, `Zelle`, `Pago Móvil`, `Punto`.
    *   Confirm -> Updates `sales` table in Supabase -> Decrements `inventory`.

## 4. Folder Structure Map
```text
src/
├── components/       # Reusable UI (Buttons, Inputs, Modals)
├── context/          # GLOBAL STATE (Crucial logic lives here)
├── layouts/          # MainLayout (Sidebar/Navigation)
├── pages/
│   ├── SalesPage.jsx # MAIN POS INTERFACE (Complex logic)
│   ├── CashPage.jsx  # Daily closing & Financial reports
│   ├── PendingPage.jsx # Open tabs management
│   ├── SettingsPage.jsx # Product/Price CRUD
├── services/         # API calls (Supabase integration)
└── utils/            # formatMoney, date helpers
```

## 5. Coding Conventions for AI
1.  **Mobile First:** Always ensure UI changes look good on a 375px width screen.
2.  **No TypeScripts:** The project uses standard JS. Do not introduce `.ts` files.
3.  **Supabase:** Use `src/supabaseClient.js`. Do not hardcode API keys.
4.  **Context Usage:**
    *   Don't prop-drill if data is global. Use `useProduct()` or `useOrder()`.
    *   When adding new global features, wrap them in a new Context if unrelated to existing ones.
5.  **Performance:**
    *   Lists of products can be long. Ensure rendering is optimized (virtualization or pagination if list grows > 100 items).

## 6. Common Pitfalls
*   **Price Calculation:** Watch out for floating point errors. Use integer math or careful rounding.
*   **Supabase RLS:** If a query fails, check Row Level Security policies in Supabase dashboard (though you can't access it, suggest the user check it).
*   **Z-Index:** Modals often conflict with the bottom navigation bar. Ensure Modals have `z-index: 50+`.

## 7. Commands
*   `npm run dev`: Start local server.
*   `npm run build`: Production build.
