// src/components/CourseDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import AddUsersToCoursePopup from './AddUsersToCoursePopup';
import './CourseDetailsPage.css';
import AssignmentCard from './AssignmentCard';

const CourseDetailsPage = () => {
    // ... (existing state and useEffect) ...
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const [showAddUsersPopup, setShowAddUsersPopup] = useState(false);
    const [assignments, setAssignments] = useState([]);

    useEffect(() => {
        const fetchCourseDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`http://127.0.0.1:8000/course/${courseId}/`);
                setCourse(response.data);

                const assignmentsResponse = await axios.get(`http://127.0.0.1:8000/assignments/?course_uuid=${courseId}`);
                setAssignments(assignmentsResponse.data);

                setLoading(false);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError("Course not found.");
                } else {
                    setError(err.message);
                }
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [courseId]);

    const handleAddUsersClick = () => {
        setShowAddUsersPopup(true);
    };

    const handleCloseAddUsersPopup = () => {
        setShowAddUsersPopup(false);
    };
    return (
        <div className="course-details-page">
            <h2>{course?.name}</h2>
            <p>Course ID: {course?.course_id}</p>
            <p>Owner: {course?.owner}</p>
            <p>Description: {course?.description || "No description available."}</p>

            {user && user.role_id === 2 && (
                <>
                    <button onClick={handleAddUsersClick}>Add Users to Course</button>
                    <Link to={`/create-assignment/${courseId}`}>Create Assignment</Link> {/* New Button */}
                </>
            )}

            <button onClick={() => navigate(-1)}>Go Back</button>

            {showAddUsersPopup && (
                <AddUsersToCoursePopup
                    courseId={courseId}
                    onClose={handleCloseAddUsersPopup}
                    onUsersAdded={() => {
                        setShowAddUsersPopup(false);
                    }}
                />
            )}

            <h3>Assignments</h3>
            <div className="assignments-container">
                {assignments.map(assignment => (
                    <AssignmentCard
                        courseId={courseId}
                        key={assignment.assignment_id}
                        assignment={assignment}
                    />
                ))}
            </div>
        </div>
    );
};

export default CourseDetailsPage;
