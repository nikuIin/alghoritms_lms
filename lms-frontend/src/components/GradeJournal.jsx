// src/components/GradeJournal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useParams, useNavigate } from 'react-router-dom';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './GradeJournal.css'; 

const API_BASE_URL = 'http://backend-cnt/api'; 

const GradeJournal = () => {
    const { user } = useAuth(); // Получаем пользователя и его роль
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
        
    const navigate = useNavigate();
    console.log("Студент: ", user);
    // --- Функция для загрузки оценок ---
    const fetchGrades = useCallback(async () => {
        if (!user) {
            setError("Пользователь не аутентифицирован.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        let url = '';

        try {
            if (user.role_id === 1) { // Обычный пользователь (студент)
                console.log("Студент запросил оценки")
                console.log(user.user_login)
                url = `${API_BASE_URL}/user_grades/?user_login=${user.user_login}`;
                console.log(url);
            } else if (user.role_id === 2) { // Админ
                url = `${API_BASE_URL}/all_grades/`;
            } else {
                throw new Error("Неизвестная роль пользователя.");
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Ошибка сети: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            // Убедимся, что data.grades это массив
            setGrades(Array.isArray(data.grades) ? data.grades : []);
        } catch (err) {
            console.error("Ошибка при загрузке оценок:", err);
            setError(`Не удалось загрузить оценки: ${err.message}`);
            setGrades([]); // Очищаем оценки при ошибке
        } finally {
            setLoading(false);
        }
    }, [user]); // Зависимость от user

    // --- Загрузка данных при монтировании или смене пользователя ---
    useEffect(() => {
        fetchGrades();
    }, [fetchGrades]); // Используем useCallback-версию

    // --- Функция для обновления оценки ---
    const handleUpdateGrade = async (assignmentId, userLogin, currentGrade) => {
        const newGradeStr = prompt(`Введите новую оценку для ${userLogin} (задание ${assignmentId}):`, currentGrade);
        if (newGradeStr === null) return; // Пользователь отменил

        const newGrade = parseInt(newGradeStr, 10);
        if (isNaN(newGrade)) {
            alert("Пожалуйста, введите корректное числовое значение для оценки.");
            return;
        }

        // Тут можно добавить валидацию диапазона оценки (например, 0-5)
        // if (newGrade < 0 || newGrade > 5) {
        //     alert("Оценка должна быть в диапазоне от 0 до 5.");
        //     return;
        // }

        const payload = {
            grade: newGrade,
            assignment_id: assignmentId,
            user_login: userLogin,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/grade/`, {
                method: 'POST', // Или PUT/PATCH, если бэкенд использует их для обновления
                headers: {
                    'Content-Type': 'application/json',
                    // Возможно, потребуется добавить токен авторизации, если API защищено
                    // 'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result === true) {
                // Обновляем состояние локально для мгновенного отображения
                setGrades(prevGrades =>
                    prevGrades.map(g =>
                        g.assignment_id === assignmentId && g.user_login === userLogin
                            ? { ...g, grade: newGrade }
                            : g
                    )
                );
                alert('Оценка успешно обновлена!');
            } else {
                const errorText = await response.text(); // Попробуем получить текст ошибки
                throw new Error(`Не удалось обновить оценку. Сервер ответил: ${result} (Статус: ${response.status}). Детали: ${errorText}`);
            }
        } catch (err) {
            console.error("Ошибка при обновлении оценки:", err);
            alert(`Ошибка: ${err.message}`);
        }
    };

    // --- Функция для удаления оценки ---
    const handleDeleteGrade = async (assignmentId, userLogin) => {
        if (!window.confirm(`Вы уверены, что хотите удалить оценку для ${userLogin} (задание ${assignmentId})?`)) {
            return;
        }

        // Важно: В твоем описании API тело запроса содержит 'assinment_id' (опечатка).
        // Используй правильное поле 'assignment_id', если оно ожидается на бэкенде.
        // Если бэкенд действительно ожидает 'assinment_id', используй его.
        const payload = {
            // assinment_id: assignmentId, // Если на бэке опечатка
            assignment_id: assignmentId, // Правильное поле
            user_login: userLogin,
        };

        try {
            const response = await fetch(`${API_BASE_URL}/grade/`, { // Предполагаем, что удаление идет через тот же эндпоинт, но с другим методом или параметром
                // Бэкенд должен поддерживать метод DELETE или POST для удаления
                // Уточни у разработчика бэкенда, какой метод ожидает ручка /grade/ для удаления
                method: 'DELETE', // Стандартный REST метод для удаления
                // method: 'POST', // Если бэкенд ожидает POST для удаления
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (response.ok && result === true) {
                // Удаляем оценку из локального состояния
                setGrades(prevGrades =>
                    prevGrades.filter(g => !(g.assignment_id === assignmentId && g.user_login === userLogin))
                );
                alert('Оценка успешно удалена!');
            } else {
                 const errorText = await response.text();
                throw new Error(`Не удалось удалить оценку. Сервер ответил: ${result} (Статус: ${response.status}). Детали: ${errorText}`);
            }
        } catch (err) {
            console.error("Ошибка при удалении оценки:", err);
            alert(`Ошибка: ${err.message}`);
        }
    };

    // --- Отображение состояний ---
    if (!user) {
        return <p className="grade-journal-message">Пожалуйста, войдите в систему для просмотра журнала.</p>;
    }

    if (loading) {
        return <p className="grade-journal-message">Загрузка журнала...</p>;
    }

    if (error) {
        return <p className="grade-journal-error">Ошибка: {error}</p>;
    }

    if (grades.length === 0) {
        return <p className="grade-journal-message">Оценок пока нет.</p>
    }

    const assignment_redirect = (assignmentId) => {
        navigate(`/assignemnt/${assignmentId}`)
    }

    // --- Рендеринг в зависимости от роли ---
    return (
        <div className="grade-journal-container">
            <h2>Журнал Оценок</h2>

            {/* Вид для Администратора (Роль 2) */}
            {user.role_id === 2 && (
                <table className="admin-grades-table">
                    <thead>
                        <tr>
                            <th>Логин студента</th>
                            <th>Задание</th>
                            <th>Оценка</th>
                            <th>Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map((grade, index) => (
                            <tr key={`${grade.user_login}-${grade.assignment_id}-${index}`}> {/* Добавляем index для уникальности ключа на случай дублей */}
                                <td>{grade.user_login}</td>
                                <td>{grade.assignment_name}</td>
                                <td>{grade.grade}</td>
                                <td>
                                    <div className="grade-actions">
                                         {/* Используем стили и иконки как в AssignmentCard */}
                                        <button
                                            onClick={() => handleUpdateGrade(grade.assignment_id, grade.user_login, grade.grade)}
                                            className="icon-button edit-button"
                                            title="Редактировать оценку"
                                        >
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGrade(grade.assignment_id, grade.user_login)}
                                            className="icon-button delete-button"
                                            title="Удалить оценку"
                                        >
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Вид для Обычного пользователя (Роль 1) */}
            {user.role_id === 1 && (
                <div className="student-grades-list">
                    <h3>Ваши оценки, {user.user_login}:</h3>
                    {grades.map((grade, index) => (
                        <a
                            className="student-grade-card"
                            key={`${grade.assignment_id}-${index}`}
                            onClick={() => navigate(`/assignment/${grade.assignment_id}?course_id=${grade.course_id}`)}
                        >
                            <span className="assignment-id">{grade.assignment_name}</span>
                            <span className={`grade-value grade-${grade.grade}`}>
                                {grade.grade}
                            </span>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GradeJournal;
