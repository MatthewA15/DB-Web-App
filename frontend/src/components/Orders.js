import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Unauthorized. Please login.');
      window.location.href = '/login';
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
        setError('Failed to fetch orders. Please log in again.');
        localStorage.removeItem('token');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    };

    fetchOrders();
  }, []);

  const handleAddOrder = async (e) => {
    e?.preventDefault(); // ✅ This stops the page navigation
    const total = prompt("Enter total amount:");
    if (!total) return;

    const itemName = prompt("Enter item name:");
    const quantity = prompt("Enter quantity:");
    const price = prompt("Enter item price:");

    if (!itemName || !quantity || !price) {
      alert("Missing item details.");
      return;
    }

    const items = [
      {
        ItemName: itemName,
        Quantity: parseInt(quantity),
        Price: parseFloat(price)
      }
    ];

    try {
      const token = localStorage.getItem("token");
      await axios.post("https://abhinavsiva.pythonanywhere.com/api/orders", {
        total,
        status: "Pending",
        items
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      alert("Order added!");
      window.location.reload();
    } catch (err) {
      alert("Failed to add order.");
      console.error(err);
    }
  };


  return (
    <div className="container">
      <h2 className="mb-4">Order Management</h2>

      <button type="button" className="btn btn-success mb-3" onClick={handleAddOrder}>
  	➕ Add Order with Item
      </button>



      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 && !error && (
        <p className="text-muted">No orders found.</p>
      )}

      <ul className="list-group">
        {orders.map((order) => (
          <li className="list-group-item" key={order.OrderID}>
            <p><strong>Order ID:</strong> {order.OrderID}</p>
            <p><strong>Customer ID:</strong> {order.CustomerID || 'N/A'}</p>
            <p><strong>Customer Name:</strong> {order.CustomerName || 'N/A'}</p>
            <p><strong>Status:</strong> {order.Status || 'N/A'}</p>
            <p><strong>Total Amount:</strong> ${order.TotalAmount ? order.TotalAmount.toFixed(2) : '0.00'}</p>
            <p><strong>Order Date:</strong> {order.OrderDate || 'N/A'}</p>

            <button
              className="btn btn-warning btn-sm me-2"
              onClick={async () => {
                const newStatus = prompt("Enter new status:");
                if (!newStatus) return;
                try {
                  const token = localStorage.getItem("token");
                  await axios.put(`https://abhinavsiva.pythonanywhere.com/api/orders/${order.OrderID}`, {
                    status: newStatus
                  }, {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  });
                  alert("Status updated!");
                  window.location.reload();
                } catch (err) {
                  alert("Failed to update status.");
                  console.error(err);
                }
              }}
            >
              ✏️ Update Status
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={async () => {
                if (!window.confirm("Are you sure you want to delete this order?")) return;
                try {
                  const token = localStorage.getItem("token");
                  await axios.delete(`https://abhinavsiva.pythonanywhere.com/api/orders/${order.OrderID}`, {
                    headers: {
                      Authorization: `Bearer ${token}`
                    }
                  });
                  alert("Order deleted!");
                  window.location.reload();
                } catch (err) {
                  alert("Failed to delete order.");
                  console.error(err);
                }
              }}
            >
              🗑️ Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Orders;
