// src/components/UserProfile.jsx (or .js)
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile = () => {
    const { user, logout } = useAuth(); // Get user and logout from context
    const navigate = useNavigate();

    if (!user) {
        // Redirect to login if not authenticated
        navigate('/login');
        return null; // Or a loading indicator
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={'container'}>
            <div className={'wrapper'}>
                <h2>Ваш профиль</h2>
                <p>{user.user_login}!</p>
                <p>Email: {user.email}</p>
                <p>Роль: {user.role_id}</p>

                <button onClick={handleLogout}>Выйти</button>
            </div>
        </div>
    );
};

export default UserProfile;