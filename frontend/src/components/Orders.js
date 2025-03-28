import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get('http://127.0.0.1:5000/orders', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setOrders(res.data);
      } catch (err) {
        alert('Error fetching orders');
      }
    };

    fetchOrders();
  }, []);

  return (
    <div>
      <h2>Order Management</h2>
      <ul>
        {orders.map((order, i) => <li key={i}>{order.description}</li>)}
      </ul>
    </div>
  );
};

export default Orders;
