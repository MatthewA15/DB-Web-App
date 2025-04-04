import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Unauthorized. Please login.');
      window.location.href = '/login';
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersRes, menuRes] = await Promise.all([
          axios.get('/api/orders', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('/api/menu', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setOrders(ordersRes.data);
        setMenuItems(menuRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch data.');
      }
    };

    fetchData();
  }, []);

  const handleAddOrder = async (e) => {
    e.preventDefault();

    if (!selectedItemId) {
      alert("Please select an item.");
      return;
    }

    const item = menuItems.find(item => item.ItemID.toString() === selectedItemId);
    const totalAmount = item.Price * quantity;

    try {
      const token = localStorage.getItem("token");
      await axios.post("/api/orders", {
        total: totalAmount,
        status: "Pending",
        items: [{ MenuItemID: item.ItemID, Quantity: quantity }]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Order placed successfully!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to place order.");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Order deleted!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to delete order.");
    }
  };

  const handleUpdateStatus = async (orderId) => {
    const newStatus = prompt("Enter new status:");
    if (!newStatus) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(`/api/orders/${orderId}`, {
        status: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Status updated!");
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  return (
    <div className="container">
      <h2 className="mb-4">Order Management</h2>

      <form onSubmit={handleAddOrder} className="mb-3">
        <select
          className="form-select mb-2"
          value={selectedItemId}
          onChange={e => setSelectedItemId(e.target.value)}
        >
          <option value="">Select item</option>
          {menuItems.map(item => (
            <option key={item.ItemID} value={item.ItemID}>
              {item.Name} - ${item.Price.toFixed(2)}
            </option>
          ))}
        </select>

        <input
          type="number"
          className="form-control mb-2"
          placeholder="Quantity"
          value={quantity}
          min="1"
          onChange={e => setQuantity(parseInt(e.target.value))}
        />

        <button type="submit" className="btn btn-success">➕ Add Order</button>
      </form>

      {error && <div className="alert alert-danger">{error}</div>}

      {orders.length === 0 && !error && (
        <p className="text-muted">No orders found.</p>
      )}

      <ul className="list-group">
        {orders.map((order) => (
          <li className="list-group-item mb-3" key={order.OrderID}>
            <p><strong>Order ID:</strong> {order.OrderID}</p>
            <p><strong>Customer Name:</strong> {order.CustomerName || 'N/A'}</p>
            <p><strong>Status:</strong> {order.Status}</p>

            {order.Items && order.Items.length > 0 && (
              <ul className="mb-2">
                {order.Items.map((item, idx) => (
                  <li key={idx}>{item.Name} × {item.Quantity}</li>
                ))}
              </ul>
            )}

            <p><strong>Total Amount:</strong> ${order.TotalAmount.toFixed(2)}</p>
            <p><strong>Order Date:</strong> {order.OrderDate}</p>

            <button
              className="btn btn-warning btn-sm me-2"
              onClick={() => handleUpdateStatus(order.OrderID)}
            >
              ✏️ Update Status
            </button>

            <button
              className="btn btn-danger btn-sm"
              onClick={() => handleDeleteOrder(order.OrderID)}
            >
              🗑️ Delete Order
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Orders;
