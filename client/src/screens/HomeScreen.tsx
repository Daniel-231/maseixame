import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ErrorContext } from '../controllers/CustomErrorHandler';

type Review = {
    id: number;
    userId: string;
    username: string;
    rating: number;
    content: string;
    createdAt: string;
};

type ReviewData = {
    ratings: Review[];
    average: number;
    count: number;
};

type Post = {
    id: number;
    title: string;
    description: string;
    location: string;
    username: string;
    userId: string;
    reviews: ReviewData;
};

type ReviewInput = {
    rating: number | '';
    content: string;
};

const HomeScreen: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [reviewMap, setReviewMap] = useState<{ [key: number]: ReviewInput }>({});
    const [userReviews, setUserReviews] = useState<{ [key: number]: boolean }>({});
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    const errorContext = useContext(ErrorContext);

    if (!errorContext) {
        throw new Error("HomeScreen must be used within a CustomErrorHandler");
    }

    const { setError } = errorContext;

    const fetchData = async () => {
        try {
            const statusResponse = await axios.get('http://localhost:5000/user/status', {
                withCredentials: true
            });

            const isLoggedIn = statusResponse.data.logged_in;
            const userId = isLoggedIn ? statusResponse.data.user_id : null;
            setCurrentUserId(userId);

            const response = await axios.get<Post[]>('http://localhost:5000/posts/all', {
                withCredentials: true,
            });
            setPosts(response.data);

            if (isLoggedIn && userId) {
                const reviewedPosts: { [key: number]: boolean } = {};
                const initialReviewMap: { [key: number]: ReviewInput } = {};

                response.data.forEach(post => {
                    const userReview = post.reviews?.ratings?.find(
                        review => review.userId === userId
                    );

                    const hasReviewed = !!userReview;
                    reviewedPosts[post.id] = hasReviewed;

                    initialReviewMap[post.id] = {
                        rating: hasReviewed && userReview ? userReview.rating : '',
                        content: hasReviewed && userReview ? (userReview.content || '') : ''
                    };
                });

                setUserReviews(reviewedPosts);
                setReviewMap(initialReviewMap);
            }
        } catch (error) {
            setError(new Error('Failed to fetch posts'));
            console.error('Error fetching data:', error);
        }
    };

    const handleAddReview = async (postId: number) => {
        if (!currentUserId) {
            setError(new Error("You must be logged in to leave a review"));
            return;
        }

        const review = reviewMap[postId] || { rating: '', content: '' };

        if (review.rating === '' || review.rating < 1 || review.rating > 5) {
            setError(new Error("Rating must be between 1 and 5"));
            return;
        }

        try {
            const isUpdate = userReviews[postId];

            const response = await axios.put(
                `http://localhost:5000/posts/review/${postId}`,
                {
                    rating: review.rating,
                    content: review.content || ''
                },
                { withCredentials: true }
            );

            setPosts(prevPosts =>
                prevPosts.map(post =>
                    post.id === postId
                        ? { ...post, reviews: response.data.reviews }
                        : post
                )
            );

            setUserReviews(prev => ({ ...prev, [postId]: true }));

            const userReview = response.data.reviews.ratings.find(
                (r: Review) => r.userId === currentUserId
            );

            if (userReview) {
                setReviewMap(prev => ({
                    ...prev,
                    [postId]: {
                        rating: userReview.rating,
                        content: userReview.content || ''
                    }
                }));
            }
        } catch (error: any) {
            setError(new Error(error.response?.data?.error || "Failed to add review"));
            console.error(error);
        }
    };


    useEffect(() => {
        fetchData().catch((err: Error): void => console.error("Error:", err));
    }, []);

    const calculateAverageRating = (reviews: ReviewData | undefined) => {
        if (!reviews || !reviews.ratings || reviews.ratings.length === 0) {
            return "No ratings yet";
        }
        return `${reviews.average.toFixed(1)} (${reviews.count} ${reviews.count === 1 ? 'review' : 'reviews'})`;
    };

    const handleInputChange = (postId: number, field: keyof ReviewInput, value: string | number) => {
        setReviewMap(prev => ({
            ...prev,
            [postId]: {
                ...prev[postId] || { rating: '', content: '' },
                [field]: field === 'rating' ? (value === '' ? '' : Number(value)) : value
            }
        }));
    };

    const sortReviews = (reviews: Review[]) => {
        return [...reviews].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    };

    return (
        <div>
            {posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post.id} style={{
                        border: '1px solid #ccc',
                        padding: '15px',
                        margin: '15px 0',
                        borderRadius: '8px'
                    }}>
                        <h2>Title: {post.title}</h2>
                        <p>By: {post.username}</p>
                        <p>Description: {post.description}</p>
                        <p>Location: {post.location}</p>

                        <div>
                            <h3>Ratings: {calculateAverageRating(post.reviews)}</h3>

                            {post.reviews?.ratings?.length > 0 && (
                                <div style={{ marginBottom: '15px' }}>
                                    {sortReviews(post.reviews.ratings).map((review) => (
                                        <div key={review.id} style={{
                                            marginBottom: '12px',
                                            padding: '8px',
                                            backgroundColor: review.userId === currentUserId ? '#f0f8ff' : 'transparent',
                                            borderRadius: '4px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ fontWeight: 'bold' }}>
                                                    {review.username}: {review.rating}★
                                                </span>
                                                <span style={{ fontSize: '0.8em', color: '#666' }}>
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.content && (
                                                <p style={{
                                                    marginTop: '5px',
                                                    marginBottom: '0',
                                                    padding: '5px 0 0 15px',
                                                    borderTop: '1px solid #eee'
                                                }}>
                                                    {review.content}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {currentUserId && (
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '8px'
                                }}>
                                    <h4 style={{ margin: '0 0 10px 0' }}>
                                        {userReviews[post.id] ? 'Update your review' : 'Add your review'}
                                    </h4>

                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                                        <label style={{ marginRight: '10px' }}>Rating:</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={reviewMap[post.id]?.rating || ''}
                                            onChange={(e) => handleInputChange(post.id, 'rating', e.target.value)}
                                            placeholder="1-5"
                                            style={{
                                                width: '60px',
                                                padding: '5px',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px' }}>Comment (optional):</label>
                                        <textarea
                                            value={reviewMap[post.id]?.content || ''}
                                            onChange={(e) => handleInputChange(post.id, 'content', e.target.value)}
                                            placeholder="Share your thoughts about this post..."
                                            style={{
                                                width: '100%',
                                                minHeight: '80px',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                border: '1px solid #ccc',
                                                resize: 'vertical'
                                            }}
                                        />
                                    </div>

                                    <button
                                        onClick={() => handleAddReview(post.id)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: '#4CAF50',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {userReviews[post.id] ? 'Update Review' : 'Post Review'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p>Loading posts...</p>
            )}
        </div>
    );
};

export default HomeScreen;
