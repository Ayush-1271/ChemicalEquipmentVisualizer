import React, { useEffect, useState } from 'react';
import { api } from '../api';
import styles from './UserManagement.module.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // ... (rest of imports)

    const [showPassword, setShowPassword] = useState(false);

    // Reset Password State
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUserId, setResetUserId] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // ... (existing code)

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setFormError(null);
        if (!newPassword) return;

        setSubmitting(true);
        try {
            console.log("Attempting to reset password for user:", resetUserId);
            await api.updateUser(resetUserId, { password: newPassword });
            console.log("Password updated successfully for user:", resetUserId);
            setShowResetModal(false);
            setResetUserId(null);
            setNewPassword('');
            alert("Password updated successfully.");
        } catch (err) {
            console.error("Failed to update password:", err);
            setFormError("Failed to update password.");
        } finally {
            setSubmitting(false);
        }
    };

    const openResetModal = (id) => {
        setResetUserId(id);
        setNewPassword('');
        setShowResetModal(true);
    };

    const Icons = {
        Trash: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
        UserPlus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>,
        Admin: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>,
        Key: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>,
        Eye: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
        EyeOff: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07-2.3 2.3" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
    };

    return (
        <div className={styles.container}>
            {/* DEBUG BOX - REMOVE AFTER FIXING */}
            <div style={{ background: '#330000', color: 'red', padding: '10px', marginBottom: '20px', border: '1px solid red' }}>
                <h3>DEBUG MODE</h3>
                <p>Loading: {loading ? 'YES' : 'NO'}</p>
                <p>Users Count: {users ? users.length : 'NULL'}</p>
                <p>Error: {error || 'None'}</p>
            </div>

            {/* Header ... */}
            <div className={styles.header}>
                <div>
                    <h2>Access Management</h2>
                    <p className={styles.subtext}>Manage team members and roles</p>
                </div>
                <button className={styles.primaryBtn} onClick={() => { setFormData({ username: '', password: '', role: 'analyst' }); setShowModal(true); }}>
                    <span className={styles.btnIcon}><Icons.UserPlus /></span> ADD USER
                </button>
            </div>

            {loading ? (
                <div className={styles.loading}>Loading users...</div>
            ) : error ? (
                <div className={styles.error}>{error}</div>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>USER</th>
                                <th>ROLE</th>
                                <th>STATUS</th>
                                <th>JOINED</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td className={styles.userCell}>
                                        <div className={styles.avatar}>{user.username[0].toUpperCase()}</div>
                                        <div>
                                            <div className={styles.username}>{user.username}</div>
                                            <div className={styles.email}>{user.email || 'No email'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        {user.is_staff ? (
                                            <span className={styles.badgeAdmin}><Icons.Admin /> Admin</span>
                                        ) : (
                                            <span className={styles.badgeAnalyst}>Analyst</span>
                                        )}
                                    </td>
                                    <td>{user.is_active ? <span className={styles.statusActive}>Active</span> : <span className={styles.statusInactive}>Disabled</span>}</td>
                                    <td className={styles.dateCell}>{new Date(user.date_joined).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles.actionGroup}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => openResetModal(user.id)}
                                                title="Reset Password"
                                            >
                                                <Icons.Key />
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => handleDelete(user.id)}
                                                title="Delete User"
                                            >
                                                <Icons.Trash />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create User Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Create New User</h3>
                        <form onSubmit={handleCreateUser}>
                            <div className={styles.formGroup}>
                                <label>Username</label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    placeholder="e.g. jdoe"
                                    autoFocus
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>Temporary Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Enter secure password"
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                    </button>
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label>Role</label>
                                <select
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="analyst">Analyst (Read Only)</option>
                                    <option value="admin">Admin (Full Access)</option>
                                </select>
                            </div>

                            {formError && <div className={styles.modalError}>{formError}</div>}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                                    {submitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>Reset Password</h3>
                        <p className={styles.subtext}>Set a new temporary password for this user.</p>
                        <form onSubmit={handleResetPassword}>
                            <div className={styles.formGroup}>
                                <label>New Password</label>
                                <div className={styles.passwordWrapper}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        className={styles.eyeBtn}
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                    </button>
                                </div>
                            </div>

                            {formError && <div className={styles.modalError}>{formError}</div>}

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.secondaryBtn} onClick={() => setShowResetModal(false)}>Cancel</button>
                                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                                    {submitting ? 'Updating...' : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
