import React, {FC, useState, ChangeEvent, useContext} from "react";
import axios from "axios";
import {ErrorContext} from "../controllers/CustomErrorHandler";

const CreatePost: FC = () => {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [photo, setPhoto] = useState<string>("");
    const reviews: string[] = [];


    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("HomeScreen must be used within a CustomErrorHandler");
    }

    const { setError } = errorContext;

    const handleCreatePost = async (): Promise<void> => {
        try {
            const response = await axios.post(
                "http://localhost:5000/posts/create",
                {
                    title,
                    description,
                    location,
                    photo,
                    reviews,
                },
                {
                    withCredentials: true,
                }
            );
            console.log("Post response:", response.data);
        } catch (error: any) {
            setError(error);
            console.error("Error creating post:", error);
        }
    };

    const handleInputChange = (
        setter: React.Dispatch<React.SetStateAction<string>>
    ) => (e: ChangeEvent<HTMLInputElement>) => {
        setter(e.target.value);
    };

    const handleTextAreaChange = (
        e: ChangeEvent<HTMLTextAreaElement>
    ): void => {
        setDescription(e.target.value);
    };

    return (
        <div style={{ padding: "1rem", maxWidth: "500px", margin: "0 auto" }}>
            <h2>Create Post</h2>

            <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={handleInputChange(setTitle)}
            /><br /><br />

            <textarea
                placeholder="Description"
                value={description}
                onChange={handleTextAreaChange}
            /><br /><br />

            <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={handleInputChange(setLocation)}
            /><br /><br />

            <input
                type="text"
                placeholder="Photo URL"
                value={photo}
                onChange={handleInputChange(setPhoto)}
            /><br /><br />

            <button type="button" onClick={handleCreatePost}>
                Submit Post
            </button>
        </div>
    );
};

export default CreatePost;
