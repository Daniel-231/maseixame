import React, { useEffect, useState } from 'react';
import axios, { AxiosError } from 'axios';

// Define interface for Post data structure
interface Post {
  title: string;
  description: string;
  reviews: number[];
  photo: string;
  location: string;
  createdAt: string;
}

const App: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>('');

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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post.title}>
            <h2>{post.title}</h2>
            <p>{post.description}</p>
            <p>Reviews: {post.reviews.map((index: number) => {
              return (
                <span key={index}>
                  {index}
                  {index !== post.reviews[post.reviews.length - 1] && ', '}
                </span>
              );
            })}</p>
          </div>
        ))
      ) : (
        <p>Loading posts...</p>
      )}
    </div>
  );
}

export default App;