/**
 * Sales System Constants
 * Centralized configuration for the sales module
 */

export const PAYMENT_METHODS = ['Efectivo', 'Pago Móvil', 'Punto', 'Bio Pago'];

export const CONSUMPTION_MODES = {
    LOCAL: 'Local',
    TAKEAWAY: 'Para Llevar'
};

export const BEER_VARIETIES = {
    NORMAL: 'Normal',
    VARIADO: 'Variado'
};

export const TICKET_STEPS = {
    EDITING: 0,
    CONFIRMING: 1,
    PAYMENT: 2
};

export const DEFAULT_ORDER_STATE = {
    consumptionMode: null,
    emission: null,
    subtype: 'Botella',
    beerVariety: 'Normal',
    beerType: null,
    quantity: 1
};
