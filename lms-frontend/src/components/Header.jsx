import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AddNewUserPopup from "./AddNewUserPopup";
import "./Header.css";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAddUserPopup, setShowAddUserPopup] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
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
                <Link to="/grades">Мои оценки</Link>
              </>
            )}
            {user.role_id === 2 && (
              <>
                <Link to="/courses">Список курсов</Link>
                <Link to="/solutions-for-check">Проверить решения</Link>
                <Link to="/grades">Оценки</Link>
                <Link to="/users">Пользователи</Link>
                <a onClick={handleAddUserClick}>Добавить пользователя</a>
              </>
            )}
            <Link to="/profile" className="user-profile-button">
              Профиль
            </Link>
            <button onClick={handleLogout} className="logout-button">
              Выйти
            </button>
          </>
        ) : (
          <Link to="/login">Войти</Link>
        )}
      </nav>

      {showAddUserPopup && (
        <AddNewUserPopup onClose={handleCloseAddUserPopup} />
      )}
    </header>
  );
};

export default Header;
