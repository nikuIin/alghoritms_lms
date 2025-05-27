// src/components/CreateCoursePage.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./CreateCoursePage.css"; // Create this CSS

const CreateCoursePage = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const newCourse = {
        name: name,
        owner: user.user_login, // Assuming the owner is the current user
        course_id: "string", //Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // You might want to generate a UUID here
        status_id: 1, // You may want to make this configurable too
        description: description,
      };

      await axios.post("http://127.0.0.1/api/courses/", newCourse);

      setLoading(false);
      navigate("/courses"); // Redirect back to the courses page after success
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="create-course-page">
      <h2>Создание курса</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Название:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="description">Описание:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="buttons">
          <button type="submit" disabled={loading}>
            {loading ? "Создание..." : "Создать"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            disabled={loading}
          >
            Отменить
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCoursePage;
