import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Orders from './components/Orders';
import Navbar from './components/Navbar';
import Menu from './components./Menu';
function App() {
  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
