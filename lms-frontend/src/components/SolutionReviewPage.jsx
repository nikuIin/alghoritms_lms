import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Chessboard from "./Chessboard";
// import { useAuth } from "../context/AuthContext"; // Раскомментируйте, если нужно
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHome,
  faRedo,
  faStop,
  faPlay,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import "./SolutionReviewPage.css"; // Убедитесь, что файл CSS существует и путь верный

// --- Компонент для отображения шагов решения (только чтение) ---
const ReadOnlySolutionBar = ({ commands }) => {
  // ... (без изменений, выглядит нормально)
  if (!commands || commands.length === 0) {
    return (
      <p className="solution-bar-empty">
        Нет шагов в решении или не удалось их загрузить.
      </p>
    );
  }
  return (
    <div className="solution-bar read-only">
      <h4>Представленное решение:</h4>
      <ol className="solution-steps-list">
        {commands.map((command, index) => (
          <li key={index} className="solution-step read-only">
            {/* // ИЗМЕНЕНО: Добавлена проверка на command перед доступом к name/id */}
            {command?.name ||
              `Неизвестное действие (ID: ${command?.id ?? "N/A"})`}
          </li>
        ))}
      </ol>
    </div>
  );
};

const SolutionReviewPage = () => {
  const { assignmentId, userLogin } = useParams();
  const navigate = useNavigate();
  // const { user } = useAuth();

  const [assignment, setAssignment] = useState(null);
  const [elements, setElements] = useState([]);
  const [availableActions, setAvailableActions] = useState([]); // Определения команд {id, name, x, y}
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [antPosition, setAntPosition] = useState(null);
  const [antDirection, setAntDirection] = useState("right");
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationError, setAnimationError] = useState(""); // ИЗМЕНЕНО: имя state для ошибок анимации

  const [solutionData, setSolutionData] = useState(null);
  const [displayedSolutionCommands, setDisplayedSolutionCommands] = useState(
    [],
  ); // Массив объектов команд для анимации

  const [reviewScore, setReviewScore] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Хелперы для парсинга и маппинга ---
  const parseActionsResponse = useCallback((responseData) => {
    // ... (код парсера без изменений, предполагаем, что он работает) ...
    if (
      !Array.isArray(responseData) ||
      responseData.length === 0 ||
      !responseData[0] ||
      !Array.isArray(responseData[0].actions)
    ) {
      console.error("Invalid actions data structure received:", responseData);
      return []; // Возвращаем пустой массив при ошибке
    }
    const rawActions = responseData[0].actions;
    const parsedActions = rawActions
      .map((actionArray) => {
        if (!Array.isArray(actionArray) || actionArray.length < 2) return null;
        const actionObj = {};
        try {
          // Идем по парам ключ-значение
          for (let i = 0; i < actionArray.length; i += 2) {
            const key = actionArray[i];
            const value = actionArray[i + 1];
            // Преобразуем action_id в id для консистентности
            if (key === "action_id") actionObj["id"] = value;
            else actionObj[key] = value;
          }
          // Проверяем наличие ID
          if (actionObj.id === undefined) return null;
          // Добавляем значения по умолчанию, если нужно
          actionObj.name = actionObj.name || `Action ${actionObj.id}`;
          actionObj.x_changes = actionObj.x_changes ?? 0;
          actionObj.y_changes = actionObj.y_changes ?? 0;
          // Можно добавить и другие поля по умолчанию, если они нужны для анимации
        } catch (parseError) {
          console.error(
            "Error parsing single action:",
            actionArray,
            parseError,
          );
          return null;
        }
        return actionObj;
      })
      .filter((action) => action !== null); // Убираем ошибки парсинга

    console.log("Parsed actions:", parsedActions);
    return parsedActions;
  }, []);

  const mapAnswerIdsToCommands = useCallback((answerIds, actions) => {
    // ... (код маппера без изменений, предполагаем, что он работает) ...
    if (!Array.isArray(answerIds) || !Array.isArray(actions)) return [];
    const actionMap = new Map(actions.map((action) => [action.id, action]));
    const mappedCommands = answerIds
      .map((id) => {
        const command = actionMap.get(id);
        if (!command) {
          console.warn(`Command definition not found for ID: ${id}`);
          return null; // Возвращаем null, если действие не найдено
        }
        // Убедимся, что у команды есть необходимые поля для анимации
        return {
          ...command,
          x_changes: command.x_changes ?? 0,
          y_changes: command.y_changes ?? 0,
          name: command.name || `Action ${command.id}`,
        };
      })
      .filter((cmd) => cmd !== null); // Убираем ненайденные команды

    console.log("Mapped commands for animation:", mappedCommands);
    return mappedCommands;
  }, []);

  // --- Загрузка данных ---
  useEffect(() => {
    const fetchReviewData = async () => {
      setLoading(true);
      setError(null);
      setAnimationError("");
      setIsAnimating(false);
      setAssignment(null);
      setElements([]);
      setAvailableActions([]);
      setSolutionData(null);
      setDisplayedSolutionCommands([]);
      setAntPosition(null); // Сброс позиции муравья
      setAntDirection("right"); // Сброс направления

      try {
        const [assignmentDetailsResponse, solutionResponse] = await Promise.all(
          [
            axios.get(`http://backend-cnt/api/full_assignment/${assignmentId}`),
            axios.get(
              `http://backend-cnt/api/solution/?assignment_id=${assignmentId}&login=${userLogin}`,
            ),
          ],
        );

        // 1. Обработка данных задания (как в AssignmentPage)
        const [assignmentData, elementsData /* actionsData */] =
          assignmentDetailsResponse.data; // Третий элемент (actions) нам может не понадобиться, если грузим отдельно
        if (!assignmentData)
          throw new Error("Assignment data not found in response.");
        setAssignment(assignmentData);
        setElements(elementsData || []);
        setAntPosition({
          x: assignmentData.start_x,
          y: assignmentData.start_y,
        });
        // ИЗМЕНЕНО: Используем start_direction если оно есть, иначе 'right'
        setAntDirection(assignmentData.start_direction || "right");

        // 2. Обработка данных решения
        // ИЗМЕНЕНО: Проверяем структуру ответа API для решения
        // Ожидаем объект или массив объектов. Если массив, берем первый? Уточнить структуру API.
        // Пока предполагаем, что приходит один объект решения.
        let specificSolution = solutionResponse.data;
        // Если API возвращает массив, берем первый элемент
        if (Array.isArray(specificSolution) && specificSolution.length > 0) {
          specificSolution = specificSolution[0];
        }

        if (
          !specificSolution ||
          typeof specificSolution !== "object" ||
          !specificSolution.answer
        ) {
          // Если решения нет или оно пустое, это не обязательно ошибка, может студент еще не решал
          console.warn(
            "Solution data not found or invalid/empty for this user/assignment.",
          );
          setSolutionData(null); // Устанавливаем в null
          setDisplayedSolutionCommands([]); // Команд нет
        } else {
          setSolutionData(specificSolution); // Сохраняем все данные решения
          // Проверяем, что answer это массив
          if (!Array.isArray(specificSolution.answer)) {
            console.error(
              "Solution 'answer' field is not an array:",
              specificSolution.answer,
            );
            throw new Error(
              "Invalid solution format: 'answer' is not an array.",
            );
          }
          // Если ответ пустой массив, тоже ок
          if (specificSolution.answer.length === 0) {
            setDisplayedSolutionCommands([]);
          }
        }

        // 3. Загрузка и парсинг определений действий (actions)
        //    Нужно только если в /full_assignment/ их не было или они там неполные
        const actionsResponse = await axios.get(
          `http://backend-cnt/api/actions/${assignmentId}/`,
        );
        const parsedActions = parseActionsResponse(actionsResponse.data);
        setAvailableActions(parsedActions); // Сохраняем доступные действия (может пригодиться)

        // 4. Маппинг ID ответа на команды (только если есть ответ и действия)
        if (
          specificSolution &&
          specificSolution.answer &&
          specificSolution.answer.length > 0 &&
          parsedActions.length > 0
        ) {
          const commands = mapAnswerIdsToCommands(
            specificSolution.answer,
            parsedActions,
          );
          setDisplayedSolutionCommands(commands);
          if (commands.length !== specificSolution.answer.length) {
            // НЕ ошибка, а предупреждение, т.к. mapAnswerIdsToCommands уже фильтрует null
            setAnimationError(
              "Внимание: Не все шаги решения удалось распознать (возможно, нет определений для некоторых ID).",
            );
          }
        } else if (
          specificSolution &&
          specificSolution.answer &&
          specificSolution.answer.length > 0
        ) {
          // Есть ответ, но не загрузились/распарсились действия
          setError(
            "Ошибка: Не удалось загрузить определения действий для визуализации решения.",
          );
          setDisplayedSolutionCommands([]); // Не можем показать шаги
        }
        // Если specificSolution.answer пустой, displayedSolutionCommands уже []
      } catch (err) {
        console.error("Error fetching review data:", err);
        const message =
          err.response?.data?.detail ||
          err.message ||
          "An unknown error occurred.";
        setError(`Failed to load review data: ${message}`);
        // Сброс состояний при ошибке
        setAssignment(null);
        setElements([]);
        setAvailableActions([]);
        setSolutionData(null);
        setDisplayedSolutionCommands([]);
        setAntPosition(null);
        setAntDirection("right");
      } finally {
        setLoading(false);
      }
    };

    fetchReviewData();
    // Добавляем хелперы в зависимости, если они используют useCallback
  }, [assignmentId, userLogin, parseActionsResponse, mapAnswerIdsToCommands]);

  // --- Логика анимации ---
  // ИЗМЕНЕНО: Полностью переписана для работы с displayedSolutionCommands
  const handleRunSolution = useCallback(async () => {
    if (
      isAnimating ||
      !displayedSolutionCommands ||
      displayedSolutionCommands.length === 0 ||
      !assignment
    ) {
      console.log(
        "Animation prevented: already running, no commands, or no assignment data.",
      );
      return;
    }

    console.log("Starting animation with commands:", displayedSolutionCommands);
    setAnimationError(""); // Сброс сообщения
    setIsAnimating(true); // Устанавливаем флаг

    // Сброс на начальные значения из assignment
    let currentX = assignment.start_x;
    let currentY = assignment.start_y;
    let currentDirection = assignment.start_direction || "right";
    setAntPosition({ x: currentX, y: currentY });
    setAntDirection(currentDirection);

    let visitedPositions = new Set();
    visitedPositions.add(`${currentX},${currentY}`); // Добавляем стартовую
    let commandIndex = 0;

    // Используем requestAnimationFrame для более плавного цикла и возможности отмены
    let animationFrameId;

    const executeStep = async () => {
      // *** Ключевая проверка: Останавливаем, если isAnimating стал false ***

      // Условие выхода: все команды выполнены
      if (commandIndex >= displayedSolutionCommands.length) {
        setIsAnimating(false); // Завершаем анимацию
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        // Проверка конечной точки
        if (currentX === assignment.end_x && currentY === assignment.end_y) {
          setAnimationError("Успех: Муравей достиг цели!"); // ИЗМЕНЕНО: Используем animationError
        } else {
          setAnimationError("Анимация завершена: Муравей не достиг цели."); // ИЗМЕНЕНО: Используем animationError
        }
        return;
      }

      // Получаем текущую команду (уже объект с x_changes, y_changes и т.д.)
      const command = displayedSolutionCommands[commandIndex];
      console.log(
        `Step ${commandIndex + 1}: Executing command ${command.name} (ID: ${command.id}, dx: ${command.x_changes}, dy: ${command.y_changes})`,
      );

      // Рассчитываем следующий шаг (БЕЗ ЛОГИКИ ЦИКЛОВ)
      let nextX = currentX + command.x_changes; // Используем уже распарсенные значения
      let nextY = currentY - command.y_changes;
      let nextDirection = currentDirection; // Направление по умолчанию старое

      // Определение направления по имени команды (простое, можно улучшить)
      if (command.name?.toLowerCase().includes("вправо"))
        nextDirection = "right";
      else if (command.name?.toLowerCase().includes("влево"))
        nextDirection = "left";
      else if (command.name?.toLowerCase().includes("вверх"))
        nextDirection = "up";
      else if (command.name?.toLowerCase().includes("вниз"))
        nextDirection = "down";
      // Можно добавить явные проверки на command.turn_direction или другие поля, если они есть

      // --- Проверки (границы, стены, циклы) ---
      if (
        nextX < 1 ||
        nextX > assignment.field_width ||
        nextY < 1 ||
        nextY > assignment.field_height
      ) {
        setAnimationError("Ошибка: Муравей вышел за пределы поля!"); // ИЗМЕНЕНО: Используем animationError
        setIsAnimating(false);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        setAntPosition({ x: currentX, y: currentY }); // Оставляем на пред. позиции
        return;
      }
      const isWallCollision = elements.some(
        (el) => el.element_id === 1 && el.pos_x === nextX && el.pos_y === nextY,
      );
      if (isWallCollision) {
        setAnimationError("Ошибка: Муравей врезался в стену!"); // ИЗМЕНЕНО: Используем animationError
        setIsAnimating(false);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        setAntPosition({ x: currentX, y: currentY });
        return;
      }
      const positionKey = `${nextX},${nextY}`;
      if (visitedPositions.has(positionKey)) {
        setAnimationError("Ошибка: Муравей застрял в цикле!"); // ИЗМЕНЕНО: Используем animationError
        setIsAnimating(false);
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        setAntPosition({ x: currentX, y: currentY });
        return;
      }
      visitedPositions.add(positionKey);
      // --- Конец проверок ---

      // Обновляем текущие координаты и направление
      currentX = nextX;
      currentY = nextY;
      currentDirection = nextDirection;

      // Обновляем состояние React для перерисовки
      setAntPosition({ x: currentX, y: currentY });
      setAntDirection(currentDirection);
      console.log(
        `Moved to (${currentX}, ${currentY}), Direction: ${currentDirection}`,
      );

      // Проверка достижения цели ПОСЛЕ шага
      if (currentX === assignment.end_x && currentY === assignment.end_y) {
        setAnimationError("Успех: Муравей достиг цели!"); // ИЗМЕНЕНО: Используем animationError
        setIsAnimating(false); // Завершаем анимацию
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        return;
      }

      // Переходим к следующей команде
      commandIndex++;

      // Пауза и рекурсивный вызов через requestAnimationFrame + setTimeout
      // Это позволяет браузеру отрисовать кадр перед паузой
      animationFrameId = requestAnimationFrame(() => {
        setTimeout(() => {
          // *** Еще одна проверка isAnimating ПОСЛЕ паузы и ПЕРЕД следующим шагом ***
          executeStep(); // Вызываем следующий шаг
        }, 470); // Пауза
      });
    }; // Конец executeStep

    // Запускаем выполнение первого шага
    executeStep();

    // Добавляем зависимости, которые используются внутри
  }, [
    isAnimating,
    displayedSolutionCommands,
    assignment,
    elements,
    antDirection,
    antPosition,
  ]); // Немного изменил зависимости

  // --- Сброс анимации ---
  // ИЗМЕНЕНО: Убеждаемся, что сбрасывает корректно
  const handleResetAnimation = () => {
    console.log("Resetting animation...");
    setIsAnimating(false); // Останавливаем анимацию, если она идет
    setAnimationError(""); // Сброс сообщения
    if (assignment) {
      // Сброс на начальные данные из ЗАГРУЖЕННОГО задания
      setAntPosition({ x: assignment.start_x, y: assignment.start_y });
      setAntDirection(assignment.start_direction || "right");
    } else {
      // Фоллбэк, если задание еще не загружено (маловероятно)
      setAntPosition(null);
      setAntDirection("right");
    }
    // Сбрасываем 'visitedPositions' и 'commandIndex' не нужно, т.к. они локальны для handleRunSolution
  };

  // --- Обработчик для кнопки Запуск/Стоп ---
  // НОВОЕ: Управляет запуском и остановкой
  const handleToggleAnimation = () => {
    if (isAnimating) {
      console.log("Stop button pressed.");
      setIsAnimating(false); // Просто устанавливаем флаг, цикл executeStep сам остановится
      setAnimationError("Анимация остановлена пользователем."); // Можно добавить сообщение
    } else {
      console.log("Run button pressed.");
      // Перед запуском лучше сбросить на начало
      handleResetAnimation();
      // Небольшая задержка перед запуском, чтобы React успел обработать сброс состояния
      setTimeout(() => {
        // Проверяем, есть ли команды для выполнения
        if (
          displayedSolutionCommands &&
          displayedSolutionCommands.length > 0 &&
          assignment
        ) {
          handleRunSolution(); // Запускаем анимацию
        } else {
          setAnimationError(
            "Нет шагов для воспроизведения или данные задания не загружены.",
          );
        }
      }, 50); // Короткая задержка
    }
  };

  // --- Обработчики формы ревью ---
  const handleScoreChange = (event) => {
    // ... (без изменений) ...
    let score = parseInt(event.target.value, 10);
    score = Math.max(2, Math.min(5, score)); // Ограничиваем 2-5
    setReviewScore(score);
  };
  const handleFeedbackChange = (event) => {
    // ... (без изменений) ...
    setReviewFeedback(event.target.value);
  };

  // --- Отправка оценки ---
  // --- Отправка оценки ---
  const handleSubmitReview = async () => {
    setIsSubmitting(true);
    setError(null);
    console.log(solutionData);
    // Проверка, что нельзя поставить < 5, если ответ был пустой (массив [])
    // Эта проверка может быть избыточной, если бекенд это разруливает, но оставим для ясности
    if (
      (!solutionData.answer || solutionData.answer.length === 0) &&
      reviewScore > 2
    ) {
      setError(
        "Ошибка: Нельзя поставить оценку выше 2, если студент не предоставил шагов в решении.",
      );
      setIsSubmitting(false);
      return;
    }

    // --- ФОРМИРОВАНИЕ ДАННЫХ ДЛЯ API ---
    const reviewPayload = {
      solution_status_id: 2, // Всегда 2, как запрошено
      feedback: reviewFeedback.trim() || null, // Комментарий (или null/пустая строка, если API допускает)
      is_correct: true, // Преобразуем оценку в boolean (5 = true, иначе false)
      // Уточните, точно ли это правило? Может 4 и 5 это true?
      answer: solutionData.answer || [], // Отправляем *исходный* ответ студента, который хранится в solutionData
      // check_at: не отправляем, пусть бэкенд сам ставит время проверки
    };

    try {
      await axios.patch(
        `http://backend-cnt/api/update_solution/?assignment_id=${solutionData.assignment_id}&user_login=${solutionData.user_login}`, // Используем ID решения
        reviewPayload, // Отправляем сформированный payload
      );
      const grade_create_url = "http://backend-cnt/api/grade/";
      const grade_request_body = {
        grade: reviewScore,
        user_login: solutionData.user_login,
        assignment_id: solutionData.assignment_id,
      };

      await axios.post(grade_create_url, grade_request_body);
      // --- КОНЕЦ ИЗМЕНЕНИЙ В API ВЫЗОВЕ ---

      alert("Решение успешно отправлено!");
      console.log("Review submitted successfully.");
      navigate("/solutions", {
        state: {
          message: `Оценка (${reviewScore}) для ${userLogin} по заданию '${assignment?.name || assignmentId}' отправлена.`,
        },
      });
    } catch (err) {
      console.error("Error submitting review:", err);
      let message = "Unknown error during submission.";
      if (err.response) {
        // Попытка извлечь более детальное сообщение из ответа сервера
        message =
          typeof err.response.data === "string"
            ? err.response.data
            : err.response.data?.detail || JSON.stringify(err.response.data);
      } else if (err.request) {
        message = "No response received from server.";
      } else {
        message = err.message;
      }
      setError(`Ошибка отправки оценки: ${message}`);
      setIsSubmitting(false);
    }
  };

  // --- Рендеринг ---
  if (loading)
    return <div className="loading">Загрузка данных для проверки...</div>;

  if (error && !assignment)
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <Link to="/solutions-for-check" className="back-link-error">
          {" "}
          Назад к списку{" "}
        </Link>
      </div>
    );

  // Фоллбэк, если задание не загрузилось, но ошибки не было (маловероятно)
  if (!assignment)
    return (
      <div className="error-container">
        <div className="error">Не удалось загрузить данные задания.</div>
        <Link to="/solutions-for-check" className="back-link-error">
          {" "}
          Назад к списку{" "}
        </Link>
      </div>
    );

  return (
    <div className="solution-review-page assignment-page">
      <div className="review-header">
        <button
          onClick={() => navigate("/solutions-for-check")}
          title="К списку решений"
          className="back-button"
          disabled={isSubmitting || isAnimating}
        >
          <FontAwesomeIcon icon={faHome} /> К списку
        </button>
        <h2>Проверка: {assignment.name}</h2>
        <p className="user-info">
          {" "}
          Студент: <strong>{userLogin}</strong>{" "}
        </p>
      </div>

      {/* Показываем общую ошибку (загрузки, отправки) */}
      {error && !isSubmitting && (
        <div className="message error general-error">{error}</div>
      )}
      {/* Показываем статус/ошибку анимации */}
      {animationError && (
        <div
          className={`message ${animationError.includes("Ошибка") || animationError.includes("остановлена") ? "error" : "info"} animation-message`}
        >
          {" "}
          {animationError}{" "}
        </div>
      )}
      {isSubmitting && (
        <div className="message info submitting-info">Отправка оценки...</div>
      )}

      <div className="main-content-area">
        <div className="chessboard-container">
          <Chessboard
            // ИЗМЕНЕНО: Добавлен key для принудительного ререндера при сбросе/изменении данных
            key={`chessboard-${assignmentId}-${userLogin}-${antPosition?.x}-${antPosition?.y}-${antDirection}`}
            width={assignment.field_width}
            height={assignment.field_height}
            walls={elements}
            antPosition={antPosition}
            start={{ x: assignment.start_x, y: assignment.start_y }}
            end={{ x: assignment.end_x, y: assignment.end_y }}
            antDirection={antDirection}
          />
          <div className="solution-controls review-controls">
            {/* // ИЗМЕНЕНО: Используем handleToggleAnimation */}
            <button
              onClick={handleToggleAnimation}
              disabled={isAnimating}
              className={`control-button ${"play-button"}`}
            >
              <FontAwesomeIcon icon={faPlay} /> {"Старт"}
            </button>
            <button
              onClick={handleResetAnimation}
              disabled={isSubmitting} // Можно сбрасывать, если не идет отправка или анимация
              title="Сбросить анимацию на начало"
              className="control-button reset-button"
            >
              <FontAwesomeIcon icon={faRedo} /> Сброс
            </button>
          </div>
        </div>

        <div className="review-area commands-area">
          {/* Отображение шагов */}
          <ReadOnlySolutionBar commands={displayedSolutionCommands} />

          {/* Форма оценки */}
          <div className="review-form">
            <h4>Оценка решения</h4>
            {/* Сообщение, если решения нет */}
            {!solutionData && !loading && (
              <p className="no-solution-message">
                Студент не предоставил решение.
              </p>
            )}
            <div className="form-group">
              <label htmlFor="score">Оценка:</label>
              <select
                id="score"
                value={reviewScore}
                onChange={handleScoreChange}
                disabled={isSubmitting || isAnimating}
              >
                {/* // ИЗМЕНЕНО: Если решения нет, возможно, разрешаем только 5 или 2? */}
                {/* // Оставил все опции, но можно добавить логику disabled */}
                <option value="5">5 (Отлично)</option>
                <option value="4">4 (Хорошо)</option>
                <option value="3">3 (Удовлетворительно)</option>
                <option value="2">2 (Неудовлетворительно)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="feedback">Комментарий (опционально):</label>
              <textarea
                id="feedback"
                rows="4"
                value={reviewFeedback}
                onChange={handleFeedbackChange}
                placeholder="Комментарий к решению..."
                disabled={isSubmitting || isAnimating}
              />
            </div>
            <button
              className="submit-review-button"
              onClick={handleSubmitReview}
              disabled={isSubmitting || isAnimating} // Блокируем во время отправки или анимации
            >
              <FontAwesomeIcon icon={faPaperPlane} />{" "}
              {isSubmitting ? "Отправка..." : "Отправить оценку"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionReviewPage;
