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
                setGeneralError("Course ID is missing from the URL.");
                setLoading(false);
                return;
            }

            try {
                const assignmentsResponse = await axios.get(
                    `http://127.0.0.1:8000/assignments/?course_uuid=${courseId}`,
                );
                const allAssignments = assignmentsResponse.data;
                setAssignments(allAssignments);

                const currentIndex = allAssignments.findIndex(
                    (a) => a.assignment_id === assignmentId,
                );
                setCurrentAssignmentIndex(currentIndex);

                const response = await axios.get(
                    `http://127.0.0.1:8000/full_assignment/${assignmentId}`,
                );
                const [assignmentData, elementsData, actionsData] = response.data;

                setAssignment(assignmentData);
                setElements(elementsData || []);
                setAvailableActions(actionsData || []);
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
                console.error("Error fetching assignment data:", err);
                const message =
                    err.response?.data?.detail ||
                    err.message ||
                    "An unknown error occurred.";
                setGeneralError(`Failed to load assignment: ${message}`);
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
                "Input to extractCommandIds is not an array:",
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
                                "Skipping unexpected item within cycle:",
                                commandInCycle,
                            );
                        }
                    });
                }
            } else if (item && typeof item.id === "number") {
                ids.push(item.id);
            } else {
                console.warn("Skipping unexpected item in input array:", item);
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
        console.log(extractCommandIds(solution));
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
                    setSolutionError("Success!");
                } else {
                    setSolutionError("Ant did not reach the target.");
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
                        if (subCommand.name.includes("right")) nextDirection = "right";
                        else if (subCommand.name.includes("left")) nextDirection = "left";
                        else if (subCommand.name.includes("up")) {
                            nextDirection = "up";
                        }
                        else if (subCommand.name.includes("down")) {
                            nextDirection = "down";
                        }

                        if (
                            nextX < 1 ||
                            nextX > assignment.field_width ||
                            nextY < 1 ||
                            nextY > assignment.field_height
                        ) {
                            setSolutionError("The ant went out of bounds!");
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
                            setSolutionError("The ant hit a wall!");
                            setIsAnimating(false);
                            setAntPosition({ x: currentX, y: currentY });
                            return;
                        }

                        const positionKey = `${nextX},${nextY}`;
                        if (visitedPositions.has(positionKey)) {
                            setSolutionError("The ant is stuck in a loop!");
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
                            setSolutionError("Success!");
                            setIsAnimating(false);
                            return;
                        }

                        await new Promise((resolve) => setTimeout(resolve, 470));
                    }
                }
            } else {
                nextX += command.x_changes;
                nextY -= command.y_changes;
                if (command.name.includes("right")) nextDirection = "right";
                else if (command.name.includes("left")) nextDirection = "left";
                else if (command.name.includes("up")) nextDirection = "up";
                else if (command.name.includes("down")) nextDirection = "down";

                if (
                    nextX < 1 ||
                    nextX > assignment.field_width ||
                    nextY < 1 ||
                    nextY > assignment.field_height
                ) {
                    setSolutionError("The ant went out of bounds!");
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
                    setSolutionError("The ant hit a wall!");
                    setIsAnimating(false);
                    setAntPosition({ x: currentX, y: currentY });
                    return;
                }

                const positionKey = `${nextX},${nextY}`;
                if (visitedPositions.has(positionKey)) {
                    setSolutionError("The ant is stuck in a loop!");
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
                    setSolutionError("Success!");
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
                `Are you sure you want to delete assignment "${assignment?.name || assignmentId}"? This action cannot be undone.`,
            )
        ) {
            return;
        }

        setIsDeleting(true);
        setGeneralError(null);

        try {
            await axios.delete(
                `http://127.0.0.1:8000/assignment/?assignment_uuid=${assignmentId}`,
            );
            navigate(`/course/${courseId}`);
        } catch (err) {
            console.error("Error deleting current assignment:", err);
            const message =
                err.response?.data?.detail ||
                err.message ||
                "An unknown error occurred during deletion.";
            setGeneralError(`Failed to delete assignment: ${message}`);
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

        console.log(solutionData);

        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/create_solution/",
                solutionData,
            );
            setSolutionError("Solution submitted successfully!");
            console.log("Solution submitted:", response.data);
        } catch (err) {
            console.error("Error submitting solution:", err);
            const message =
                err.response?.data?.detail ||
                err.message ||
                "An unknown error occurred.";
            setSolutionError(`Failed to submit solution: ${message}`);
        }
    };

    if (loading) return <div className="loading">Loading assignment...</div>;
    if (generalError)
        return (
            <div className="error">
                {generalError} <Link to={`/course/${courseId}`}>Go back to course</Link>
            </div>
        );
    if (!assignment)
        return (
            <div className="error">
                Assignment data could not be loaded.{" "}
                <Link to={`/course/${courseId}`}>Go back to course</Link>
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
                    className={`solution-message ${solutionError === "Success!" || solutionError === "Solution submitted successfully!" ? "success" : "error"}`}
                >
                    {solutionError}
                </div>
            )}
            {isDeleting && <div className="loading">Deleting assignment...</div>}

            <div className="top-controls">
                <button
                    onClick={() => navigate(`/course/${courseId}`)}
                    title="Back to Course"
                    disabled={isDeleting || isAnimating}
                >
                    <FontAwesomeIcon icon={faHome} /> Course
                </button>
                <button
                    onClick={handlePreviousAssignment}
                    disabled={!canGoPrevious || isDeleting || isAnimating}
                    title="Previous Assignment"
                >
                    <FontAwesomeIcon icon={faArrowLeft} /> Prev
                </button>
                <button
                    onClick={handleNextAssignment}
                    disabled={!canGoNext || isDeleting || isAnimating}
                    title="Next Assignment"
                >
                    Next <FontAwesomeIcon icon={faArrowRight} />
                </button>
                {user && user.role_id === 2 && (
                    <>
                        <button
                            onClick={() => navigate(`/update-assignment/${assignmentId}`)}
                            className="edit-button"
                            title="Edit Assignment"
                            disabled={isDeleting || isAnimating}
                        >
                            <FontAwesomeIcon icon={faEdit} /> Edit
                        </button>
                        <button
                            onClick={handleDeleteCurrentAssignment}
                            className="delete-button"
                            title="Delete Assignment"
                            disabled={isDeleting || isAnimating}
                        >
                            <FontAwesomeIcon icon={faTrash} /> Delete
                        </button>
                    </>
                )}
            </div>
            <p className="assignment-description">
                {assignment.description || "No description provided."}
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
                            title="Run Solution"
                        >
                            <FontAwesomeIcon icon={isAnimating ? faStop : faPlay} />{" "}
                            {isAnimating ? "Running..." : "Run"}
                        </button>
                        <button
                            onClick={handleRestart}
                            disabled={isAnimating}
                            title="Clear Solution and Reset Ant"
                        >
                            <FontAwesomeIcon icon={faRedo} /> Reset All
                        </button>
                        <button
                            onClick={handleClearAll}
                            disabled={isAnimating || solution.length === 0}
                            title="Clear Solution Steps"
                        >
                            <FontAwesomeIcon icon={faBroom} /> Clear Steps
                        </button>
                        <button
                            onClick={handleSubmitSolution}
                            disabled={isAnimating || solution.length === 0}
                            title="Submit Solution"
                        >
                            <FontAwesomeIcon icon={faPaperPlane} /> Submit Solution
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
