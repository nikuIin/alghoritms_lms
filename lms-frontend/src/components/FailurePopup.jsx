// src/components/FailurePopup.jsx
import React from 'react';
import './FailurePopup.css';

const FailurePopup = ({ onRestart }) => {
    return (
        <div className="failure-popup">
            <div className="popup-content">
                <h2>Failure!</h2>
                <p>The ant failed to reach the destination.</p>
                <button onClick={onRestart}>Restart</button>
            </div>
        </div>
    );
};

export default FailurePopup;