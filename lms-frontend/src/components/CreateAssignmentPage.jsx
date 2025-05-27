import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CreateAssignmentPage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBug, faCube, faFlagCheckered } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const CreateAssignmentPage = () => {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [field_width, setFieldWidth] = useState(5);
    const [field_height, setFieldHeight] = useState(5);
    const [mapData, setMapData] = useState(createInitialMap(5, 5));

    const [selectedElement, setSelectedElement] = useState('ant');
    const [antPosition, setAntPosition] = useState(null);
    const [endPosition, setEndPosition] = useState(null);
    const [availableActions, setAvailableActions] = useState([]);
    const [selectedActions, setSelectedActions] = useState([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState(null);
    const [mapError, setMapError] = useState(null);
    const [complexityLevel, setComplexityLevel] = useState('normal'); // Default to 'normal'

    const [generateMode, setGenerateMode] = useState(false); // Track if generate mode is active
    const [wallQuantity, setWallQuantity] = useState(3); // Desired quantity of walls, default is 3
    const [autoSize, setAutoSize] = useState(false); // Automatic size adjustment

    useEffect(() => {
        const fetchAvailableActions = async () => {
            try {
                const response = await axios.get('http://127.0.0.1/api/all_actions');
                const actions = response.data;
                setAvailableActions(actions);
                setLoading(false);
            } catch (error) {
                setError(error.message);
                setLoading(false);
            }
        };

        fetchAvailableActions();
    }, []);

    const handleActionSelect = (actionId) => {
        setSelectedActions((prevSelected) => {
            if (prevSelected.includes(actionId)) {
                return prevSelected.filter((id) => id !== actionId);
            } else {
                return [...prevSelected, actionId];
            }
        });
    };

    const handleMapClick = (rowIndex, cellIndex) => {
        let rowNumber = rowIndex + 1;
        let cellNumber = cellIndex + 1;

        // Check if the cell is already occupied by a different element
        const isAnt = antPosition?.x === rowNumber && antPosition?.y === cellNumber;
        const isEnd = endPosition?.x === rowNumber && endPosition?.y === cellNumber;
        const isWall = mapData[rowIndex][cellIndex] === 1;

        switch (selectedElement) {
            case 'ant':
                if (!isEnd && !isWall) { // Prevent placing ant on end or wall
                    setAntPosition({ x: rowNumber, y: cellNumber });
                }
                break;
            case 'end':
                if (!isAnt && !isWall) { // Prevent placing end on ant or wall
                    setEndPosition({ x: rowNumber, y: cellNumber });
                }
                break;
            case 'wall':
                if (!isAnt && !isEnd) { //Prevent placing wall on ant or end
                    // Toggle the wall state
                    setMapData(prevMapData => {
                        const newMapData = prevMapData.map((row, rIndex) =>
                            rIndex === rowIndex ? row.map((cell, cIndex) => (cIndex === cellIndex ? (cell === 0 ? 1 : 0) : cell)) : row
                        );
                        return newMapData;
                    });
                }
                break;
            default:
                break;
        }
    };

    const renderMap = () => (
        <div className="map-container">
            {mapData.map((row, rowIndex) => (
                <div key={rowIndex} className="map-row">
                    {row.map((cell, cellIndex) => {
                        let rowNumber = rowIndex + 1;
                        let cellNumber = cellIndex + 1;
                        const isAnt = antPosition?.x === rowNumber && antPosition?.y === cellNumber;
                        const isEnd = endPosition?.x === rowNumber && endPosition?.y === cellNumber;

                        return (
                            <div key={cellIndex} className="map-cell" onClick={() => handleMapClick(rowIndex, cellIndex)}>
                                {isAnt && <FontAwesomeIcon icon={faBug} size="lg" />}
                                {isEnd && <FontAwesomeIcon icon={faFlagCheckered} size="lg" />}
                                {cell === 1 && <FontAwesomeIcon icon={faCube} size="lg" />}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if at least 4 actions are selected
        if (selectedActions.length < 4) {
            setActionError("Please select at least 4 actions.");
            setMapError(null);
            return;
        } else {
            setActionError(null);
        }

        // Check if ant and end positions are set
        if (!antPosition || !endPosition) {
            setMapError("Please place both the ant and the end position on the map.");
            setActionError(null);
            return;
        } else {
            setMapError(null);
        }

        setLoading(true);
        setError(null);

        try {
            const newAssignment = {
                course_id: courseId,
                name: name,
                assignment_type_id: 1,
                status_id: 1,
                field_width: parseInt(field_width),
                field_height: parseInt(field_height),
                level_complexity: complexityLevel,
                start_x: antPosition?.y,
                start_y: antPosition?.x,
                end_x: endPosition?.y,
                end_y: endPosition?.x,
                description: description,
                complexity: complexityLevel, // Include the complexity level
            };
            const response = await axios.post('http://127.0.0.1/api/assignment/', newAssignment);
            if (response.status === 200) {
                const assignmentId = response.data;

                const actionsData = {
                    actions_id: selectedActions,
                    assignment_uuid: assignmentId
                };
                console.log(actionsData);
                await axios.post('http://127.0.0.1/api/add_actions/', actionsData);

                const wallsData = [];
                mapData.forEach((row, rowIndex) => {
                    row.forEach((cell, cellIndex) => {
                        if (cell === 1) {
                            wallsData.push({
                                name: "wall",
                                element_id: 1,
                                pos_x: cellIndex + 1,
                                pos_y: rowIndex + 1,
                                assignment_id: assignmentId
                            });
                        }
                    });
                });

                await axios.post('http://127.0.0.1/api/add_elements/', wallsData);
            }

            setLoading(false);
            console.log(`Redirect to /course/${courseId}`)
            navigate(`/course/${courseId}`);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    function createInitialMap(width, height) {
        const initialMap = [];
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                row.push(0); // 0 represents an empty cell
            }
            initialMap.push(row);
        }
        return initialMap;
    }

    const addRow = () => {
        if (field_height < 15) {
            setFieldHeight(field_height + 1);
            setMapData([...mapData, Array(field_width).fill(0)]);
        }
    };

    const deleteRow = () => {
        if (field_height > 5) {
            setFieldHeight(field_height - 1);
            setMapData(mapData.slice(0, -1));
        }
    };

    const addColumn = () => {
        if (field_width < 15) {
            setFieldWidth(field_width + 1);
            setMapData(mapData.map(row => [...row, 0]));
        }
    };

    const deleteColumn = () => {
        if (field_width > 5) {
            setFieldWidth(field_width - 1);
            setMapData(mapData.map(row => row.slice(0, -1)));
        }
    };

    const generateTask = () => {
        // Determine map size
        const width = autoSize ? Math.floor(Math.random() * (25 - 5 + 1)) + 5 : field_width;
        const height = autoSize ? Math.floor(Math.random() * (25 - 5 + 1)) + 5 : field_height;

        // Create a new map
        const newMap = createInitialMap(width, height);
        let availableCells = [];
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                availableCells.push({ x: x + 1, y: y + 1 }); // Store as 1-based coordinates
            }
        }

        // Function to get a random available cell and remove it from the list
        const getRandomCell = () => {
            const randomIndex = Math.floor(Math.random() * availableCells.length);
            const cell = availableCells[randomIndex];
            availableCells.splice(randomIndex, 1);
            return cell;
        };

        // Place ant
        let newAntPosition = null;
        let cell = getRandomCell();
        newAntPosition = { x: cell.x, y: cell.y };
        const antRowIndex = cell.y - 1;
        const antCellIndex = cell.x - 1;

        // Place end
        let newEndPosition = null;
        cell = getRandomCell();
        newEndPosition = { x: cell.x, y: cell.y };
        const endRowIndex = cell.y - 1;
        const endCellIndex = cell.x - 1;

        //Update the map with ant and end
        newMap[antRowIndex][antCellIndex] = 2 // Mark as ant
        newMap[endRowIndex][endCellIndex] = 3  // Mark as end

        // Place walls
        let wallsPlaced = 0;
        while (wallsPlaced < wallQuantity && availableCells.length > 0) {
            cell = getRandomCell();
            const rowIndex = cell.y - 1;
            const cellIndex = cell.x - 1;
            if(
                cellIndex < height
                && rowIndex < width
                && newMap[cellIndex][rowIndex] !== 2
                && newMap[cellIndex][rowIndex] !== 3
            ) {
                newMap[rowIndex][cellIndex] = 1;
                wallsPlaced++;
            }
        }

        setFieldWidth(width);
        setFieldHeight(height);
        setMapData(newMap);
        setAntPosition(newAntPosition);
        setEndPosition(newEndPosition);
    };

    const handleWallQuantityChange = (e) => {
        let value = parseInt(e.target.value);

        // Проверяем, является ли value числом (NaN)
        if (isNaN(value)) {
            value = 0; // Или любое другое значение по умолчанию
        }

        // Ограничиваем значение сверху
        const max = Math.floor(field_height * field_width / 2)
        if (value > max) {
            value = max;
        }

        // Ограничиваем значение снизу
        if (value < 0) {
            value = 0;
        }

        setWallQuantity(value);
    };

    return (
        <div className="create-assignment-page">
            <h2>Create New Assignment</h2>

            {/* Manual Creation Form */}
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>

                <div>
                    <label htmlFor="complexityLevel">Complexity Level:</label>
                    <select
                        id="complexityLevel"
                        value={complexityLevel}
                        onChange={(e) => setComplexityLevel(e.target.value)}
                    >
                        <option value="easy">Лёгкий</option>
                        <option value="normal">Нормальный</option>
                        <option value="hard">Тяжелый</option>
                    </select>
                </div>

                <div className="actions-palette">
                    <h3>Available Actions</h3>
                    {availableActions.map((action) => (
                        <label key={action.action_id}>
                            <input
                                type="checkbox"
                                value={action.action_id}
                                checked={selectedActions.includes(action.action_id)}
                                onChange={() => handleActionSelect(action.action_id)}
                            />
                            {action.name}
                        </label>
                    ))}
                    {actionError && <p className="error">{actionError}</p>}
                </div>

                 <a className={"change_map"} onClick={() => setGenerateMode(!generateMode)}>
                        {generateMode ? 'Закрыть генерацию' : 'Сгенерировать автоматически'}
                    </a>
                    {generateMode && (
                        <div className="generate-settings">
                            <h3>Генерация задания</h3>
                            <div>
                                <label>
                                    Количество стен (максимальное {Math.floor(field_width * field_height / 2)}):
                                </label>
                                <input
                                    type="number"
                                    value={wallQuantity}
                                    onChange={handleWallQuantityChange}
                                    min="0"
                                    max={Math.floor(field_width * field_height / 2)}
                                />
                            </div>

                            <div className={"center"}>
                                <a className={"change_map"} onClick={generateTask}>Сгенерировать</a>
                            </div>
                        </div>
                    )}

                <div className="element-palette">
                    <a
                        onClick={() => setSelectedElement('ant')}
                        className={selectedElement === 'ant' ? 'selected' : 'add_element'}
                    >
                        <FontAwesomeIcon icon={faBug} size="lg" /> Ant
                    </a>
                    <a
                        onClick={() => setSelectedElement('end')}
                        className={selectedElement === 'end' ? 'selected' : 'add_element'}
                    >
                        <FontAwesomeIcon icon={faFlagCheckered} size="lg" /> End
                    </a>
                    <a
                        onClick={() => setSelectedElement('wall')}
                        className={selectedElement === 'wall' ? 'selected' : 'add_element'}
                    >
                        <FontAwesomeIcon icon={faCube} size="lg" /> Wall
                    </a>
                </div>
                <div className="map-controls">
                    <div>
                        <label htmlFor="field_width">Field Width ({field_width}):</label>
                        <a className="change_map" onClick={addColumn}>Add Column</a>
                        <a className="change_map" onClick={deleteColumn}>Delete Column</a>
                    </div>
                    <div>
                        <label htmlFor="field_height">Field Height ({field_height}):</label>
                        <a className="change_map" onClick={addRow}>Add Row</a>
                        <a className="change_map" onClick={deleteRow}>Delete Row</a>
                    </div>


                    <button type="button" onClick={() => navigate(`/course/${courseId}`)}>
                        Cancel
                    </button>
                </div>

                {mapError && <p className="error">{mapError}</p>}
                {renderMap()}
                <button type="submited" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </button>
            </form>


        </div>

    );
};

export default CreateAssignmentPage;
