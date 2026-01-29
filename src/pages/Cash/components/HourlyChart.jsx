import React from 'react';

export default function HourlyChart({ dailyHourlyStats }) {
    const { hourlyData, maxHourVal, peakHour, totalSales } = dailyHourlyStats;
    const anchorHours = [0, 6, 12, 18];

    return (
        <div className="daily-hourly-chart-container" style={{ width: '100%', marginTop: '1rem' }}>
            {/* Bars Container */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                height: '140px',
                padding: '0 4px',
                borderBottom: '1px solid rgba(128, 128, 128, 0.2)'
            }}>
                {hourlyData.map((val, hour) => {
                    const h = (val / (maxHourVal || 1)) * 100;
                    const isPeak = hour === peakHour && val > 0;
                    const hasSales = val > 0;
                    const isRelevant = hasSales || anchorHours.includes(hour);
                    const barWidth = isRelevant ? '4%' : '2%';
                    const opacity = hasSales ? 1 : 0.3;

                    return (
                        <div key={hour} style={{
                            height: '100%',
                            width: barWidth,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <div
                                style={{
                                    width: hasSales ? '80%' : '40%',
                                    height: `${Math.max(h, 4)}%`,
                                    background: isPeak ? '#fb923c' : 'rgba(128, 128, 128, 0.4)',
                                    borderRadius: '4px 4px 0 0',
                                    opacity: opacity,
                                    transition: 'all 0.3s ease',
                                    boxShadow: isPeak ? '0 0 12px rgba(251, 146, 60, 0.4)' : 'none',
                                }}
                                title={`${hour}:00 - $${val.toFixed(2)}`}
                            />
                        </div>
                    );
                })}
            </div>

            {/* Labels Container */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 4px 0' }}>
                {hourlyData.map((_, hour) => {
                    const isAnchor = anchorHours.includes(hour);
                    const isPeak = hour === peakHour && totalSales > 0;
                    const showLabel = isAnchor || isPeak;

                    if (!showLabel) return <div key={hour} style={{ flex: 1 }} />;

                    let labelText = '';
                    if (hour === 0) labelText = '12AM';
                    else if (hour === 12) labelText = '12PM';
                    else if (hour === peakHour) labelText = `${hour}h`;
                    else labelText = `${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`;

                    return (
                        <div key={hour} style={{
                            flex: 1,
                            textAlign: 'center',
                            fontSize: '0.62rem',
                            fontWeight: isPeak ? '800' : '600',
                            color: isPeak ? '#fb923c' : 'rgba(128, 128, 128, 0.8)'
                        }}>
                            {labelText}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
