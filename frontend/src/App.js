import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Orders from './components/Orders';
import Navbar from './components/Navbar';
import Menu from './components./Menu';
import StaffOrders from './components/StaffOrders';
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
          <Route path="/staff-orders" element={<StaffOrders />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
