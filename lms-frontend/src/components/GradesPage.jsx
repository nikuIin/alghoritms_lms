import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./GradesPage.css";

const API_BASE_URL = "http://127.0.0.1/api";

const GradesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingGrade, setEditingGrade] = useState(null); // { assignment_id, user_login, value }
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchGrades = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_BASE_URL}/grades/`, {
          params: { user_login: user.user_login },
        });
        setGrades(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Ошибка при загрузке оценок:", err);
        const message =
          err.response?.data?.detail ||
          err.message ||
          "Произошла неизвестная ошибка.";
        setError(`Не удалось загрузить оценки: ${message}`);
        setLoading(false);
      }
    };

    if (user) {
      fetchGrades();
    }
  }, [user]);

  const handleEditGrade = (grade) => {
    setEditingGrade({
      assignment_id: grade.assignment_id,
      user_login: grade.user_login,
      value: grade.grade,
    });
  };

  const handleGradeChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 2 && value <= 5) {
      setEditingGrade({ ...editingGrade, value });
    }
  };

  const handleSaveGrade = async () => {
    if (!editingGrade) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE_URL}/grade/`,
        { grade: editingGrade.value },
        {
          params: {
            assignment_id: editingGrade.assignment_id,
            user_login: editingGrade.user_login,
            teacher_login: user.user_login,
          },
        },
      );
      setGrades(
        grades.map((g) =>
          g.assignment_id === editingGrade.assignment_id &&
          g.user_login === editingGrade.user_login
            ? {
                ...g,
                grade: editingGrade.value,
                updated_at: new Date().toISOString(),
              }
            : g,
        ),
      );
      setEditingGrade(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error("Ошибка при обновлении оценки:", err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Произошла неизвестная ошибка.";
      setError(`Не удалось обновить оценку: ${message}`);
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingGrade(null);
  };

  if (!user) {
    return <div className="error">Пожалуйста, войдите в систему.</div>;
  }

  if (loading) {
    return <div className="loading">Загрузка оценок...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="grades-page">
      <h1>{user.role_id === 2 ? "Все оценки" : "Мои оценки"}</h1>
      {grades.length === 0 ? (
        <p className="no-grades">Оценок пока нет.</p>
      ) : (
        <div className="grades-table-container">
          <table className="grades-table">
            <thead>
              <tr>
                <th>Задание</th>
                {user.role_id === 2 && <th>Студент</th>}
                <th>Оценка</th>
                <th>Дата</th>
                {user.role_id === 2 && <th>Действия</th>}
              </tr>
            </thead>
            <tbody>
              {grades.map((grade) => (
                <tr key={`${grade.assignment_id}-${grade.user_login}`}>
                  <td>{grade.assignment_name}</td>
                  {user.role_id === 2 && <td>{grade.user_login}</td>}
                  <td>
                    {editingGrade &&
                    editingGrade.assignment_id === grade.assignment_id &&
                    editingGrade.user_login === grade.user_login ? (
                      <select
                        value={editingGrade.value}
                        onChange={handleGradeChange}
                        disabled={isSubmitting}
                      >
                        <option value={5}>5</option>
                        <option value={4}>4</option>
                        <option value={3}>3</option>
                        <option value={2}>2</option>
                      </select>
                    ) : (
                      grade.grade
                    )}
                  </td>
                  <td>
                    {new Date(grade.updated_at).toLocaleDateString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </td>
                  {user.role_id === 2 && (
                    <td>
                      {editingGrade &&
                      editingGrade.assignment_id === grade.assignment_id &&
                      editingGrade.user_login === grade.user_login ? (
                        <>
                          <button
                            onClick={handleSaveGrade}
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
                          onClick={() => handleEditGrade(grade)}
                          className="action-button edit-button"
                        >
                          Редактировать
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GradesPage;
