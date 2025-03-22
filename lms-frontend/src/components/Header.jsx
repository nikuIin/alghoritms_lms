// src/components/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css'; // Create this CSS file for styling

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="logo">
                {/* Add your logo here */}
                <Link to="/">LMS</Link>
            </div>
            <nav className="navigation">
                {user ? (
                    <>
                        {user.role_id === 1 && (
                            <>
                                <Link to="/courses">Мои курсы</Link>
                            </>
                        )}
                        {user.role_id === 2 && (
                            <>
                                <Link to="/courses">Список курсов</Link>
                            </>
                        )}
                        <Link to="/profile" className="user-profile-button"> {/* Corrected this line */}
                            {/* Replace with a circle user icon */}

                        </Link>
                    </>
                ) : (
                    <Link to="/login">Войти</Link> // Or register button if you want
                )}
            </nav>
        </header>
    );
};

export default Header;