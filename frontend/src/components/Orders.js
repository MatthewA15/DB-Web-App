import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in to view orders.');
        return;
      }

      try {
        const res = await axios.get('https://abhinavsiva.pythonanywhere.com/api/orders/${orderId}', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setOrders(res.data);
      } catch (err) {
        setError('Error fetching orders. Please log in again or check the server.');
      }
    };

    fetchOrders();
  }, []);

  return (
    <div className="container">
      <h2 className="mb-4">Order Management</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 && !error && (
        <p className="text-muted">No orders found.</p>
      )}

      <ul className="list-group">
        {orders.map((order, index) => (
          <li className="list-group-item" key={index}>
            <p><strong>Order ID:</strong> {order.OrderID || order.id}</p>
            <p><strong>Customer ID:</strong> {order.CustomerID || 'N/A'}</p>
            <p><strong>Status:</strong> {order.Status || 'N/A'}</p>
            <p><strong>Total Amount:</strong> ${order.TotalAmount || '0.00'}</p>
            <p><strong>Order Date:</strong> {order.OrderDate || 'N/A'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Orders;
