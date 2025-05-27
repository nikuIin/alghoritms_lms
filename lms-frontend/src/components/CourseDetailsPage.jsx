import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faArrowLeft, faBook } from "@fortawesome/free-solid-svg-icons";
import AddUsersToCoursePopup from "./AddUsersToCoursePopup";
import AssignmentCard from "./AssignmentCard";
import "./CourseDetailsPage.css";

const API_BASE_URL = "http://backend-cnt/api";

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddUsersPopup, setShowAddUsersPopup] = useState(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const courseResponse = await axios.get(
          `${API_BASE_URL}/course/${courseId}/`,
        );
        setCourse(courseResponse.data);

        const assignmentsResponse = await axios.get(
          `${API_BASE_URL}/assignments/?course_uuid=${courseId}`,
        );
        setAssignments(assignmentsResponse.data);

        setLoading(false);
      } catch (err) {
        setError(
          err.response?.status === 404
            ? "Ой, курс не найден! 😔"
            : "Не удалось загрузить курс. Попробуй позже! 😕",
        );
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Загружаем курс...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <Link to="/courses" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Вернуться к курсам
        </Link>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="error-container">
        <p>Курс не найден.</p>
        <Link to="/courses" className="back-link">
          <FontAwesomeIcon icon={faArrowLeft} /> Вернуться к курсам
        </Link>
      </div>
    );
  }

  return (
    <div className="course-details-page">
      <div className="header">
        <h1>{course.name}</h1>
        <Link to="/courses" className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Назад
        </Link>
      </div>

      <div className="course-info">
        <p className="description">
          {course.description || "О курсе пока ничего не написано! 😊"}
        </p>
        <p className="owner">Автор: {course.owner}</p>
      </div>

      {user?.role_id === 2 && (
        <div className="actions">
          <button
            onClick={handleAddUsersClick}
            className="action-button add-users"
          >
            <FontAwesomeIcon icon={faPlus} /> Добавить пользователей
          </button>
          <Link
            to={`/create-assignment/${courseId}`}
            className="action-button create-assignment"
          >
            <FontAwesomeIcon icon={faBook} /> Создать задание
          </Link>
        </div>
      )}

      {showAddUsersPopup && (
        <AddUsersToCoursePopup
          courseId={courseId}
          onClose={handleCloseAddUsersPopup}
          onUsersAdded={() => setShowAddUsersPopup(false)}
        />
      )}

      <div className="assignments-section">
        <h2>Задания</h2>
        {assignments.length === 0 ? (
          <p className="no-assignments">
            Заданий пока нет.{" "}
            {user?.role_id === 2
              ? "Создай первое! 🚀"
              : "Жди новых заданий! 😊"}
          </p>
        ) : (
          <div className="assignments-grid">
            {assignments.map((assignment) => (
              <AssignmentCard
                courseId={courseId}
                key={assignment.assignment_id}
                assignment={assignment}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage;
