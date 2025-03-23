// src/components/CourseDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import AddUsersToCoursePopup from './AddUsersToCoursePopup'; // Import popup
import './CourseDetailsPage.css';

const CourseDetailsPage = () => {
    const { courseId } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth(); // Get user from auth context
    const [showAddUsersPopup, setShowAddUsersPopup] = useState(false);

    useEffect(() => {
       const fetchCourseDetails = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await axios.get(`http://127.0.0.1:8000/course/${courseId}/`);
                setCourse(response.data);
                setLoading(false);
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    setError("Курс не найден.");
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
            <h2>{course?.name}</h2> {/* Use optional chaining */}
            <p>Учитель: {course?.owner}</p>
            <p>Описание: {course?.description || "Описание отсутствует."}</p>

            {user && user.role_id === 2 && (
                <button onClick={handleAddUsersClick}>Добавить пользователя на курс</button>
            )}

            <button onClick={() => navigate(-1)}>Назад</button>

            {showAddUsersPopup && (
                <AddUsersToCoursePopup
                    courseId={courseId}
                    onClose={handleCloseAddUsersPopup}
                    onUsersAdded={() => {
                        setShowAddUsersPopup(false);
                    }}
                />
            )}
        </div>
    );
};

export default CourseDetailsPage;
