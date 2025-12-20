# Resumen Técnico del Proyecto: Liquor Store Web App (POS)
> **Fecha de Actualización:** 18 de Diciembre, 2025
> **Estado:** Desarrollo Activo - Módulo de Ventas (Fase Frontend)

## 1. Descripción General
Aplicación web para la gestión de ventas y puntos de venta (POS) para una licorería. El enfoque actual está en un diseño **Premium UI/UX**, optimizado para dispositivos móviles (Mobile-First) pero funcional en escritorio.

## 2. Tecnologías
*   **Frontend:** React + Vite
*   **Estilos:** CSS Plano (Variables CSS para consistencia de tema) + Lucide Icons
*   **Navegación:** React Router DOM
*   **Tipografía:** Poppins (Google Fonts)

## 3. Estado Actual: Módulo de Ventas ("Vender")
Se ha completado la refactorización de la interfaz de ventas `SalesPage.jsx` con las siguientes características:

### Flujo de Venta (Acordeón)
1.  **Modo de Consumo:** Selección visual grande (Local vs Para Llevar).
2.  **Forma de Emisión:** Unidad, Combo, Caja, Libre (con Toggle para Botella/Lata).
3.  **Tipo de Cerveza:** Selección de producto (con Toggle para Normal/Variado).

### Ticket de Venta (Resumen)
*   Diseño estilo "Ticket de Compra" con sombras suaves y bordes redondeados (`var(--radius-lg)`).
*   **Lógica de Creación:**
    *   Al hacer clic en "Crear Ticket", se despliega un formulario.
    *   **Campos:**
        *   `Ticket #`: Generado automáticamente + Fecha/Hora (Formato Venezuela). [Estilo: Poppins Medium Italic].
        *   `Cliente`: Input grande con borde sólido, ícono de usuario externo.
    *   **Confirmación:** Botón negro ("Confirmar Pedido") que abre un **Modal de Éxito**.
    *   **Modal:** Muestra confirmación y ofrece enlace directo a la sección "Pendientes".

## 4. Estructura de Archivos Clave
*   `src/pages/SalesPage.jsx`: Lógica principal de ventas, estados del acordeón y modal.
*   `src/pages/SalesPage.css`: Estilos específicos (y override de estilos globales) para el ticket y el formulario.
*   `src/components/AccordionSection.jsx`: Componente reutilizable para las secciones desplegables.
*   `src/layouts/MainLayout.css`: Ajustes de la barra de navegación inferior (fija en móvil).

## 5. Tareas Pendientes (Next Steps)
1.  **Módulo "Pendientes" (`PendingPage.jsx`):**
    *   Implementar la lógica para recibir los pedidos creados en Ventas.
    *   Gestionar el stock de pedidos "Variados".
2.  **Gestión de Inventario:** Conectar el frontend con una base de datos real o estado global persistente.
3.  **Impresión:** Integrar funcionalidad para imprimir el ticket físicamente (navegador o térmica).

## 6. Cómo Ejecutar
El código fuente se encuentra en la carpeta del proyecto.
1.  Abrir terminal en la carpeta raíz.
2.  Ejecutar:
    ```bash
    npm run dev
    ```
3.  Abrir navegador en la URL local (ej. `http://localhost:5173`).
