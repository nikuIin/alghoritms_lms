// src/components/Chessboard.jsx
import React from 'react';
import './Chessboard.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBug, faCube, faFlagCheckered } from '@fortawesome/free-solid-svg-icons';

const Chessboard = ({ width, height, walls, antPosition, start, end, antDirection }) => { // Add antDirection prop
    const renderCell = (x, y) => {
        let isWall = false;
        if(walls != null){
            isWall = walls.some(wall => wall.pos_x === x && wall.pos_y === y)
        }

        const isStart = start.x === x && start.y === y;
        const isEnd = end.x === x && end.y === y;
        const isAnt = antPosition.x === x && antPosition.y === y;

        let cellClass = 'cell';
        if (isWall) cellClass += ' wall';
        if (isStart) cellClass += ' start';
        if (isEnd) cellClass += ' end';
        if (isAnt) cellClass += ' ant';

        let antRotation = 0;
        if (antDirection === 'right') {
            antRotation = 90;
        } else if (antDirection === 'left') {
            antRotation = 270;
        } else if (antDirection === 'up') {
            antRotation = 0;
        } else if (antDirection === 'down') {
            antRotation = 180;
        }

        const antStyle = {
            transform: `rotate(${antRotation}deg)`
        };

        return (
            <td key={`${x}-${y}`} className={cellClass}>
                {isEnd && <FontAwesomeIcon icon={faFlagCheckered} size="lg" />} {/* End Icon */}
                {isWall && <FontAwesomeIcon icon={faCube} size="lg" />} {/* Wall Icon */}
                {isAnt && <FontAwesomeIcon icon={faBug} size="lg" style={antStyle} />} {/* Ant Icon with rotation */}
            </td>
        );
    };

    const renderBoard = () => {
        const board = [];
        for (let y = 1; y <= height; y++) {
            const row = [];
            for (let x = 1; x <= width; x++) {
                row.push(renderCell(x, y));
            }
            board.push(<tr key={y} className="row">{row}</tr>);
        }
        return board;
    };

    return (
        <table className="chessboard">
            <tbody>{renderBoard()}</tbody>
        </table>
    );
};

export default Chessboard;
