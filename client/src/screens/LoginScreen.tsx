import React, {useContext, useState} from "react";
import { useNavigate } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { ErrorContext } from '../controllers/CustomErrorHandler';

const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const navigate = useNavigate();

    // Custom Error
    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("HomeScreen must be used within a CustomErrorHandler");
    }

    const { setError } = errorContext;


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await axios.post(
                "http://localhost:5000/user/login",
                { username, password },
                { withCredentials: true }
            );
            console.log("Login successful:", response.data);
            navigate('/');
        } catch (err) {
            const error = err as AxiosError<{ message?: string }>;
            if (axios.isAxiosError(error)) {
                setError(new Error(error.response?.data.message || "Login failed"));
            } else {
                setError(new Error("An unexpected error occurred"));
            }
        }
    };

    return (
        <div>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                />
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

export default LoginScreen;
