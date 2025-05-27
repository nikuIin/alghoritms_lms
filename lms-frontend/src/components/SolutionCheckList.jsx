import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SolutionCheckList.css"; // Создадим файл со стилями

const API_BASE_URL = "http://127.0.0.1:8000";
const SOLUTIONS_URL = `${API_BASE_URL}/solution_for_review/`;
const ASSIGNMENT_NAME_URL = (id) =>
  `${API_BASE_URL}/assignment_name/?assignment_id=${id}`;

// Компонент для отображения одной карточки решения
function SolutionCard({ assignmentId, assignmentName, userLogin }) {
  const navigate = useNavigate();
  const handleCheckClick = () => {
    // Переходим на страницу ревью, передавая параметры в URL
    navigate(`/review/${assignmentId}/${userLogin}`);
  };

  return (
    <div className="solution-card">
      <h3 className="solution-card__title">
        {assignmentName || "Загрузка названия..."}
      </h3>
      <p className="solution-card__user">Студент: {userLogin}</p>
      {/* Можно добавить кнопку или ссылку для перехода к проверке */}
      <button onClick={handleCheckClick} className="solution-card__button">
        Проверить
      </button>
    </div>
  );
}

// Основной компонент для отображения списка
function SolutionCheckList() {
  const [solutions, setSolutions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSolutionsAndNames = async () => {
      setIsLoading(true);
      setError(null);
      setSolutions([]); // Сброс перед загрузкой

      try {
        // 1. Получаем основной список решений
        const response = await fetch(SOLUTIONS_URL);
        if (!response.ok) {
          throw new Error(
            `Ошибка загрузки решений: ${response.statusText} (${response.status})`,
          );
        }
        const solutionsData = await response.json();

        if (!Array.isArray(solutionsData)) {
          console.error("Получены неверные данные решений:", solutionsData);
          throw new Error("Полученные данные решений не являются массивом.");
        }

        if (solutionsData.length === 0) {
          setSolutions([]); // Устанавливаем пустой массив, если решений нет
          setIsLoading(false);
          return; // Выходим, если нет решений для обработки
        }

        // 2. Для каждого решения получаем имя задания
        const solutionsWithNames = await Promise.all(
          solutionsData.map(async (solution) => {
            try {
              const nameResponse = await fetch(
                ASSIGNMENT_NAME_URL(solution.assignment_id),
              );
              if (!nameResponse.ok) {
                console.warn(
                  `Не удалось загрузить имя для задания ${solution.assignment_id}: ${nameResponse.statusText}`,
                );
                return { ...solution, assignmentName: "Ошибка загрузки имени" }; // Возвращаем решение с пометкой об ошибке
              }
              const nameData = await nameResponse.json();
              return { ...solution, assignmentName: nameData.name };
            } catch (nameError) {
              console.error(
                `Ошибка при загрузке имени для задания ${solution.assignment_id}:`,
                nameError,
              );
              return { ...solution, assignmentName: "Ошибка загрузки имени" }; // Обработка ошибки на уровне одного запроса
            }
          }),
        );

        setSolutions(solutionsWithNames);
      } catch (err) {
        console.error("Ошибка при получении данных:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutionsAndNames();
  }, []); // Пустой массив зависимостей - запускаем эффект один раз при монтировании

  // --- Отображение ---
  if (isLoading) {
    return <div className="loading-message">Загрузка решений...</div>;
  }

  if (error) {
    return <div className="error-message">Ошибка: {error}</div>;
  }

  if (solutions.length === 0) {
    return <div className="info-message">Нет решений для проверки.</div>;
  }

  return (
    <div className="solution-list-container">
      <h1 className="solution-list-header">Решения для проверки</h1>
      <div className="solution-list">
        {solutions.map((solution) => (
          // Используем комбинацию ID задания и логина как ключ, если возможно повторение ID заданий
          <SolutionCard
            key={`${solution.assignment_id}-${solution.user_login}`}
            assignmentId={solution.assignment_id}
            assignmentName={solution.assignmentName}
            userLogin={solution.user_login}
          />
        ))}
      </div>
    </div>
  );
}

export default SolutionCheckList;
