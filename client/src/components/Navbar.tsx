import React, {FC} from "react";
import axios from "axios";
import useAuthCheck from "../controllers/useAuthCheck";
import "../styles/navbar.css"; // Make sure you have this import!

const Navbar: FC = () => {
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
        <nav className="main-nav"> {/* Added the class name here! */}
            {!isLoggedIn && (
                <>
                    <a href="/login">Login</a>
                    <a href="/register">Register</a>
                </>
            )}
            {isLoggedIn && (
                <>
                    <a href="/">Home</a>
                    <a href="/create">Create Post</a>
                    <button onClick={HandleLogout}>Logout</button>
                </>
            )}
        </nav>
    );
};

export default Navbar;