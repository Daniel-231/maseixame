import React, {use, useEffect} from 'react';
import axios from 'axios';

const App: React.FC = () => {
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/posts/all');
      console.log(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div>
      <p>This is a simple React application.</p>
    </div>
  );
}

export default App;