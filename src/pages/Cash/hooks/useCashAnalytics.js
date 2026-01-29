import { useMemo } from 'react';

export function useCashAnalytics({ pendingOrders, getPrice, getUnitsPerEmission, inventory, beerTypes, subtypes, getCostPrice, getInventoryAssetValue, currencySymbol }) {

    // Helper to calculate total for an order (safe fallback)
    const getOrderTotal = (items) => {
        if (!Array.isArray(items)) return 0;
        return items.reduce((acc, item) => {
            if (!item) return acc;
            const p = item.price || (getPrice ? getPrice(item.beerType || item.name, item.emission, item.subtype, 'local') : 0);
            return acc + (p * (item.quantity || 1));
        }, 0);
    };

    const analytics = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const sales = [];
        let totalSales = 0;
        let closedCount = 0;
        let openCount = 0;

        const methodCounts = { 'Efectivo': 0, 'Pago Móvil': 0, 'Punto': 0, 'Bio Pago': 0 };
        const productCounts = {};

        if (Array.isArray(pendingOrders)) {
            pendingOrders.forEach(order => {
                if (!order) return;
                if (order.status === 'OPEN') {
                    openCount++;
                } else if (order.status === 'PAID') {
                    const closedDate = new Date(order.closedAt || order.createdAt);
                    closedDate.setHours(0, 0, 0, 0);

                    // Consider sales from last 60 days for recent checking, but we mainly focus on today/week
                    const isRecent = closedDate.getTime() >= (today.getTime() - 60 * 24 * 60 * 60 * 1000);

                    if (isRecent) {
                        const total = (order.totalAmountUsd !== undefined && order.totalAmountUsd !== null)
                            ? Number(order.totalAmountUsd)
                            : getOrderTotal(order.items);

                        sales.push({ ...order, total });

                        const isToday = closedDate.getTime() === today.getTime();
                        if (isToday) {
                            totalSales += total;
                            closedCount++;

                            let method = order.paymentMethod || 'Efectivo';
                            // Normalize methods
                            if (method === 'Pago Movil') method = 'Pago Móvil';
                            if (method === 'BioPago') method = 'Bio Pago';
                            if (!['Efectivo', 'Pago Móvil', 'Bio Pago', 'Punto'].includes(method)) {
                                method = 'Punto'; // Fallback
                            }

                            if (methodCounts.hasOwnProperty(method)) {
                                methodCounts[method] += total;
                            } else {
                                methodCounts['Punto'] += total;
                            }
                        }

                        // Product Stats (Global for the accessed period? Or just Today? 
                        // The original code aggregated ALL recent sales for product stats in `productCounts`.
                        (order.items || []).forEach(item => {
                            if (!item) return;
                            const name = item.beerType || item.name || 'Desconocido';
                            const emission = item.emission || 'Unidad';
                            const subtype = item.subtype || 'Botella';

                            const unitsPerPack = getUnitsPerEmission ? (getUnitsPerEmission(emission, subtype) || 1) : 1;
                            const totalUnits = (item.quantity || 1) * unitsPerPack;

                            const rankKey = subtype !== 'Botella' ? `${name} (${subtype})` : name;
                            if (!productCounts[rankKey]) productCounts[rankKey] = 0;
                            productCounts[rankKey] += totalUnits;
                        });
                    }
                }
            });
        }

        // Top Products
        const sortedProducts = Object.entries(productCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, count]) => ({ name, count }));

        // Low Stock Alerts
        const alerts = [];
        if (inventory && beerTypes && subtypes) {
            beerTypes.forEach(beer => {
                subtypes.forEach(sub => {
                    const key = `${beer}_${sub}`;
                    const qty = inventory[key] || 0;
                    const unitsPerBox = getUnitsPerEmission('Caja', sub) || 36;
                    const threshold = 5 * unitsPerBox;

                    if (qty <= threshold) {
                        alerts.push({ name: beer, subtype: sub, qty, boxes: qty / unitsPerBox });
                    }
                });
            });
        }

        sales.sort((a, b) => new Date(b.closedAt) - new Date(a.closedAt));

        // Weekly Logic
        const getWeeklyStats = () => {
            const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
            const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

            const getWeekData = (offset) => {
                const targetMonday = new Date();
                const targetDayNum = targetMonday.getDay() || 7;
                targetMonday.setDate(targetMonday.getDate() - (targetDayNum - 1) - (offset * 7));
                targetMonday.setHours(0, 0, 0, 0);

                const weekTotalData = Array(7).fill(0);
                const mondayTime = targetMonday.getTime();
                const sundayTime = mondayTime + (7 * 24 * 60 * 60 * 1000);

                (pendingOrders || []).forEach(o => {
                    if (o?.status === 'PAID') {
                        const d = new Date(o.closedAt || o.createdAt);
                        const t = d.getTime();
                        if (t >= mondayTime && t < sundayTime) {
                            const dIdx = d.getDay();
                            const cIdx = dIdx === 0 ? 6 : dIdx - 1;
                            const val = (o.totalAmountUsd !== undefined && o.totalAmountUsd !== null)
                                ? Number(o.totalAmountUsd)
                                : getOrderTotal(o.items || []);
                            if (weekTotalData[cIdx] !== undefined) {
                                weekTotalData[cIdx] += val;
                            }
                        }
                    }
                });

                return {
                    data: weekTotalData,
                    total: weekTotalData.reduce((a, b) => a + b, 0),
                    max: Math.max(...weekTotalData, 0),
                    start: targetMonday,
                    end: new Date(mondayTime + (6 * 24 * 60 * 60 * 1000))
                };
            };

            const currentWeek = getWeekData(0);

            // Historical Weeks (Last 4)
            const getHistoricalWeeks = () => {
                const weeks = {};
                (pendingOrders || []).forEach(o => {
                    if (o?.status === 'PAID') {
                        const d = new Date(o.closedAt || o.createdAt);
                        const day = d.getDay() || 7;
                        const mondayDate = new Date(d);
                        if (day !== 1) mondayDate.setDate(d.getDate() - (day - 1));
                        mondayDate.setHours(0, 0, 0, 0);
                        const key = mondayDate.getTime();

                        const val = (o.totalAmountUsd !== undefined && o.totalAmountUsd !== null)
                            ? Number(o.totalAmountUsd)
                            : getOrderTotal(o.items || []);
                        weeks[key] = (weeks[key] || 0) + val;
                    }
                });

                const currentNow = new Date();
                const currentDayNum = currentNow.getDay() || 7;
                const currentMonday = new Date(currentNow);
                currentMonday.setHours(0, 0, 0, 0);
                currentMonday.setDate(currentNow.getDate() - (currentDayNum - 1));

                const histResult = [];
                for (let i = 0; i < 4; i++) {
                    const loopMonday = new Date(currentMonday);
                    loopMonday.setDate(currentMonday.getDate() - (i * 7));
                    const timestamp = loopMonday.getTime();
                    const total = weeks[timestamp] || 0;
                    histResult.push({
                        label: i === 0 ? 'Esta Semana' : i === 1 ? 'Semana Pasada' : `Hace ${i} semanas`,
                        total,
                        date: loopMonday.toLocaleDateString()
                    });
                }
                return histResult.reverse();
            };

            return {
                data: currentWeek.data,
                total: currentWeek.total,
                labels: days,
                maxVal: currentWeek.max || 1,
                currentDayIndex,
                getWeekData,
                historicalWeeks: getHistoricalWeeks()
            };
        };

        const weeklyStats = getWeeklyStats();

        // Profit Stats
        const getProfitStats = () => {
            const inventoryValue = getInventoryAssetValue ? getInventoryAssetValue() : 0;
            const currentWeekMilis = weeklyStats.data.reduce((a, b) => a + b, 0);

            let weekCOGS = 0;
            const debugLog = []; // DEBUG

            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now.setDate(diff));
            monday.setHours(0, 0, 0, 0);

            (pendingOrders || []).forEach(o => {
                if (o.status === 'PAID') {
                    const d = new Date(o.closedAt || o.createdAt);
                    if (d >= monday) {
                        (o.items || []).forEach(item => {
                            if (!item) return;

                            // Robust property access
                            const name = item.beerType || item.product_name || item.name;
                            const emission = item.emission || 'Unidad';
                            const subtype = item.subtype || 'Botella';
                            const qty = Number(item.quantity) || 1;

                            if (!name) return;

                            // Handle Variado items
                            if (name === 'Variado' && item.composition) {
                                Object.entries(item.composition).forEach(([subBeer, units]) => {
                                    const costPerUnit = getCostPrice(subBeer, 'Unidad', subtype);
                                    weekCOGS += (costPerUnit * units * qty);
                                });
                            } else if (name !== 'Variado') {
                                const cost = getCostPrice(name, emission, subtype);
                                weekCOGS += (cost * qty);

                                // DEBUG: Keep track of zero costs to identify issues
                                if (cost === 0) {
                                    console.warn(`[ProfitStats] Zero Cost found for: ${name} ${emission} ${subtype}`);
                                }

                                debugLog.push({
                                    item: `${name} ${emission} ${subtype}`,
                                    qty,
                                    costPerUnit: cost,
                                    totalCost: cost * qty
                                });
                            }
                        });
                    }
                }
            });

            // DEBUGLOG in return
            const weekNet = currentWeekMilis - weekCOGS;
            const weekMargin = currentWeekMilis > 0 ? ((weekNet / currentWeekMilis) * 100) : 0;

            return {
                inventoryValue,
                weekRevenue: currentWeekMilis,
                weekCOGS,
                weekNet,
                weekMargin,
                debugLog
            };
        };


        return {
            todayStats: { totalSales, closedCount, openCount, avgTicket: closedCount ? totalSales / closedCount : 0 },
            todaysSales: sales, // Contains all recent sales for listing
            paymentMethods: methodCounts,
            topProducts: sortedProducts,
            lowStockConnect: alerts.slice(0, 5),
            weeklyStats,
            profitStats: getProfitStats(),
            getOrderTotal
        };

    }, [pendingOrders, getPrice, inventory, beerTypes, subtypes, getUnitsPerEmission, getCostPrice, getInventoryAssetValue, currencySymbol]);

    return analytics;
}
