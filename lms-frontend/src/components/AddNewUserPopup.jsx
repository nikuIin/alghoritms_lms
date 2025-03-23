// src/components/AddNewUserPopup.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AddNewUserPopup.css';

const AddNewUserPopup = ({ onClose }) => {
    const [user_login, setUserLogin] = useState('');
    const [first_name, setFirstName] = useState('');
    const [second_name, setSecondName] = useState('');
    const [patronymic, setPatronymic] = useState(null);
    const [additional_info, setAdditionalInfo] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState(null);
    const [role_id, setRoleId] = useState(1); // Default to role 1 (Student)
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(''); // New state

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const newUser = {
                user_login: user_login,
                first_name: first_name,
                second_name: second_name,
                patronymic: patronymic,
                additional_info: additional_info,
                email: email,
                registration_date: Date.now(),
                phone: phone,
                role_id: parseInt(role_id), // Ensure role_id is an integer
                password: password,
            };

            const response = await axios.post('http://127.0.0.1:8000/create/', newUser);

            setLoading(false);
            setSuccessMessage('User created successfully!'); // Set success message
            //onClose(); // Remove this line, we want to show the message

        } catch (err) {
            setLoading(false);
            if (err.response && err.response.status === 409) {
                setError(err.response.data.detail || "User already exists.");
            } else {
                setError(err.message);
            }
        }
    };

    return (
        <div className="add-new-user-popup">
            <div className="popup-content">
                <h2>Add New User</h2>
                {error && <div className="error">{error}</div>}
                {successMessage && <div className="success">{successMessage}</div>} {/* Display success message */}
                <form className={'add_user_form'} onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="user_login">User Login:</label>
                        <input type="text" id="user_login" value={user_login} onChange={(e) => setUserLogin(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="first_name">First Name:</label>
                        <input type="text" id="first_name" value={first_name} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="second_name">Second Name:</label>
                        <input type="text" id="second_name" value={second_name} onChange={(e) => setSecondName(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="patronymic">Patronymic (Optional):</label>
                        <input type="text" id="patronymic" value={patronymic} onChange={(e) => setPatronymic(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="additional_info">Additional Info (Optional):</label>
                        <input type="text" id="additional_info" value={additional_info} onChange={(e) => setAdditionalInfo(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="email">Email:</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label htmlFor="phone">Phone (Optional):</label>
                        <input type="text" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div>
                        <label htmlFor="role_id">Role:</label>
                        <select id="role_id" value={role_id} onChange={(e) => setRoleId(e.target.value)}>
                            <option value="1">Student</option>
                            <option value="2">Teacher</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="password">Password:</label>
                        <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>

                    <div className="buttons">
                        <button type="submit" disabled={loading}>
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                        <button type="button" onClick={onClose} disabled={loading}>
                            Закрыть
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddNewUserPopup;
