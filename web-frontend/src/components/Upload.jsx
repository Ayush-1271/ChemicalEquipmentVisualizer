import React, { useState, useCallback } from 'react';
import { api } from '../api';
import styles from './Upload.module.css';

const Upload = ({ onUploadSuccess }) => {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);
    const [fileName, setFileName] = useState(null);

    const handleDragEnter = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        setError(null);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            await processFile(e.dataTransfer.files[0]);
        }
    }, []);

    const handleFileSelect = async (e) => {
        if (e.target.files && e.target.files.length > 0) {
            await processFile(e.target.files[0]);
        }
    };

    const processFile = async (file) => {
        if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
            setError("INVALID FILE FORMAT. PLEASE UPLOAD .CSV");
            return;
        }

        setFileName(file.name);
        setUploading(true);
        setSuccessMsg(null);
        setError(null);

        try {
            // Simulated progress for UX feels
            await new Promise(r => setTimeout(r, 800));

            const response = await api.uploadDataset(file);
            const data = response.data;
            const id = data.id || data.results?.id;

            setSuccessMsg("DATASET INGESTED SUCCESSFULLY");
            setTimeout(() => {
                onUploadSuccess(id);
            }, 1200);

        } catch (err) {
            console.error(err);
            setError("UPLOAD FAILED. CHECK CONNECTION OR FILE FORMAT.");
            setUploading(false);
            setFileName(null);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.uploadCard}>
                <div className={styles.header}>
                    <h2>Data Ingestion</h2>
                    <span className={styles.version}>V 2.0</span>
                </div>

                <div
                    className={`${styles.dropZone} ${dragging ? styles.active : ''} ${error ? styles.errorState : ''}`}
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    {uploading ? (
                        <div className={styles.statusContent}>
                            <div className={styles.loader}></div>
                            <span className={styles.statusText}>ANALYZING DATA STRUCTURE...</span>
                            <span className={styles.filename}>{fileName}</span>
                        </div>
                    ) : successMsg ? (
                        <div className={styles.statusContent}>
                            <div className={styles.successIcon}>✓</div>
                            <span className={styles.statusText}>{successMsg}</span>
                        </div>
                    ) : (
                        <div className={styles.idleContent}>
                            <div className={styles.iconWrapper}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <h3>DROP DATASET HERE</h3>
                            <p>Or select a local CSV file</p>

                            <label className={styles.browseBtn}>
                                BROWSE FILES
                                <input type="file" accept=".csv" onChange={handleFileSelect} hidden />
                            </label>
                        </div>
                    )}
                </div>

                {error && <div className={styles.errorBanner}>{error}</div>}

                <div className={styles.schemaInfo}>
                    <h4>REQUIRED SCHEMA CONFIGURATION</h4>
                    <div className={styles.schemaCode}>
                        Equipment Name, Type, Flowrate, Pressure, Temperature
                    </div>
                    <p className={styles.note}>Ensure headers match exactly. Numerical values required for usage metrics.</p>
                </div>
            </div>
        </div>
    );
};

export default Upload;
