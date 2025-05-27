import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Chessboard from "./Chessboard";
import CommandsBar from "./CommandsBar";
import SolutionBar from "./SolutionBar";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faArrowLeft,
  faArrowRight,
  faHome,
  faRedo,
  faStop,
  faPlay,
  faBroom,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import "./AssignmentPage.css";

// Base API URL from environment variables
const API_BASE_URL = "http://127.0.0.1:8000";

const AssignmentPage = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [elements, setElements] = useState([]);
  const [availableActions, setAvailableActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [solution, setSolution] = useState([]);
  const [antPosition, setAntPosition] = useState(null);
  const [solutionError, setSolutionError] = useState("");
  const [generalError, setGeneralError] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [antDirection, setAntDirection] = useState("right");
  const [assignments, setAssignments] = useState([]);
  const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(-1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCycleAvailable, setIsCycleAvailable] = useState(true);

  const courseId = new URLSearchParams(window.location.search).get("course_id");

  useEffect(() => {
    const fetchAssignmentData = async () => {
      setLoading(true);
      setIsCycleAvailable(true);
      setError(null);
      setGeneralError(null);
      setSolutionError("");
      setSolution([]);
      setIsAnimating(false);

      if (!courseId) {
        setGeneralError("Идентификатор курса отсутствует в URL.");
        setLoading(false);
        return;
      }

      try {
        // Fetch all assignments for the course
        const assignmentsResponse = await axios.get(
          `${API_BASE_URL}/assignments/?course_uuid=${courseId}`,
        );
        const allAssignments = assignmentsResponse.data;
        setAssignments(allAssignments);

        const currentIndex = allAssignments.findIndex(
          (a) => a.assignment_id === assignmentId,
        );
        setCurrentAssignmentIndex(currentIndex);

        // Fetch full assignment details
        const response = await axios.get(
          `${API_BASE_URL}/full_assignment/${assignmentId}`,
        );
        const [assignmentData, elementsData] = response.data;

        // Fetch actions for the assignment
        const actionsResponse = await axios.get(
          `${API_BASE_URL}/actions/${assignmentId}/`,
        );

        setAssignment(assignmentData);
        setElements(elementsData || []);
        setAvailableActions(actionsResponse.data || []);
        setAntPosition({
          x: assignmentData.start_x,
          y: assignmentData.start_y,
        });
        setAntDirection("right");
        setIsCycleAvailable(
          assignmentData.is_cycle_available !== undefined
            ? assignmentData.is_cycle_available
            : true,
        );

        setLoading(false);
      } catch (err) {
        console.error("Ошибка при загрузке данных задания:", err);
        const message =
          err.response?.data?.detail ||
          err.message ||
          "Произошла неизвестная ошибка.";
        setGeneralError(`Не удалось загрузить задание: ${message}`);
        setError(message);
        setLoading(false);
      }
    };

    fetchAssignmentData();
  }, [assignmentId, courseId]);

  const handleCommandClick = (command) => {
    if (isAnimating) return;
    if (command === "cycle") {
      setSolution([
        ...solution,
        { type: "cycle", iterations: 2, commands: [] },
      ]);
    } else {
      setSolution([...solution, command]);
    }
    setSolutionError("");
  };

  const extractCommandIds = (commandsArray) => {
    const ids = [];
    if (!Array.isArray(commandsArray)) {
      console.error(
        "Входной массив для extractCommandIds не является массивом:",
        commandsArray,
      );
      return [];
    }

    commandsArray.forEach((item) => {
      if (
        item &&
        item.type === "cycle" &&
        Array.isArray(item.commands) &&
        typeof item.iterations === "number"
      ) {
        const { commands: cycleCommands, iterations } = item;
        for (let i = 0; i < iterations; i++) {
          cycleCommands.forEach((commandInCycle) => {
            if (commandInCycle && typeof commandInCycle.id === "number") {
              ids.push(commandInCycle.id);
            } else {
              console.warn(
                "Пропущен неожиданный элемент в цикле:",
                commandInCycle,
              );
            }
          });
        }
      } else if (item && typeof item.id === "number") {
        ids.push(item.id);
      } else {
        console.warn("Пропущен неожиданный элемент во входном массиве:", item);
      }
    });
    return ids;
  };

  const handleSolutionRemove = (index) => {
    if (isAnimating) return;
    const newSolution = [...solution];
    newSolution.splice(index, 1);
    setSolution(newSolution);
    setSolutionError("");
  };

  const handleAddToCycle = (cycleIndex, command) => {
    if (isAnimating) return;
    const newSolution = [...solution];
    if (newSolution[cycleIndex].type === "cycle") {
      newSolution[cycleIndex].commands.push(command);
      setSolution(newSolution);
      setSolutionError("");
    }
  };

  const handleCycleIterationsChange = (cycleIndex, iterations) => {
    if (isAnimating) return;
    const newSolution = [...solution];
    if (newSolution[cycleIndex].type === "cycle") {
      newSolution[cycleIndex].iterations = Math.max(
        1,
        parseInt(iterations) || 1,
      );
      setSolution(newSolution);
      setSolutionError("");
    }
  };

  const handleRunSolution = async () => {
    if (isAnimating || solution.length === 0) return;
    setSolutionError("");
    setIsAnimating(true);
    setAntPosition({ x: assignment.start_x, y: assignment.start_y });
    setAntDirection("right");

    let currentX = assignment.start_x;
    let currentY = assignment.start_y;
    let currentDirection = "right";
    let visitedPositions = new Set();
    let commandIndex = 0;

    const executeStep = async () => {
      if (commandIndex >= solution.length) {
        if (currentX === assignment.end_x && currentY === assignment.end_y) {
          setSolutionError("Успех!");
        } else {
          setSolutionError("Муравей не достиг цели.");
        }
        setIsAnimating(false);
        return;
      }

      const command = solution[commandIndex];
      let nextX = currentX;
      let nextY = currentY;
      let nextDirection = currentDirection;

      if (command.type === "cycle") {
        for (let i = 0; i < command.iterations; i++) {
          for (const subCommand of command.commands) {
            nextX += subCommand.x_changes;
            nextY -= subCommand.y_changes;
            if (subCommand.name.includes("вправо")) nextDirection = "right";
            else if (subCommand.name.includes("влево")) nextDirection = "left";
            else if (subCommand.name.includes("вверх")) nextDirection = "up";
            else if (subCommand.name.includes("вниз")) nextDirection = "down";

            if (
              nextX < 1 ||
              nextX > assignment.field_width ||
              nextY < 1 ||
              nextY > assignment.field_height
            ) {
              setSolutionError("Муравей вышел за пределы поля!");
              setIsAnimating(false);
              setAntPosition({ x: currentX, y: currentY });
              return;
            }

            const isWallCollision = elements.some(
              (element) =>
                element.element_id === 1 &&
                element.pos_x === nextX &&
                element.pos_y === nextY,
            );
            if (isWallCollision) {
              setSolutionError("Муравей столкнулся со стеной!");
              setIsAnimating(false);
              setAntPosition({ x: currentX, y: currentY });
              return;
            }

            const positionKey = `${nextX},${nextY}`;
            if (visitedPositions.has(positionKey)) {
              setSolutionError("Муравей застрял в цикле!");
              setIsAnimating(false);
              setAntPosition({ x: currentX, y: currentY });
              return;
            }
            visitedPositions.add(positionKey);

            currentX = nextX;
            currentY = nextY;
            currentDirection = nextDirection;
            setAntPosition({ x: currentX, y: currentY });
            setAntDirection(nextDirection);

            if (
              currentX === assignment.end_x &&
              currentY === assignment.end_y
            ) {
              setSolutionError("Успех!");
              setIsAnimating(false);
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 470));
          }
        }
      } else {
        nextX += command.x_changes;
        nextY -= command.y_changes;
        if (command.name.includes("вправо")) nextDirection = "right";
        else if (command.name.includes("влево")) nextDirection = "left";
        else if (command.name.includes("вверх")) nextDirection = "up";
        else if (command.name.includes("вниз")) nextDirection = "down";

        if (
          nextX < 1 ||
          nextX > assignment.field_width ||
          nextY < 1 ||
          nextY > assignment.field_height
        ) {
          setSolutionError("Муравей вышел за пределы поля!");
          setIsAnimating(false);
          setAntPosition({ x: currentX, y: currentY });
          return;
        }

        const isWallCollision = elements.some(
          (element) =>
            element.element_id === 1 &&
            element.pos_x === nextX &&
            element.pos_y === nextY,
        );
        if (isWallCollision) {
          setSolutionError("Муравей столкнулся со стеной!");
          setIsAnimating(false);
          setAntPosition({ x: currentX, y: currentY });
          return;
        }

        const positionKey = `${nextX},${nextY}`;
        if (visitedPositions.has(positionKey)) {
          setSolutionError("Муравей застрял в цикле!");
          setIsAnimating(false);
          setAntPosition({ x: currentX, y: currentY });
          return;
        }
        visitedPositions.add(positionKey);

        currentX = nextX;
        currentY = nextY;
        currentDirection = nextDirection;
        setAntPosition({ x: currentX, y: currentY });
        setAntDirection(nextDirection);

        if (currentX === assignment.end_x && currentY === assignment.end_y) {
          setSolutionError("Успех!");
          setIsAnimating(false);
          return;
        }
      }

      commandIndex++;
      setTimeout(executeStep, 470);
    };

    executeStep();
  };

  const handleRestart = () => {
    setIsAnimating(false);
    setSolution([]);
    setAntPosition({ x: assignment.start_x, y: assignment.start_y });
    setAntDirection("right");
    setSolutionError("");
  };

  const handleClearAll = () => {
    if (isAnimating) return;
    setSolution([]);
    setSolutionError("");
  };

  const handlePreviousAssignment = () => {
    if (currentAssignmentIndex > 0) {
      const previousAssignmentId =
        assignments[currentAssignmentIndex - 1].assignment_id;
      navigate(`/assignment/${previousAssignmentId}?course_id=${courseId}`);
    }
  };

  const handleNextAssignment = () => {
    if (currentAssignmentIndex < assignments.length - 1) {
      const nextAssignmentId =
        assignments[currentAssignmentIndex + 1].assignment_id;
      navigate(`/assignment/${nextAssignmentId}?course_id=${courseId}`);
    }
  };

  const handleDeleteCurrentAssignment = async () => {
    if (
      !window.confirm(
        `Вы уверены, что хотите удалить задание "${assignment?.name || assignmentId}"? Это действие нельзя отменить.`,
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setGeneralError(null);

    try {
      await axios.post(`${API_BASE_URL}/assignment/delete/${assignmentId}`);
      navigate(`/course/${courseId}`);
    } catch (err) {
      console.error("Ошибка при удалении задания:", err);
      const message =
        err.response?.data?.detail ||
        err.message ||
        "Произошла неизвестная ошибка при удалении.";
      setGeneralError(`Не удалось удалить задание: ${message}`);
      setIsDeleting(false);
    }
  };

  const handleSubmitSolution = async () => {
    if (isAnimating || solution.length === 0) return;
    const solutionData = {
      solution_status_id: 1,
      answer: extractCommandIds(solution),
      assignment_id: assignmentId,
      user_login: user.user_login,
    };

    const response = await axios.post(
      `${API_BASE_URL}/create_solution/`,
      solutionData,
    );
    const solutionId = response.data.solution_id;
    console.log(solutionId);

    setSolutionError("Решение успешно отправлено!");
  };

  if (loading) return <div className="loading">Загрузка задания...</div>;
  if (generalError)
    return (
      <div className="error">
        {generalError} <Link to={`/course/${courseId}`}>Вернуться к курсу</Link>
      </div>
    );
  if (!assignment)
    return (
      <div className="error">
        Данные задания не удалось загрузить.{" "}
        <Link to={`/course/${courseId}`}>Вернуться к курсу</Link>
      </div>
    );

  const canGoPrevious = currentAssignmentIndex > 0;
  const canGoNext =
    currentAssignmentIndex !== -1 &&
    currentAssignmentIndex < assignments.length - 1;

  return (
    <div className="assignment-page">
      <h2>{assignment.name}</h2>
      {solutionError && (
        <div
          className={`solution-message ${solutionError.includes("Успех") || solutionError.includes("успешно отправлено") ? "success" : "error"}`}
        >
          {solutionError}
        </div>
      )}
      {isDeleting && <div className="loading">Удаление задания...</div>}

      <div className="top-controls">
        <button
          onClick={() => navigate(`/course/${courseId}`)}
          title="Вернуться к курсу"
          disabled={isDeleting || isAnimating}
        >
          <FontAwesomeIcon icon={faHome} /> Курс
        </button>
        <button
          onClick={handlePreviousAssignment}
          disabled={!canGoPrevious || isDeleting || isAnimating}
          title="Предыдущее задание"
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Назад
        </button>
        <button
          onClick={handleNextAssignment}
          disabled={!canGoNext || isDeleting || isAnimating}
          title="Следующее задание"
        >
          Вперед <FontAwesomeIcon icon={faArrowRight} />
        </button>
        {user && user.role_id === 2 && (
          <>
            <button
              onClick={() => navigate(`/update-assignment/${assignmentId}`)}
              className="edit-button"
              title="Редактировать задание"
              disabled={isDeleting || isAnimating}
            >
              <FontAwesomeIcon icon={faEdit} /> Редактировать
            </button>
            <button
              onClick={handleDeleteCurrentAssignment}
              className="delete-button"
              title="Удалить задание"
              disabled={isDeleting || isAnimating}
            >
              <FontAwesomeIcon icon={faTrash} /> Удалить
            </button>
          </>
        )}
      </div>
      <p className="assignment-description">
        {assignment.description || "Описание отсутствует."}
      </p>
      <div className="main-content-area">
        <div className="chessboard-container">
          <Chessboard
            width={assignment.field_width}
            height={assignment.field_height}
            walls={elements}
            antPosition={antPosition}
            start={{ x: assignment.start_x, y: assignment.start_y }}
            end={{ x: assignment.end_x, y: assignment.end_y }}
            antDirection={antDirection}
          />
          <div className="solution-controls">
            <button
              onClick={handleRunSolution}
              disabled={isAnimating || solution.length === 0}
              title="Запустить решение"
            >
              <FontAwesomeIcon icon={isAnimating ? faStop : faPlay} />{" "}
              {isAnimating ? "Выполняется..." : "Запустить"}
            </button>
            <button
              onClick={handleRestart}
              disabled={isAnimating}
              title="Сбросить решение и положение муравья"
            >
              <FontAwesomeIcon icon={faRedo} /> Сбросить все
            </button>
            <button
              onClick={handleClearAll}
              disabled={isAnimating || solution.length === 0}
              title="Очистить шаги решения"
            >
              <FontAwesomeIcon icon={faBroom} /> Очистить шаги
            </button>
            <button
              onClick={handleSubmitSolution}
              disabled={isAnimating || solution.length === 0}
              title="Отправить решение"
            >
              <FontAwesomeIcon icon={faPaperPlane} /> Отправить решение
            </button>
          </div>
        </div>
        <div className="commands-area">
          <div className="commands">
            <CommandsBar
              commands={availableActions}
              onCommandClick={handleCommandClick}
              disabled={isAnimating}
              isCycleAvailable={isCycleAvailable}
              onAddToCycle={handleAddToCycle}
              solution={solution}
              onCycleIterationsChange={handleCycleIterationsChange}
            />
            <SolutionBar
              solution={solution}
              onSolutionRemove={handleSolutionRemove}
              disabled={isAnimating}
              onAddToCycle={handleAddToCycle}
              onCycleIterationsChange={handleCycleIterationsChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignmentPage;
