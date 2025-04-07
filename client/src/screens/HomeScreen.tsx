import React, {useEffect, useState} from 'react';
import axios from 'axios';

// Define interface for Post data structure
type Post = {
    title: string;
    description: string;
    location: string;
    reviews: string[];
};


const HomeScreen: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [error, setError] = useState<string>('');
    //const

    const fetchData = async () => {
        try {
            const response = await axios.get<Post[]>('http://localhost:5000/posts/all', {
                withCredentials: true
            });
            setPosts(response.data);
            console.log('Fetched posts:', posts);
        } catch (error) {
            setError('Failed to fetch posts');
            console.error('Error fetching data:', error);
        }
    };

    const HandleAddReview = async (postId: number) => {
        try {
            //const response = await axios.put(`http://localhost:5000/posts/${}`)
        }
        catch (e) {

        }
    }

    useEffect(() => {
        fetchData().catch((err: string): void => console.error("Error:", err));
    }, []);

    return (
        <div>
            {error && <p style={{color: 'red'}}>{error}</p>}
            {posts.length > 0 ? (
                posts.map((post) => (
                    <div key={post.title}>
                        <h2>Title: {post.title}</h2>
                        <p>Description: {post.description}</p>{(post.reviews as string[]).map((review, index) => (
                        <span key={index}>
                            {review}
                            {index < post.reviews.length - 1 && ", "}
                        </span>
                    ))}
                        <p>Location: {post.location}</p>
                    </div>
                ))
            ) : (
                <p>Loading posts...</p>
            )}
        </div>
    );

}

export default HomeScreen;