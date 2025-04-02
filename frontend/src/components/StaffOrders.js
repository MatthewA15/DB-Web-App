import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Unauthorized. Please login.');
      window.location.href = '/login';
      return;
    }

    // Decode the JWT to check for role: 'staff'
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.role !== 'staff') {
      alert('Access denied. Staff only.');
      window.location.href = '/';
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await axios.get('https://abhinavsiva.pythonanywhere.com/api/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(res.data);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to fetch orders. Please try again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container">
      <h2 className="mb-4">📋 Staff Order Overview</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 && !error && (
        <p className="text-muted">No orders found.</p>
      )}

      <ul className="list-group">
        {orders.map((order) => (
          <li className="list-group-item" key={order.OrderID}>
            <p><strong>Order ID:</strong> {order.OrderID}</p>
            <p><strong>Customer ID:</strong> {order.CustomerID}</p>
            <p><strong>Customer Name:</strong> {order.CustomerName}</p>
            <p><strong>Status:</strong> {order.Status}</p>
            <p><strong>Total Amount:</strong> ${order.TotalAmount?.toFixed(2)}</p>
            <p><strong>Order Date:</strong> {order.OrderDate}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StaffOrders;
