import React from "react";
import { useState } from "react";
import axios from "axios";

import { useNavigate } from "react-router-dom";

const RegisterScreen: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            const response = await axios.post("http://localhost:5000/user/register", {
                username,
                password,
            });
            console.log("Registration successful:", response.data);
            // Redirect to home page
            navigate('/');
        } catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data.message || "Registration failed");
            } else {
                setError("An unexpected error occurred");
            }
        }
        finally {
            setUsername("");
            setPassword("");
            setConfirmPassword("");
        }
    };

    return (
        <div>
            <h1>Register</h1>
            <form>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" />
                </div>
                <div>
                    <label htmlFor="confirmPassword">Confirm Password:</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" />
                </div>
                <button onClick={handleSubmit} type="submit">Register</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
        </div>
    )
}

export default RegisterScreen;