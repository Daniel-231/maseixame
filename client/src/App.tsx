import { FC } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import CreatePost from './screens/CreatePost';

// Components
import Navbar from './components/Navbar';

// Controllers (or Higher-Order Components / Error Boundaries)
import {CustomErrorHandler} from "./controllers/CustomErrorHandler";

const App: FC = () => {
    return (
        <Router>
            <Navbar />
            <CustomErrorHandler>
                <Routes>
                    <Route path="/" element={<HomeScreen />} />
                    <Route path="/register" element={<RegisterScreen />} />
                    <Route path="/login" element={<LoginScreen />} />
                    <Route path="/create" element={<CreatePost />} />
                </Routes>
            </CustomErrorHandler>
        </Router>
    );
};

export default App;
