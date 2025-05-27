import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./UsersPage.css";

const API_BASE_URL = "http://127.0.0.1:8000";

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingUser, setEditingUser] = useState(null); // { user_login, data }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/users/`, {
          params: { teacher_login: user.user_login },
        });
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка при загрузке пользователей:", err);
        const message =
          err.response?.data?.detail ||
          err.message ||
          "Произошла неизвестная ошибка.";
        setError(`Не удалось загрузить пользователей: ${message}`);
        setLoading(false);
      }
    };

    if (user && user.role_id === 2) {
      fetchUsers();
    } else {
      setError("Доступ только для учителей.");
      setLoading(false);
    }
  }, [user]);

  const handleEditUser = (user) => {
    setEditingUser({
      user_login: user.user_login,
      data: {
        email: user.email || "",
        phone: user.phone || "",
        role_id: user.role_id,
        first_name: user.first_name || "",
        second_name: user.second_name || "",
        patronymic: user.patronymic || "",
        additional_info: user.additional_info || "",
      },
    });
  };

  const handleInputChange = (e, field) => {
    setEditingUser({
      ...editingUser,
      data: { ...editingUser.data, [field]: e.target.value },
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await axios.patch(`${API_BASE_URL}/user/`, editingUser.data, {
        params: {
          user_login: editingUser.user_login,
          teacher_login: user.user_login,
        },
      });
      setUsers(
        users.map((u) =>
          u.user_login === editingUser.user_login
            ? {
                ...u,
                ...editingUser.data,
                updated_at: new Date().toISOString(),
              }
            : u,
        ),
      );
      setEditingUser(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Ошибка при обновлении пользователя:", err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Произошла неизвестная ошибка.";
      setError(`Не удалось обновить пользователя: ${message}`);
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
  };

  if (!user) {
    return <div className="error">Пожалуйста, войдите в систему.</div>;
  }

  if (loading) {
    return <div className="loading">Загрузка пользователей...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="users-page">
      <h1>Пользователи</h1>
      {users.length === 0 ? (
        <p className="no-users">Пользователей пока нет.</p>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Логин</th>
                <th>Имя</th>
                <th>Фамилия</th>
                <th>Отчество</th>
                <th>Email</th>
                <th>Телефон</th>
                <th>Роль</th>
                <th>Доп. инфо</th>
                <th>Дата регистрации</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_login}>
                  <td>{user.user_login}</td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <input
                        type="text"
                        value={editingUser.data.first_name}
                        onChange={(e) => handleInputChange(e, "first_name")}
                        disabled={isSubmitting}
                      />
                    ) : (
                      user.first_name || "-"
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <input
                        type="text"
                        value={editingUser.data.second_name}
                        onChange={(e) => handleInputChange(e, "second_name")}
                        disabled={isSubmitting}
                      />
                    ) : (
                      user.second_name || "-"
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <input
                        type="text"
                        value={editingUser.data.patronymic}
                        onChange={(e) => handleInputChange(e, "patronymic")}
                        disabled={isSubmitting}
                      />
                    ) : (
                      user.patronymic || "-"
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <input
                        type="email"
                        value={editingUser.data.email}
                        onChange={(e) => handleInputChange(e, "email")}
                        disabled={isSubmitting}
                      />
                    ) : (
                      user.email || "-"
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <input
                        type="text"
                        value={editingUser.data.phone}
                        onChange={(e) => handleInputChange(e, "phone")}
                        disabled={isSubmitting}
                      />
                    ) : (
                      user.phone || "-"
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <select
                        value={editingUser.data.role_id}
                        onChange={(e) => handleInputChange(e, "role_id")}
                        disabled={isSubmitting}
                      >
                        <option value={1}>Ученик</option>
                        <option value={2}>Учитель</option>
                      </select>
                    ) : user.role_id === 1 ? (
                      "Ученик"
                    ) : (
                      "Учитель"
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <input
                        type="text"
                        value={editingUser.data.additional_info}
                        onChange={(e) =>
                          handleInputChange(e, "additional_info")
                        }
                        disabled={isSubmitting}
                      />
                    ) : (
                      user.additional_info || "-"
                    )}
                  </td>
                  <td>
                    {new Date(user.registration_date).toLocaleDateString(
                      "ru-RU",
                      {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      },
                    )}
                  </td>
                  <td>
                    {editingUser &&
                    editingUser.user_login === user.user_login ? (
                      <>
                        <button
                          onClick={handleSaveUser}
                          disabled={isSubmitting}
                          className="action-button save-button"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                          className="action-button cancel-button"
                        >
                          Отмена
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleEditUser(user)}
                        className="action-button edit-button"
                      >
                        Редактировать
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
