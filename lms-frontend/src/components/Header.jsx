// src/components/Header.jsx
import React, { useState } from 'react'; // Import useState
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AddNewUserPopup from './AddNewUserPopup'; // Import the new component
import './Header.css';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [showAddUserPopup, setShowAddUserPopup] = useState(false); // New state

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAddUserClick = () => {
        setShowAddUserPopup(true);
    };

    const handleCloseAddUserPopup = () => {
        setShowAddUserPopup(false);
    };

    return (
        <header className="header">
            <div className="logo">
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
                                <a onClick={handleAddUserClick}>Add User</a> {}
                            </>
                        )}
                        <Link to="/profile" className="user-profile-button">
                            Profile
                        </Link>
                    </>
                ) : (
                    <Link to="/login">Login</Link>
                )}
            </nav>

            {showAddUserPopup && (
                <AddNewUserPopup onClose={handleCloseAddUserPopup} />
            )}
        </header>
    );
};

export default Header;
