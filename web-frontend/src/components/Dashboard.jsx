import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Doughnut, Bar, Scatter, Line as ReactLine } from 'react-chartjs-2';
import api from '../api';
import styles from './Dashboard.module.css';

// Register ChartJS
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// --- Utilities ---
const calculateCorrelation = (x, y) => {
    const n = x.length;
    if (n === 0) return 0;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    return denominator === 0 ? 0 : numerator / denominator;
};

const getHeatmapColor = (val) => {
    // val is -1 to 1 based on correlation
    // Diverging palette: Blue (neg) -> Slate (neutral) -> Pink (pos)
    if (val > 0) return `rgba(236, 72, 153, ${val})`; // Pink
    return `rgba(59, 130, 246, ${Math.abs(val)})`;    // Blue
};

// --- Main Component ---
const Dashboard = ({ datasetId, onViewHistory }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [correlations, setCorrelations] = useState({});

    useEffect(() => {
        if (!datasetId) return;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const detailRes = await api.getDatasetDetail(datasetId);
                let summaryData = detailRes.data.summary;
                const resultsData = detailRes.data.results || [];
                const countData = detailRes.data.count;

                // Fallback if summary missing
                if (!summaryData) {
                    try {
                        const summaryRes = await api.getDatasetSummary(datasetId);
                        summaryData = summaryRes.data;
                    } catch (e) { summaryData = {}; }
                }

                // Calculate Correlations
                const flow = resultsData.map(r => r.flowrate || 0);
                const press = resultsData.map(r => r.pressure || 0);
                const temp = resultsData.map(r => r.temperature || 0);

                setCorrelations({
                    fp: calculateCorrelation(flow, press),
                    ft: calculateCorrelation(flow, temp),
                    pt: calculateCorrelation(press, temp)
                });

                setData({
                    results: resultsData,
                    count: countData,
                    summary: summaryData || {}
                });

            } catch (err) {
                console.error(err);
                setError("Failed to load dataset.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [datasetId]);

    if (!datasetId) return <div className={styles.empty}>Select a dataset from History</div>;
    if (loading) return <div className={styles.loading}>Processing...</div>;
    if (error) return <div className={styles.error}>{error}</div>;
    if (!data) return null;

    const { summary, results, count } = data;

    // KPI Values
    const countVal = summary.count ?? count ?? "--";
    const formatNum = (n) => n ? Number(n).toFixed(1) : "--";

    // --- CHART CONFIGS (Quantico Style) ---

    // A) Type Composition (Donut)
    const typeDist = summary.type_distribution || {};
    const donutData = {
        labels: Object.keys(typeDist),
        datasets: [{
            data: Object.values(typeDist),
            backgroundColor: [
                '#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#e879f9', '#22d3ee'
            ],
            borderColor: '#0f172a',
            borderWidth: 4,
            cutout: '75%',
            hoverOffset: 12
        }]
    };

    // B) Metric Distributions (Strip Plot + Median Line)
    const makeStripData = (metricKey, color, label) => {
        const vals = results.map(r => r[metricKey] || 0);
        const median = vals.length ? vals.sort((a, b) => a - b)[Math.floor(vals.length / 2)] : 0;

        return {
            datasets: [
                {
                    type: 'scatter',
                    label: 'Data',
                    data: results.map(r => ({ x: r[metricKey] || 0, y: Math.random() * 0.4 + 0.3 })),
                    backgroundColor: color,
                    borderColor: '#0f172a',
                    borderWidth: 1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                },
                {
                    type: 'bar', // Hack for vertical line
                    label: `Median: ${median}`,
                    data: [{ x: median, y: 1 }],
                    backgroundColor: '#fff',
                    barThickness: 2,
                    categoryPercentage: 1,
                    barPercentage: 1
                }
            ]
        };
    };

    const stripOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => `${ctx.raw.x}` } } },
        scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
            y: { display: false, min: 0, max: 1 } // Hide Y axis for strip plot
        }
    };

    // C) Bubble Scatter (Relationship Insight)
    // X=Flow, Y=Pressure, R=Temp/10 (scaled)
    const bubbleData = {
        datasets: [{
            label: 'Equipment Performance',
            data: results.map(r => ({
                x: r.flowrate,
                y: r.pressure,
                r: (r.temperature || 50) / 15, // Scale radius
                rawTemp: r.temperature,
                name: r.equipment_name,
                type: r.type
            })),
            backgroundColor: (ctx) => {
                // Color by Type logic (simple hash or index mapping)
                const types = Object.keys(typeDist);
                const typeIdx = types.indexOf(ctx.raw?.type);
                const colors = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#e879f9', '#22d3ee'];
                return colors[typeIdx % colors.length] || '#ccc';
            },
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            hoverBorderColor: '#fff',
            hoverBorderWidth: 2
        }]
    };

    const bubbleOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: { color: '#94a3b8', boxWidth: 10, font: { size: 10 } }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#fff',
                bodyColor: '#cbd5e1',
                callbacks: {
                    label: (ctx) => {
                        const r = ctx.raw;
                        return `${r.name} (${r.type}): Flow ${r.x}, Press ${r.y}, Temp ${r.rawTemp}°C`;
                    }
                }
            }
        },
        scales: {
            x: {
                title: { display: true, text: 'Flowrate (L/min)', color: '#64748b', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#94a3b8' }
            },
            y: {
                title: { display: true, text: 'Pressure (Bar)', color: '#64748b', font: { size: 10 } },
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#94a3b8' }
            }
        }
    };


    // E) Parallel Coordinates (Normalized comparison)
    // We need to normalize Flow, Press, Temp to 0-1 range to plot on same axis
    const normalize = (val, min, max) => (val - min) / (max - min);

    const minFlow = Math.min(...results.map(r => r.flowrate));
    const maxFlow = Math.max(...results.map(r => r.flowrate));
    const minPress = Math.min(...results.map(r => r.pressure));
    const maxPress = Math.max(...results.map(r => r.pressure));
    const minTemp = Math.min(...results.map(r => r.temperature));
    const maxTemp = Math.max(...results.map(r => r.temperature));

    const parallelData = {
        labels: ['Flowrate', 'Pressure', 'Temperature'],
        datasets: results.map(r => ({
            label: r.equipment_name,
            data: [
                normalize(r.flowrate, minFlow, maxFlow),
                normalize(r.pressure, minPress, maxPress),
                normalize(r.temperature, minTemp, maxTemp)
            ],
            borderColor: donutData.datasets[0].backgroundColor[Object.keys(typeDist).indexOf(r.type) % 6],
            borderWidth: 2,
            tension: 0.1, // Slight curve
            pointRadius: 3,
            pointHoverRadius: 6,
            // Store raw values for tooltip
            rawValues: [r.flowrate, r.pressure, r.temperature]
        }))
    };

    const parallelOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                mode: 'dataset', // Hover line shows all 3 points
                intersect: false,
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                callbacks: {
                    title: (items) => items[0].dataset.label,
                    label: (ctx) => {
                        const raw = ctx.dataset.rawValues[ctx.dataIndex];
                        let unit = '';
                        if (ctx.label === 'Flowrate') unit = 'L/min';
                        if (ctx.label === 'Pressure') unit = 'Bar';
                        if (ctx.label === 'Temperature') unit = '°C';
                        return `${ctx.label}: ${raw} ${unit}`;
                    }
                }
            }
        },
        scales: {
            y: { display: false, min: -0.1, max: 1.1 }, // Hidden normalized axis
            x: {
                grid: { color: 'rgba(255,255,255,0.1)' },
                ticks: { color: '#94a3b8', font: { weight: 'bold' } }
            }
        }
    };

    // D) Top 5 Performers (Lollipop Style)
    const sorted = [...results].sort((a, b) => (b.flowrate || 0) - (a.flowrate || 0)).slice(0, 5);
    const topBarData = {
        labels: sorted.map(r => r.equipment_name),
        datasets: [{
            label: 'Flowrate',
            data: sorted.map(r => r.flowrate),
            backgroundColor: (ctx) => {
                const idx = ctx.dataIndex;
                if (idx === 0) {
                    const c = ctx.chart.ctx;
                    const g = c.createLinearGradient(0, 0, 300, 0);
                    g.addColorStop(0, '#ec4899'); g.addColorStop(1, '#8b5cf6');
                    return g;
                }
                return '#475569';
            },
            borderRadius: 10,
            barThickness: 6, // Very thin for Lollipop stick
            hoverBorderWidth: 0,
        }]
    };

    return (
        <div className={styles.dashboard}>
            {/* HEADER */}
            <div className={styles.header}>
                <div>
                    <h2>CHEMICAL VIZ <span className={styles.proBadge}>PRO</span></h2>
                    <span className={styles.subtext}>ID: {datasetId} • {countVal} UNITS</span>
                </div>
                <button className={styles.secondaryBtn} onClick={onViewHistory}>HISTORY</button>
            </div>

            {/* KPI ROW */}
            <StatCard label="Total Units" value={countVal} color="#38bdf8" />
            <StatCard label="Avg Flow" value={formatNum(summary.avg_flowrate)} unit="L/min" color="#38bdf8" />
            <StatCard label="Avg Press" value={formatNum(summary.avg_pressure)} unit="Bar" color="#f43f5e" />
            <StatCard label="Avg Temp" value={formatNum(summary.avg_temperature)} unit="°C" color="#fbbf24" />

            {/* ROW 1: BUBBLE (2) | TOP (1) | DONUT (1) */}
            <div className={styles.chartBubble}>
                <div className={styles.chartTitle}>PERFORMANCE CLUSTERS</div>
                <div className={styles.chartWrapper}>
                    <Scatter data={bubbleData} options={bubbleOptions} />
                </div>
            </div>

            <div className={styles.chartTop}>
                <div className={styles.chartTitle}>TOP FLOWRATE</div>
                <div className={styles.chartWrapper}>
                    <Bar data={topBarData} options={{ ...bubbleOptions, indexAxis: 'y', scales: { x: { display: false }, y: { ticks: { color: '#cbd5e1' }, grid: { display: false } } } }} />
                </div>
            </div>

            <div className={styles.chartType}>
                <div className={styles.chartTitle}>COMPOSITION</div>
                <div className={styles.relativeWrapper}>
                    <div className={styles.donutCenter}>
                        <span>{countVal}</span>
                    </div>
                    <Doughnut data={donutData} options={{ cutout: '70%', plugins: { legend: { display: false } } }} />
                </div>
            </div>

            {/* ROW 2: PARALLEL COORDINATES (Replaces Matrix/Dist) */}
            <div className={styles.chartParallel}>
                <div className={styles.chartTitle}>MULTIVARIATE ANALYSIS (PARALLEL COORDINATES)</div>
                <div className={styles.chartWrapper}>
                    {/* Reusing Line chart for Parallel Coords behavior */}
                    <ReactLine data={parallelData} options={parallelOptions} />
                </div>
            </div>

            {/* ROW 3: SMART TABLE */}
            <div className={styles.smartTable}>
                <div className={styles.chartTitle}>EQUIPMENT DETAILS (SMART FILTER)</div>
                <div className={styles.tableWrapper}>
                    <table>
                        <thead>
                            <tr>
                                <th>Equipment</th>
                                <th>Type</th>
                                <th>Flowrate</th>
                                <th>Pressure</th>
                                <th>Temp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {results.map((r, i) => (
                                <tr key={i} className={i < 3 ? styles.topRow : ''}>
                                    <td>{r.equipment_name}</td>
                                    <td>
                                        <span className={styles.typeTag} style={{
                                            borderColor: donutData.datasets[0].backgroundColor[Object.keys(typeDist).indexOf(r.type) % 6],
                                            color: donutData.datasets[0].backgroundColor[Object.keys(typeDist).indexOf(r.type) % 6]
                                        }}>
                                            {r.type}
                                        </span>
                                    </td>
                                    <td className={r.flowrate > summary.avg_flowrate ? styles.highVal : ''}>{r.flowrate}</td>
                                    <td className={r.pressure > summary.avg_pressure ? styles.highVal : ''}>{r.pressure}</td>
                                    <td className={r.temperature > summary.avg_temperature ? styles.highVal : ''}>{r.temperature}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

const StatCard = ({ label, value, unit, color }) => (
    <div className={styles.statCard} style={{ borderLeft: `4px solid ${color}` }}>
        <div className={styles.statInfo}>
            <span className={styles.statLabel}>{label}</span>
        </div>
        <div className={styles.statRight}>
            <span className={styles.val} style={{ color }}>{value}</span>
            <small>{unit}</small>
        </div>
    </div>
);

export default Dashboard;
