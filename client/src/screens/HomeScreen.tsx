import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ErrorContext } from '../controllers/CustomErrorHandler';

type Post = {
    id: number;
    title: string;
    description: string;
    location: string;
    reviews: string[];
};

const HomeScreen: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [reviewMap, setReviewMap] = useState<{ [key: number]: number | '' }>({});

    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("HomeScreen must be used within a CustomErrorHandler");
    }

    const { setError } = errorContext;

    const fetchData = async () => {
        try {
            const response = await axios.get<Post[]>('http://localhost:5000/posts/all', {
                withCredentials: true,
            });
            setPosts(response.data);
            console.log('Fetched posts:', response.data);
        } catch (error) {
            setError(new Error('Failed to fetch posts'));
            console.error('Error fetching data:', error);
        }
    };

    const HandleAddReview = async (postId: number) => {
        const review = reviewMap[postId];
        if (review === '' || review < 1 || review > 5) {
            console.error("Review must be between 1 and 5");
            return;
        }
        try {
            await axios.put(
                `http://localhost:5000/posts/review/${postId}`,
                { reviews: review },
                { withCredentials: true }
            );
            setReviewMap(prev => ({ ...prev, [postId]: '' }));
        } catch (e) {
            setError(new Error("Failed to add review"));
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData().catch((err: string): void => console.error("Error:", err));
    }, [reviewMap]);

    return (
        <div>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post.id}>
                        <h2>Title: {post.title}</h2>
                        <p>Description: {post.description}</p>
                        {post.reviews.map((r, index) => (
                            <span key={index}>
                                {r}
                                {index < post.reviews.length - 1 && ", "}
                            </span>
                        ))}
                        <input
                            type="number"
                            min="1"
                            max="5"
                            value={reviewMap[post.id] || ''}
                            onChange={(e) =>
                                setReviewMap({
                                    ...reviewMap,
                                    [post.id]: Number(e.target.value),
                                })
                            }
                            placeholder="Enter rating 1-5"
                        />
                        <button onClick={() => HandleAddReview(post.id)}>
                            Add Review
                        </button>
                        <p>Location: {post.location}</p>
                    </div>
                ))
            ) : (
                <p>Loading posts...</p>
            )}
        </div>
    );
};

export default HomeScreen;
