import React, { useState, useEffect } from 'react';
import api from '../api';
import styles from './Login.module.css';

const Login = ({ onLogin }) => {
    // State
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [capsLock, setCapsLock] = useState(false);

    // Handlers
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    const handleKeyDown = (e) => {
        if (e.getModifierState && e.getModifierState('CapsLock')) {
            setCapsLock(true);
        } else {
            setCapsLock(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);


        // Client-side validation
        if (!formData.username || !formData.password) {
            setError("Username and Password are required.");
            return;
        }

        setLoading(true);
        try {
            const response = await api.login(formData.username, formData.password);
            if (response.data.token) {
                // Pass token AND is_staff role to App.jsx
                onLogin(response.data.token, response.data.is_staff);
            } else {
                setError("Login failed. No token received.");
            }
        } catch (err) {
            console.error(err);
            if (err.response && err.response.status === 400) {
                setError("Invalid username or password.");
            } else {
                setError("Unable to reach server. Please try again later.");
            }
        } finally {
            setLoading(false);
        }
    };



    // Icons (Inline SVG for Zero Dependency)
    const Icons = {
        User: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
        Lock: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
        Mail: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>,
        Eye: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
        EyeOff: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07-2.3 2.3" /><line x1="1" y1="1" x2="23" y2="23" /></svg>,
        Shield: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
        ArrowLeft: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>
    };

    return (
        <div className={styles.loginContainer}>
            {/* Background Effects */}
            <div className={styles.gridLayer}></div>
            <div className={styles.particleLayer}></div>

            <div className={styles.contentWrapper}>

                {/* Brand Header */}
                <div className={styles.brandTitle}>
                    <h1>ChemicalViz <span className={styles.pro}>Pro</span></h1>
                </div>

                {/* Login Card */}
                <div className={styles.loginCard}>
                    <div className={styles.glowBorder}></div>

                    <form onSubmit={handleLogin} className={styles.form}>
                        <h2 className={styles.cardHeader}>Sign In</h2>

                        {/* Username Field */}
                        <div className={styles.fieldGroup}>
                            <label>Username or Email</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}><Icons.User /></span>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter your credentials"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className={styles.fieldGroup}>
                            <label>Password</label>
                            <div className={styles.inputWrapper}>
                                <span className={styles.inputIcon}><Icons.Lock /></span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Enter password"
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className={styles.toggleBtn}
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <Icons.EyeOff /> : <Icons.Eye />}
                                </button>
                            </div>
                            {capsLock && <div className={styles.capsWarning}>⚠️ Caps Lock is ON</div>}
                        </div>

                        {/* Remember Me Toggle */}
                        <div className={styles.rememberRow}>
                            <label className={styles.checkboxLabel}>
                                <input type="checkbox" />
                                <span className={styles.checkboxCustom}></span>
                                Remember me for 30 days
                            </label>
                        </div>

                        {/* Feedback & Actions */}
                        {error && <div className={styles.errorMessage}>{error}</div>}

                        <button type="submit" className={styles.loginBtn} disabled={loading}>
                            {loading ? <div className={styles.spinner}></div> : 'SIGN IN'}
                        </button>
                    </form>

                    {/* Footer Trust Signal */}
                    <div className={styles.secureFooter}>
                        <Icons.Shield />
                        <span>Secure Analytics Environment</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
