// src/components/AssignmentCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import './AssignmentCard.css';

const AssignmentCard = ({ assignment }) => {
    return (
        <Link to={`/assignment/${assignment.assignment_id}`} className="assignment-card-link">
            <div className="assignment-card">
                <h4>{assignment.name}</h4>
                <p>Assignment ID: {assignment.assignment_id}</p>
                <p>Type: {assignment.assignment_type_id}</p>
                <p>Status: {assignment.status_id}</p>
            </div>
        </Link>
    );
};

export default AssignmentCard;
