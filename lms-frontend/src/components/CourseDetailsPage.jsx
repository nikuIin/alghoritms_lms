// src/components/CourseDetailsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDetailsPage.css'; // Create this CSS file

const CourseDetailsPage = () => {
    const { courseId } = useParams();  // Get courseId from URL params
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

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
                    setError("Course not found.");
                } else {
                    setError(err.message);
                }
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [courseId]);  // Run effect when courseId changes

    if (loading) {
        return <div>Loading course details...</div>;
    }

    if (error) {
        return <div>Error: {error} <button onClick={() => navigate(-1)}>Go Back</button></div>;
    }

    if (!course) {
        return <div>Course not found.</div>;  // Should not reach here if error is handled correctly
    }

    return (
        <div className="course-details-page">
            <h2>{course.name}</h2>
            <p>Course ID: {course.course_id}</p>
            <p>Owner: {course.owner}</p>
            <p>Description: {course.description || "No description available."}</p>
            <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
    );
};

export default CourseDetailsPage;