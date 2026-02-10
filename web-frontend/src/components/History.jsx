import React, { useEffect, useState } from 'react';
import { api } from '../api';
import styles from './History.module.css';

const History = ({ onLoad, onNavigateToUpload }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    // Helper: Relative Time
    const timeAgo = (dateStr) => {
        const date = new Date(dateStr);
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hrs ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " mins ago";
        return Math.floor(seconds) + " sec ago";
    };

    const fetchHistory = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        setError(null);
        try {
            const response = await api.getHistory();
            const data = response.data;
            let items = [];
            let count = 0;

            if (data.results && Array.isArray(data.results)) {
                items = data.results;
                count = data.count || items.length;
            } else if (Array.isArray(data)) {
                items = data;
                count = items.length;
            } else {
                throw new Error("Invalid history format");
            }

            setHistory(items);
            setTotalCount(count);
        } catch (err) {
            console.error(err);
            setError("Failed to retrieve history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDownloadPdf = async (e, id) => {
        e.stopPropagation();
        try {
            const response = await api.getDatasetReport(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `report_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (error) {
            alert("Report generation failed.");
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const LoadingSpinner = () => (
        <div className={styles.spinnerIcon}></div>
    );

    if (loading && !refreshing) return (
        <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Retrieving Records...</p>
        </div>
    );

    if (error) {
        return (
            <div className={styles.errorPanel}>
                <div className={styles.errorIcon}>⚠️</div>
                <p>{error}</p>
                <button onClick={() => fetchHistory()} className={styles.retryBtn}>RETRY CONNECTION</button>
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📂</div>
                <h3>No History Found</h3>
                <p>Upload a dataset to generate your first analysis.</p>
                <button onClick={onNavigateToUpload} className={styles.primaryBtn}>
                    UPLOAD NOW
                </button>
            </div>
        );
    }

    return (
        <div className={styles.historyContainer}>
            <div className={styles.header}>
                <div className={styles.titleGroup}>
                    <h2>CHEMICAL VIZ <span className={styles.sectionTitle}>HISTORY</span></h2>
                    <span className={styles.countBadge}>
                        Showing {history.length} of {totalCount}
                    </span>
                </div>
                <button
                    onClick={() => fetchHistory(true)}
                    className={styles.refreshBtn}
                    disabled={refreshing}
                >
                    {refreshing ? <LoadingSpinner /> : 'REFRESH LIST'}
                </button>
            </div>

            <div className={styles.grid}>
                {history.map(item => (
                    <div key={item.id} className={styles.card} onClick={() => onLoad(item.id)}>
                        <div className={styles.cardStatus} />

                        <div className={styles.cardHeader}>
                            <span className={styles.fileId}>ID: {String(item.id).slice(0, 8)}</span>
                            <span className={styles.dateBadge} title={new Date(item.upload_timestamp).toLocaleString()}>
                                {timeAgo(item.upload_timestamp)}
                            </span>
                        </div>

                        <div className={styles.cardBody}>
                            <h3 title={item.filename}>{item.filename}</h3>
                            <div className={styles.statsRow}>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>RECORDS</span>
                                    <span className={styles.statValue}>{item.summary_stats?.count || item.record_count || '--'}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statLabel}>STATUS</span>
                                    <span className={styles.statValue} style={{ color: '#4ade80' }}>READY</span>
                                </div>
                            </div>
                        </div>

                        <div className={styles.cardFooter}>
                            <button
                                className={styles.viewBtn}
                                onClick={(e) => { e.stopPropagation(); onLoad(item.id); }}
                            >
                                OPEN DASHBOARD
                            </button>
                            <button
                                className={styles.pdfBtn}
                                onClick={(e) => handleDownloadPdf(e, item.id)}
                                title="Download PDF Report"
                            >
                                ↓ PDF
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default History;
