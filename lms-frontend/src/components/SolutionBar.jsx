// src/components/SolutionBar.jsx
import React from 'react';
import './SolutionBar.css';

const SolutionBar = ({ solution, onSolutionRemove }) => {
    const handleSolutionClick = (index) => {
        onSolutionRemove(index); // Call the onSolutionRemove prop with the index
    };

    return (
        <div className="solution-bar">
            <h3>Solution</h3>
            {solution.map((command, index) => (
                <div
                    key={index}
                    className="solution-item"
                    onClick={() => handleSolutionClick(index)} // Add onClick handler
                >
                    {command.name}
                </div>
            ))}
        </div>
    );
};

export default SolutionBar;
