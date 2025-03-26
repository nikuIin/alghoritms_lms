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
    const [mapError, setMapError] = useState(null); // New state for map-related errors

    useEffect(() => {
        const fetchAvailableActions = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:8000/all_actions');
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
        if (field_height < 25) {
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
        if (field_width < 25) {
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
            setMapError(null); // Clear any previous map error
            return;
        } else {
            setActionError(null); // Clear any previous action error
        }

        // Check if ant and end positions are set
        if (!antPosition || !endPosition) {
            setMapError("Please place both the ant and the end position on the map.");
            setActionError(null); // Clear any previous action error
            return;
        } else {
            setMapError(null); // Clear any previous map error
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
                start_x: antPosition?.y, // Use optional chaining
                start_y: antPosition?.x, // Use optional chaining
                end_x: endPosition?.y,     // Use optional chaining
                end_y: endPosition?.x,     // Use optional chaining
                description: description,
            };
            const response = await axios.post('http://127.0.0.1:8000/assignment/', newAssignment);
            if (response.status === 200) {
                const actionsData = {
                    actions_id: selectedActions,
                    assignment_uuid: response.data
                };
                console.log(actionsData);
                await axios.post('http://127.0.0.1:8000/add_actions/', actionsData);
            }

            setLoading(false);
            navigate(`/course/${courseId}`);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="create-assignment-page">
            <h2>Create New Assignment</h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name">Name:</label>
                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required />
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
                {/* Map part */}
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
                {mapError && <p className="error">{mapError}</p>} {/* Display map error */}
                {renderMap()}
                <button type="submited" disabled={loading}>
                    {loading ? 'Creating...' : 'Create'}
                </button>
            </form>
        </div>
    );
};

export default CreateAssignmentPage;
