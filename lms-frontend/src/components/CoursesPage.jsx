import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import "./CoursesPage.css";

const API_BASE_URL = "http://127.0.0.1/api";

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError(null);

      if (!user) {
        setError("Пожалуйста, войди в систему! 😊");
        setLoading(false);
        return;
      }

      try {
        const apiUrl =
          user.role_id === 1
            ? `${API_BASE_URL}/courses-user/${user.user_login}/`
            : `${API_BASE_URL}/courses`;
        const response = await axios.get(apiUrl);
        setCourses(response.data);
        setLoading(false);
      } catch (err) {
        if (user.role_id === 1 && err.response?.status === 404) {
          setCourses([]);
          setError("Ой, ты пока не записан ни на один курс! 😔");
        } else {
          setError("Не удалось загрузить курсы. Попробуй позже! 😕");
        }
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загружаем курсы...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        {user?.role_id === 2 && (
          <Link to="/create-course" className="add-course-button">
            <FontAwesomeIcon icon={faPlus} /> Создать курс
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="courses-page">
      <div className="header">
        <h1>{user?.role_id === 1 ? "Мои курсы" : "Все курсы"}</h1>
        {user?.role_id === 2 && (
          <Link to="/create-course" className="add-course-button">
            <FontAwesomeIcon icon={faPlus} /> Создать курс
          </Link>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="no-courses">
          <p>
            {user?.role_id === 1
              ? "Ты пока не записан на курсы. Попроси учителя добавить тебя! 😊"
              : "Курсов пока нет. Создай новый! 🚀"}
          </p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <Link
              to={`/course/${course.course_id}`}
              key={course.course_id}
              className="course-card"
            >
              <h3>{course.name}</h3>
              <p className="description">
                {course.description || "Без описания"}
              </p>
              <p className="owner">Автор: {course.owner}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesPage;
