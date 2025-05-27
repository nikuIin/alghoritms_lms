// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = Cookies.get('AccessToken');
            if (token) {
                try {
                    // Decode the token to get the user_login
                    const base64Url = token.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const payload = JSON.parse(jsonPayload);

                    // Check token expiration
                    const expiry = payload.exp; // Expiration timestamp
                    if (Date.now() >= expiry * 1000) { // Check if expired (convert seconds to milliseconds)
                        console.log("Token has expired.");
                        Cookies.remove('AccessToken');
                        setUser(null);
                        setIsLoading(false);
                        return; // Exit the function
                    }

                    // Extract user_login from the 'sub' string using string manipulation
                    const subString = payload.sub;
                    const userLogin = subString.substring(2, subString.length - 5);

                    // Fetch user data using the login
                    const response = await axios.get(`http://127.0.0.1/api/user/${userLogin}/`);

                    setUser(response.data);
                    setIsLoading(false);
                } catch (error) {
                    console.error("Authentication check failed:", error);
                    setUser(null);
                    Cookies.remove('AccessToken');
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (loginData) => {
        try {
            const response = await axios.post('http://127.0.0.1/api/login/', loginData);
            Cookies.set('AccessToken', response.data.access_token);

            // Decode the token to get the user_login
            const base64Url = response.data.access_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const payload = JSON.parse(jsonPayload);

            // Extract user_login from the 'sub' string using string manipulation
            const subString = payload.sub;
            const userLogin = subString.substring(2, subString.length - 5);

            // Fetch user data using the login
            const userDataResponse = await axios.get(`http://127.0.0.1/api/user/${userLogin}/`);
            setUser(userDataResponse.data);

            return true; // signal success
        } catch (error) {
            console.error("Login failed:", error);
            Cookies.remove('AccessToken');
            setUser(null);
            throw error; //Re-throw the error to be handled in the component
        }
    };

    const logout = () => {
        Cookies.remove('AccessToken');
        setUser(null);
    };

    const value = {
        user,
        login,
        logout,
        isLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

