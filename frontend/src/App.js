import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import About from './components/About';
import Menu from './components/Menu';
import Orders from './components/Orders';
import Feedback from './components/Feedback';
import Login from './components/Login';
import Signup from './components/Signup';


const App = () => {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<About />} />   
        <Route path="/menu" element={<Menu />} />     
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </Router>
  );
};

export default App;
