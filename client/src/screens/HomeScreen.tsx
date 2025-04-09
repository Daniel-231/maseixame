import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { ErrorContext } from '../controllers/CustomErrorHandler';
import '../styles/homescreen.css'; // Import the CSS file

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
    content: string;
    average: number;
    count: number;
};

type Post = {
    id: number;
    createdAt: string;
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
        <div className="home-screen">
            {posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post.id} className="post-card">
                        <h2 className="post-title">Title: {post.title}</h2>
                        <p className="post-meta">By: <span className="post-author">{post.username}</span></p>
                        <p className="post-description">Description: {post.description}</p>
                        <p className="post-location">Location: {post.location}</p>
    
                        <div className="reviews-section">
                            <h3 className="reviews-heading">Ratings: {calculateAverageRating(post.reviews)}</h3>
    
                            {post.reviews?.ratings?.length > 0 && (
                                <div className="reviews-list">
                                    {sortReviews(post.reviews.ratings).map((review) => (
                                        <div key={review.id} className="review-item">
                                            <div>
                                                <span className="review-user">{review.username}: {review.rating} ★</span>
                                                <span className="review-date">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {review.content && (
                                                <p className="review-content">
                                                    {review.content}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
    
                            {currentUserId && (
                                <div className="review-form">
                                    <h4 className="form-title">
                                        {userReviews[post.id] ? 'Update your review' : 'Add your review'}
                                    </h4>
    
                                    <div className="form-group">
                                        <label className="form-label">Rating:</label>
                                        <input
                                            className="form-input"
                                            type="number"
                                            min="1"
                                            max="5"
                                            value={reviewMap[post.id]?.rating || ''}
                                            onChange={(e) => handleInputChange(post.id, 'rating', e.target.value)}
                                            placeholder="1-5"
                                        />
                                    </div>
    
                                    <div className="form-group">
                                        <label className="form-label">Comment (optional):</label>
                                        <textarea
                                            className="form-textarea"
                                            value={reviewMap[post.id]?.content || ''}
                                            onChange={(e) => handleInputChange(post.id, 'content', e.target.value)}
                                            placeholder="Add a Review"
                                        />
                                    </div>
    
                                    <button
                                        className="submit-button"
                                        onClick={() => handleAddReview(post.id)}
                                    >
                                        {userReviews[post.id] ? 'Update Review' : 'Post Review'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))
            ) : (
                <p className="loading-message">Loading posts...</p>
            )}
        </div>
    );
};

export default HomeScreen;