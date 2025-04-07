import React from "react";
import axios from "axios";
import useAuthCheck from "../controllers/useAuthCheck";

const Navbar = () => {
    const { status: isLoggedIn, loading } = useAuthCheck();

    if (loading) return null; // ✅ Safe now :)

    const HandleLogout: () => Promise<void> = async (): Promise<void> => {
        try {
            await axios.post("http://localhost:5000/user/logout", null, {
                withCredentials: true,
            });
            window.location.reload();
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <nav>
            {!isLoggedIn && (
                <>
                    <a href="/login">Login</a>
                    <a href="/register">Register</a>
                </>
            )}
            {isLoggedIn && (
                <>
                    <a href="/">Home</a>
                    <button onClick={HandleLogout}>Logout</button>
                </>
            )}
        </nav>
    );
};

export default Navbar;
