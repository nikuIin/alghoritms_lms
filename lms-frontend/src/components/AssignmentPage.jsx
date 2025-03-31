// src/components/AssignmentPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Chessboard from './Chessboard';
import CommandsBar from './CommandsBar';
import SolutionBar from './SolutionBar';
import './AssignmentPage.css';


const AssignmentPage = () => {
    const { assignmentId} = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [elements, setElements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [solution, setSolution] = useState([]);
    const [antPosition, setAntPosition] = useState(null);
    const [solutionError, setSolutionError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [antDirection, setAntDirection] = useState('right');
    const [assignments, setAssignments] = useState([]); // List of all assignments in the course
    const [currentAssignmentIndex, setCurrentAssignmentIndex] = useState(-1); // Index of current assignment
    const courseId = new URLSearchParams(window.location.search).get('course_id')
    useEffect(() => {
        const fetchAssignmentData = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch all assignments for the course
                // Make sure that 0195bf17-2c65-74d9-9ab7-e5712b6d5ab2 its a cource ID
                const assignmentsResponse = await axios.get(`http://127.0.0.1:8000/assignments/?course_uuid=0195bf17-2c65-74d9-9ab7-e5712b6d5ab2`);

                setAssignments(assignmentsResponse.data);

                // 2. Find the index of the current assignment
                const currentIndex = assignmentsResponse.data.findIndex(
                    (a) => a.assignment_id === assignmentId
                );
                setCurrentAssignmentIndex(currentIndex);

                // 3. Fetch the full assignment data (now that we have assignments)
                const response = await axios.get(`http://127.0.0.1:8000/full_assignment/${assignmentId}`);
                setAssignment(response.data[0]);
                setElements(response.data[1]);
                setAntPosition({ x: response.data[0].start_x, y: response.data[0].start_y });
                setAntDirection('right');

                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchAssignmentData();
    }, [assignmentId]);

    const handleCommandClick = (command) => {
        setSolution([...solution, command]);
        setSolutionError('');
    };

    const handleSolutionRemove = (index) => {
        const newSolution = [...solution];
        newSolution.splice(index, 1);
        setSolution(newSolution);
        setSolutionError('');
    };

    const handleRunSolution = async () => {
        setSolutionError('');
        setIsAnimating(true);
        setAntPosition({ x: assignment.start_x, y: assignment.start_y });
        setAntDirection('right'); // Reset direction

        let currentX = assignment.start_x;
        let currentY = assignment.start_y;
        let commandIndex = 0;

        const executeStep = () => {
            if (commandIndex >= solution.length) {
                setIsAnimating(false);
                setSolutionError("No solution");
                return; // End of commands
            }

            const command = solution[commandIndex];

            //Update Ant direction based on command
            let newDirection = antDirection;

            if (command.name === "Step right" || command.name === "Jump right") {
                newDirection = 'right';
            } else if (command.name === "Step left" || command.name === "Jump left") {
                newDirection = 'left';
            } else if (command.name === "Step up") {
                newDirection = 'up';
            } else if (command.name === "Step down") {
                newDirection = 'down';
            }
            setAntDirection(newDirection);

            const newX = currentX + command.x_changes;
            const newY = currentY + command.y_changes;

            //is the step breaking bonduries
            if (newX < 1 || newX > assignment.field_width || newY < 1 || newY > assignment.field_height) {
                console.log("Out of bounds!");
                setSolutionError("The ant overstepped the boundary!");
                setIsAnimating(false);
                return; // Stop execution
            }

            //is the step smashing the ant into a wall
            let isWallCollision = false
            if(elements != null){
                isWallCollision = elements.some(element =>
                element.element_id === 1 && element.pos_x === newX && element.pos_y === newY
            );
            }


            if (isWallCollision) {
                console.log("Wall collision!");
                setSolutionError("The ant ran into a wall!");
                setIsAnimating(false);
                return; // Stop execution
            }
            //no errors lets execute
            currentX = newX;
            currentY = newY;

            setAntPosition({x: currentX, y: currentY})
            //if ant is not running outside and not smashing wall we can test for victory and we did it then return Success
            if (currentX === assignment.end_x && currentY === assignment.end_y) {
                console.log("Success");
                setSolutionError("Success");
                setIsAnimating(false);
                return; // End execution
            }
            //go on running
            commandIndex++;
            setTimeout(executeStep, 500);
        };
        executeStep(); // Start the execution process
    };

    const handleRestart = () => {
        setSolution([]);
        setAntPosition({ x: assignment.start_x, y: assignment.start_y });
        setAntDirection('right'); // Reset direction
        setSolutionError('');
        setIsAnimating(false);
    };

    const handleClearAll = () => {
        setSolution([]);
        setAntPosition({ x: assignment.start_x, y: assignment.start_y });
        setAntDirection('right'); // Reset direction
        setSolutionError('');
        setIsAnimating(false);
    };

    const handlePreviousAssignment = () => {
        const previousIndex = currentAssignmentIndex - 1;
        setSolution([])
        if (previousIndex >= 0) {
            navigate(`/assignment/${assignments[previousIndex].assignment_id}?course_id=${courseId}`);
        }
    };

    const handleNextAssignment = () => {
        setSolution([])
        const nextIndex = currentAssignmentIndex + 1;
        if (nextIndex < assignments.length) {
            navigate(`/assignment/${assignments[nextIndex].assignment_id}?course_id=${courseId}`);
        }
    };

    if (loading) {
        return <div>Loading assignment...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!assignment) {
        return <div>Assignment not found.</div>;
    }

    return (
        <div className="assignment-page">
            <h2>{assignment.name}</h2>
            {solutionError && <div className="solution-error">{solutionError}</div>}

            <div className="navigation-buttons">
                <button onClick={() => navigate(`/course/${courseId}`)}>Exit</button>
                {currentAssignmentIndex > 0 && (
                    <button onClick={handlePreviousAssignment}>Previous Assignment</button>
                )}
                {currentAssignmentIndex < assignments.length - 1 && (
                    <button onClick={handleNextAssignment}>Next Assignment</button>
                )}
            </div>

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
            </div>

            <div className="commands-area">
                <CommandsBar onCommandClick={handleCommandClick} />
                <SolutionBar solution={solution} onSolutionRemove={handleSolutionRemove} />
                <button onClick={handleClearAll}>Clear All</button>
                <button onClick={handleRunSolution} disabled={isAnimating}>
                    {isAnimating ? "Running..." : "Run Solution"}
                </button>
            </div>
        </div>
    );
};

export default AssignmentPage;
