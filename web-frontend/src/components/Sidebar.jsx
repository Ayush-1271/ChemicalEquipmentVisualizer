import React from 'react';
import styles from './Sidebar.module.css';

const Sidebar = ({ view, setView, onLogout, isAdmin }) => {
    return (
        <aside className={styles.container}>
            <div className={styles.logoArea}>
                <div className={styles.logoBadge}>Q</div>
            </div>

            <nav className={styles.navGroup}>
                <NavItem
                    active={view === 'dashboard'}
                    onClick={() => setView('dashboard')}
                    icon={<DashboardIcon />}
                    label="Dashboard"
                />
                <NavItem
                    active={view === 'upload'}
                    onClick={() => setView('upload')}
                    icon={<UploadIcon />}
                    label="Ingest Data"
                />
                <NavItem
                    active={view === 'history'}
                    onClick={() => setView('history')}
                    icon={<HistoryIcon />}
                    label="History"
                />
            </nav>

            <div className={styles.footerGroup}>
                <button className={styles.logoutBtn} onClick={onLogout} title="Sign Out">
                    <span className={styles.iconWrapper}><LogoutIcon /></span>
                </button>
            </div>
        </aside>
    );
};

const NavItem = ({ active, onClick, icon, label }) => (
    <button
        className={`${styles.navItem} ${active ? styles.active : ''}`}
        onClick={onClick}
        title={label}
    >
        <span className={styles.iconWrapper}>{icon}</span>
        {active && <div className={styles.activeIndicator} />}
    </button>
);

// --- Icons (Lucide-style SVGs) ---

const DashboardIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" />
        <rect x="14" y="3" width="7" height="5" />
        <rect x="14" y="12" width="7" height="9" />
        <rect x="3" y="16" width="7" height="5" />
    </svg>
);

const UploadIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

const HistoryIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v5h5" />
        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
        <path d="M12 7v5l4 2" />
    </svg>
);

const UsersIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const LogoutIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export default Sidebar;
