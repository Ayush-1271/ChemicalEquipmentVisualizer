import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import Upload from './components/Upload';
import History from './components/History';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import UserManagement from './components/UserManagement';
import styles from './App.module.css';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [view, setView] = useState('upload'); // 'upload', 'history', 'dashboard', 'users'
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('isAdmin');
    }
  }, [token]);

  const handleLogin = (newToken, isStaff) => {
    setToken(newToken);
    setIsAdmin(isStaff);
    localStorage.setItem('isAdmin', isStaff);
    setView('upload');
  };

  const handleLogout = () => {
    setToken(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setView('upload');
    setSelectedDatasetId(null);
  };

  const handleUploadSuccess = (id) => {
    setSelectedDatasetId(id);
    setView('dashboard');
  };

  const handleViewDashboard = (id) => {
    setSelectedDatasetId(id);
    setView('dashboard');
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className={styles.appLayout}>
      <Sidebar
        view={view}
        setView={setView}
        onLogout={handleLogout}
        isAdmin={isAdmin}
      />
      <main className={styles.mainContent}>
        {view === 'upload' && <Upload onUploadSuccess={handleUploadSuccess} />}
        {view === 'history' && <History onLoad={handleViewDashboard} onNavigateToUpload={() => setView('upload')} />}
        {view === 'dashboard' && <Dashboard datasetId={selectedDatasetId} onViewHistory={() => setView('history')} />}
        {view === 'users' && <UserManagement />}
      </main>
    </div>
  );
};

export default App;
