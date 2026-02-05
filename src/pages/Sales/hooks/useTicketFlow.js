/**
 * useTicketFlow Hook
 * Manages ticket creation flow and payment information
 */

import { useState, useEffect } from 'react';
import { TICKET_STEPS } from '../constants/salesConstants';

export function useTicketFlow() {
    const [ticketStep, setTicketStep] = useState(TICKET_STEPS.EDITING);
    const [customerName, setCustomerName] = useState('');
    const [paymentMethod, setPaymentMethod] = useState(null);
    const [paymentReference, setPaymentReference] = useState('');
    const [ticketNumber, setTicketNumber] = useState(null);
    const [ticketDate, setTicketDate] = useState('');

    /**
     * Auto-scroll to inputs when step changes (Keyboard fix)
     */
    useEffect(() => {
        if (ticketStep === TICKET_STEPS.PAYMENT) {
            setTimeout(() => {
                const input = document.querySelector('.ticket-input-large');
                if (input) {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 400);
        }
    }, [ticketStep]);

    /**
     * Initialize ticket creation
     */
    const initializeTicket = () => {
        setTicketNumber(Math.floor(1000 + Math.random() * 9000));
        const now = new Date();
        setTicketDate(new Intl.DateTimeFormat('es-VE', {
            timeZone: 'America/Caracas',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(now));
        setTicketStep(TICKET_STEPS.PAYMENT);
    };

    /**
     * Reset ticket flow
     */
    const resetTicketFlow = () => {
        setTicketStep(TICKET_STEPS.EDITING);
        setCustomerName('');
        setPaymentMethod(null);
        setPaymentReference('');
        setTicketNumber(null);
        setTicketDate('');
    };

    /**
     * Get button text based on current step and cart contents
     */
    const getButtonText = (cartItems) => {
        if (ticketStep === TICKET_STEPS.PAYMENT) {
            const hasTakeAway = cartItems.some(i => i.consumptionMode === 'Para Llevar');
            return hasTakeAway ? 'Pagar y Crear' : 'Abrir Ticket';
        }
        return 'Continuar';
    };

    /**
     * Validate payment information
     */
    const validatePayment = (cartItems) => {
        const hasTakeAway = cartItems.some(i => i.consumptionMode === 'Para Llevar');

        if (ticketStep === TICKET_STEPS.PAYMENT && hasTakeAway) {
            if (!paymentMethod) {
                return { valid: false, message: "Selecciona método de pago para procesar la orden." };
            }
            if (paymentMethod === 'Pago Móvil' && !paymentReference.trim()) {
                return { valid: false, message: "Ingresa referencia." };
            }
        }

        return { valid: true };
    };

    return {
        ticketStep,
        setTicketStep,
        customerName,
        setCustomerName,
        paymentMethod,
        setPaymentMethod,
        paymentReference,
        setPaymentReference,
        ticketNumber,
        ticketDate,
        initializeTicket,
        resetTicketFlow,
        getButtonText,
        validatePayment
    };
}
