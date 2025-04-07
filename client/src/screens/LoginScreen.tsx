import React from "react";
import axios from "axios";
import { useState } from "react";

import { useNavigate } from "react-router-dom";


const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await axios.post("http://localhost:5000/user/login", {
                username,
                password,
            }, {withCredentials: true});
            console.log("Login successful:", response.data);
            navigate('/');
        }
        catch (error) {
            if (axios.isAxiosError(error)) {
                setError(error.response?.data.message || "Login failed");
            } else {
                setError("An unexpected error occurred");
            }
        }
    }
    return (
        <div>
            <h1>Login</h1>
            <form>
                <div>
                    <label htmlFor="username">Username:</label>
                    <input type="text" id="username" name="username" />
                </div>
                <div>
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" name="password" />
                </div>
                <button onClick={handleSubmit} type="submit">Login</button>
                {error && <p style={{ color: "red" }}>{error}</p>}
            </form>
        </div>
    )
}

export default LoginScreen;