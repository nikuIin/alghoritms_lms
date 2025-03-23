// src/components/CoursesPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './CoursesPage.css';
import {Link} from "react-router-dom"; // Create CSS for styling

const CoursesPage = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);  // Set loading to true at the start
            setError(null);      // Clear any existing errors

            try {
                if (!user) {
                    setError("User not logged in.");
                    setLoading(false);
                    return;
                }

                let apiUrl = '';
                if (user.role_id === 1) {
                    // Student: Fetch user-specific courses
                    apiUrl = `http://127.0.0.1:8000/courses-user/${user.user_login}/`;
                } else if (user.role_id === 2) {
                    // Teacher: Fetch all courses
                    apiUrl = 'http://127.0.0.1:8000/courses';
                } else {
                    setError("Unknown user role.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get(apiUrl);
                setCourses(response.data);
                setLoading(false);
            } catch (err) {
                if (user.role_id === 1 && err.response && err.response.status === 404) {
                    // Handle 404 error: no courses found for the user
                    setCourses([]); //Set an empty list
                    setError("No courses found for this user.");
                }
                else {
                    setError(err.message);
                }
                setLoading(false);
            }
        };

        fetchCourses();
    }, [user]); // Dependency array now includes user

    if (loading) {
        return <div>Загружаем курсы...</div>;
    }

    if (error) {
        return <>
             <div>Вы пока не записаны ни на один курс</div>{user && user.role_id === 2 && (
                <Link to="/create-course">Add Course</Link>
            )}
        </>

    }

    return (
        <div className="courses-page">
            <h2>{user && user.role_id === 1 ? 'Мои курсы' : 'List of Courses'}</h2>

            {user && user.role_id === 2 && (
                <Link to="/create-course">Add Course</Link>
            )}

            <ul className="courses-list">
                {courses.map(course => (
                    <li key={course.course_id} className="course-item">
                        <Link to={`/course/${course.course_id}`}> {/* Make the whole card a link */}
                            <h3>{course.name}</h3>
                            <p>{course.description}</p>
                            <p>Owner: {course.owner}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default CoursesPage;
