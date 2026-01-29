/**
 * Cliente para obtener las tasas de cambio del BCV
 * Usa la API de bcvscrapper para obtener los valores actualizados de USD y EUR
 */

const BCV_API_URL = 'https://bcvscrapper.vercel.app/api/bcv';

/**
 * Obtiene las tasas de cambio actuales desde la API de BCV Scrapper
 * @returns {Promise<{data: {usd: number, eur: number, date: string, source: string} | null, error: any}>}
 */
export const fetchCurrentRates = async () => {
    try {
        const response = await fetch(BCV_API_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const error = `HTTP error! status: ${response.status}`;
            console.error('[Rates Client] Error fetching rates:', error);
            return { data: null, error };
        }

        const apiData = await response.json();

        if (!apiData.success) {
            console.error('[Rates Client] API returned unsuccessful response:', apiData);
            return { data: null, error: 'API returned unsuccessful response' };
        }

        // Formatear respuesta para mantener compatibilidad con el código existente
        const rates = {
            usd: Number(apiData.usd) || 0,
            eur: Number(apiData.eur) || 0,
            date: apiData.date || new Date().toISOString().split('T')[0],
            source: apiData.source || 'bcv-scraper',
            fetchedAt: apiData.fetchedAt
        };

        console.log('[Rates Client] Successfully fetched rates:', rates);
        return { data: rates, error: null };
    } catch (err) {
        console.error('[Rates Client] Unexpected error:', err);
        return { data: null, error: err.message || 'Unknown error' };
    }
};

// Exportar una función legacy para compatibilidad (no se usa pero por si acaso)
export const ratesClient = {
    from: () => ({
        select: () => ({
            order: () => ({
                limit: () => ({
                    single: fetchCurrentRates
                })
            })
        })
    })
};
