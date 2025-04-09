import React, {useContext} from "react";
import { useState } from "react";
import axios, {AxiosResponse} from "axios";

import { useNavigate } from "react-router-dom";
import {ErrorContext} from "../controllers/CustomErrorHandler";
import '../styles/registerpage.css'; // Import the CSS file

const RegisterScreen: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const navigate = useNavigate();

    // Custom Error
    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("RegisterScreen must be used within a CustomErrorHandler");
    }

    const { setError } = errorContext;

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError(new Error("Passwords do not match"));
            return;
        }
        try {
            const response: AxiosResponse<void> = await axios.post("http://localhost:5000/user/register", {
                username,
                password,
            }, {withCredentials: true});
            console.log("Registration successful:", response.data);
            // Redirect to home page
            navigate('/');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(new Error(error.response?.data.message || "Registration failed"));
            } else {
                setError(new Error("An unexpected error occurred"));
            }
        }
    };

    return (
        <div className="register-screen">
            <h1 className="register-title">Register</h1>
            <form className="register-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label" htmlFor="username">Username:</label>
                    <input
                        className="form-input"
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}

                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="password">Password:</label>
                    <input
                        className="form-input"
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">Confirm Password:</label>
                    <input
                        className="form-input"
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <button className="register-button" type="submit">Register</button>
            </form>
        </div>
    )
}

export default RegisterScreen;