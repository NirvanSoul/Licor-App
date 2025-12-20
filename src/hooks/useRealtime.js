import { useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook to subscribe to Supabase Realtime changes for a specific table.
 * 
 * @param {string} organizationId - The organization ID to filter events by.
 * @param {string} table - The table name (e.g., 'sales', 'inventory').
 * @param {function} onChange - Callback function triggered on data change. Receives the payload.
 */
export const useRealtime = (organizationId, table, onChange) => {
    // Use a ref to store the latest callback so we don't need to re-subscribe when it changes
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        if (!organizationId) return;

        const channel = supabase
            .channel(`realtime:${table}:${organizationId}`)
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen to INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: table,
                    filter: `organization_id=eq.${organizationId}`,
                },
                (payload) => {
                    console.log(`Realtime change in ${table}:`, payload);
                    if (onChangeRef.current) onChangeRef.current(payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Subscribed to ${table} changes for org ${organizationId}`);
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
    }, [organizationId, table]); // Removed onChange from dependencies
};

/**
 * Example usage for Sales and Inventory:
 * 
 * const handleInventoryChange = (payload) => {
 *   // Update your local state or refetch data
 *   // if (payload.eventType === 'INSERT') { ... }
 *   // if (payload.eventType === 'UPDATE') { ... }
 *   refreshInventory();
 * };
 * 
 * useRealtime(organizationId, 'inventory', handleInventoryChange);
 * useRealtime(organizationId, 'sales', handleSalesChange);
 */
