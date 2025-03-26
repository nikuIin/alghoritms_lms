// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import UserProfile from './components/UserProfile';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import CoursesPage from "./components/CoursesPage.jsx";
import CreateCoursePage from "./components/CreateCoursePage.jsx";
import CourseDetailsPage from "./components/CourseDetailsPage.jsx";
import AssignmentPage from "./components/AssignmentPage.jsx";
import CreateAssignmentPage from "./components/CreateAssignmentPage.jsx";

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

function AppContent() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <div>Loading...</div>; // Show a loading indicator
    }

    return (
        <>
        <Header />
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
                <Route path="/profile" element={user ? <UserProfile /> : <Navigate to="/login" />} />
                <Route path="/" element={ <HomePage />} />
                <Route path="/courses" element={user ? <CoursesPage /> : <Navigate to="/login" />} />
                <Route
                    path="/create-course"
                    element={
                        user && user.role_id === 2 ? (
                            <CreateCoursePage />
                        ) : (
                            <Navigate to="/courses" /> // Redirect if not a teacher
                        )
                    }
                />
                <Route path="/course/:courseId" element={<CourseDetailsPage />} /> {}
                <Route path="/assignment/:assignmentId" element={<AssignmentPage />} /> {}
                <Route
                    path="/create-assignment/:courseId"
                    element={
                        user && user.role_id === 2 ? (
                            <CreateAssignmentPage/>
                        ) : (
                            <Navigate to="/" />
                        )
                    }
                />
            </Routes>
        </>
    );
}

function HomePage() {
    return <div>Добро пожаловать в школу алгоритмизации!</div>;
}

export default App;
