// src/components/LoginPage.jsx (or .js)
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios'; // Import axios

const LoginPage = () => {
    const [user_login, setUserLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();  // Use the login function from AuthContext
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');  // Clear any previous errors

        try {
            const success = await login({ user_login, password }); //AWAIT here!!

            if (success) {
                navigate('/user-profile'); // Redirect on successful login
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Login failed.  Please check your credentials.');
            console.error("Login error:", err);
        }
    };

    return (
        <div className={'container'}>
            <div className={'wrapper'}>
                <h2>Login</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="user_login">Username:</label>
                        <input
                            type="text"
                            id="user_login"
                            value={user_login}
                            onChange={(e) => setUserLogin(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Log In</button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;