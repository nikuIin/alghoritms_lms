import React from "react";
import { Link } from "react-router-dom";
import "./AssignmentCard.css";

const AssignmentCard = ({ courseId, assignment }) => {
  return (
    <Link
      to={`/assignment/${assignment.assignment_id}?course_id=${courseId}`}
      className="assignment-card"
    >
      <h3>{assignment.name}</h3>
      <p className="description">{assignment.description || "Без описания"}</p>
    </Link>
  );
};

export default AssignmentCard;
