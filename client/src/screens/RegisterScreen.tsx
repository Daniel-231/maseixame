import React, {useContext} from "react";
import { useState } from "react";
import axios, {AxiosResponse} from "axios";

import { useNavigate } from "react-router-dom";
import {ErrorContext} from "../controllers/CustomErrorHandler";

const RegisterScreen: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    //const [error, setError] = useState("");

    const navigate = useNavigate();

    // Custom Error
    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("HomeScreen must be used within a CustomErrorHandler");
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
        <div>
            <h1>Register</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={username}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}

                    />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    />
                </div>
                <button type="submit">Register</button>
            </form>

        </div>
    )
}

export default RegisterScreen;