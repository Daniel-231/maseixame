import React, {FC, useState, ChangeEvent, useContext} from "react";
import axios from "axios";
import {ErrorContext} from "../controllers/CustomErrorHandler";
import '../styles/createscreen.css'; // Import the CSS file

const CreatePost: FC = () => {
    const [title, setTitle] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [photo, setPhoto] = useState<string>("");
    const reviews: string[] = [];


    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("CreatePost must be used within a CustomErrorHandler");
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
            // Maybe show a success message or redirect the user
        } catch (error: any) {
            setError(error);
            console.error("Error creating post:", error);
            // Maybe show an error message to the user
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
        <div className="create-post-screen">
            <h2 className="create-post-title">Create Post</h2>

            <div className="form-group">
                <label htmlFor="title" className="form-label">Title:</label>
                <input
                    type="text"
                    id="title"
                    className="form-input"
                    placeholder="Title"
                    value={title}
                    onChange={handleInputChange(setTitle)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="description" className="form-label">Description:</label>
                <textarea
                    id="description"
                    className="form-textarea"
                    placeholder="Description"
                    value={description}
                    onChange={handleTextAreaChange}
                />
            </div>

            <div className="form-group">
                <label htmlFor="location" className="form-label">Location:</label>
                <input
                    type="text"
                    id="location"
                    className="form-input"
                    placeholder="Location"
                    value={location}
                    onChange={handleInputChange(setLocation)}
                />
            </div>

            <div className="form-group">
                <label htmlFor="photo" className="form-label">Photo URL:</label>
                <input
                    type="text"
                    id="photo"
                    className="form-input"
                    placeholder="Photo URL"
                    value={photo}
                    onChange={handleInputChange(setPhoto)}
                />
            </div>

            <button type="button" className="submit-button" onClick={handleCreatePost}>
                Submit Post
            </button>
        </div>
    );
};

export default CreatePost;