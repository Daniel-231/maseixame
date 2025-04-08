import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Updated Post interface with id as number
type Post = {
    id: number;
    title: string;
    description: string;
    location: string;
    reviews: string[];
};

const HomeScreen: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [error, setError] = useState<string>('');
    // Map to keep track of the review rating input for each post by id
    const [reviewMap, setReviewMap] = useState<{ [key: number]: number | '' }>({});

    const fetchData = async () => {
        try {
            const response = await axios.get<Post[]>('http://localhost:5000/posts/all', {
                withCredentials: true,
            });
            setPosts(response.data);
            console.log('Fetched posts:', response.data);
        } catch (error) {
            setError('Failed to fetch posts');
            console.error('Error fetching data:', error);
        }
    };

    // Updated function so postId is a number.
    const HandleAddReview = async (postId: number) => {
        // Get the review rating for the current post
        const review = reviewMap[postId];
        // Validate that review is within allowed limits
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
            // Optionally, you may want to update the UI or clear the input after submission.
            // For instance, clearing the input:
            setReviewMap(prev => ({ ...prev, [postId]: '' }));
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData().catch((err: string): void => console.error("Error:", err));
    }, []);

    return (
        <div>
            {error && <p style={{ color: 'red' }}>{error}</p>}
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
                        {/* Input field for the review rating with constraints */}
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
