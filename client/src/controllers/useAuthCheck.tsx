import { useEffect, useState } from "react";
import axios from "axios";

type ResponseType = {
    logged_in: boolean;
    user_id?: string;
    data?: any;
};

const useAuthCheck = () => {
    const [status, setStatus] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);

    useEffect((): void => {
        const checkAuth = async () => {
            try {
                const response = await axios.get<ResponseType>("http://localhost:5000/user/status", {
                    withCredentials: true,
                });

                setStatus(response.data.logged_in);
            } catch (error) {
                console.error("Error checking authentication:", error);
                if (axios.isAxiosError(error)) {
                    setError(error.response?.data?.message || "Authentication check failed");
                } else {
                    setError("An unexpected error occurred");
                }
            } finally {
                setLoading(false);
            }
        };

        checkAuth().catch((err: string): void => console.error("Unhandled checkAuth error:", err));
    }, []);

    return { status, loading, error };
};

export default useAuthCheck;
