// src/components/AddUsersToCoursePopup.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddUsersToCoursePopup.css'; // Create this CSS

const AddUsersToCoursePopup = ({ courseId, onClose, onUsersAdded }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [usersInCourse, setUsersInCourse] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState(''); // New state for the search term

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);

            try {
                // 1. Fetch all users (replace with your actual endpoint)
                const allUsersResponse = await axios.get('http://127.0.0.1/api/users_logins');
                setAllUsers(allUsersResponse.data);

                // 2. Fetch users already in the course
                const usersInCourseResponse = await axios.get(`http://127.0.0.1/api/users_from_course/${courseId}`);
                setUsersInCourse(usersInCourseResponse.data);


                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchUsers();
    }, [courseId]);

    const handleCheckboxChange = (userLogin) => {
        setSelectedUsers(prevSelected => {
            if (prevSelected.includes(userLogin)) {
                return prevSelected.filter(u => u !== userLogin); // Deselect
            } else {
                return [...prevSelected, userLogin]; // Select
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const payload = {
                users: selectedUsers,
                course_uuid: courseId,
            };

            await axios.post('http://127.0.0.1/api/register_users/', payload);


            setLoading(false);
            onUsersAdded();
            onClose();
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    // Filter users based on the search term
    const filteredUsers = allUsers.filter(user =>
        user.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return <div className="add-users-popup">Загрузка пользователей...</div>;
    }

    if (error) {
        return <div className="add-users-popup">Ошибка: {error}</div>;
    }

    return (
        <div className="add-users-popup">
            <div className="popup-content">
                <h2>Добавление на курс</h2>

                {/* Search Input */}
                <input
                    type="text"
                    placeholder="Поиск пользователя..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="search-input"
                />

                <form onSubmit={handleSubmit}>
                    <ul>
                        {filteredUsers.map(user => {  // Use filteredUsers
                            const isInCourse = usersInCourse.includes(user);
                            const isSelected = selectedUsers.includes(user);
                            return (
                                <li key={user}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={user}
                                            checked={isInCourse || isSelected}
                                            disabled={isInCourse}
                                            onChange={() => handleCheckboxChange(user)}
                                        />
                                        {user} {isInCourse ? "(Уже на курсе)" : ""}
                                    </label>
                                </li>
                            );
                        })}
                    </ul>

                    <div className="buttons">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Добавление...' : 'Добавить на курс'}
                        </button>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddUsersToCoursePopup;
