import React, { FC } from 'react';

import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';

// Pages
import HomeScreen from './screens/HomeScreen';

// Components
import Navbar from './components/Navbar';

const App: FC = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeScreen />} />
      </Routes>
    </Router>
  );
};

export default App;