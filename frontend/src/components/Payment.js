import React, { useState } from 'react';
import axios from 'axios';

const Payment = () => {
  const [orderID, setOrderID] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Credit Card');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post('https://abhinavsiva.pythonanywhere.com/api/payments', {
        order_id: orderID,
        amount,
        method
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess(true);
    } catch (err) {
      alert('❌ Payment failed.');
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h3 className="mb-3">Mock Payment</h3>
      {success ? (
        <div className="alert alert-success">✅ Payment completed successfully!</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Order ID</label>
            <input type="number" className="form-control" value={orderID} onChange={(e) => setOrderID(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label>Amount</label>
            <input type="number" step="0.01" className="form-control" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label>Payment Method</label>
            <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
              <option>Credit Card</option>
              <option>Debit Card</option>
              <option>Cash</option>
              <option>Other</option>
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Submit Payment</button>
        </form>
      )}
    </div>
  );
};

export default Payment;
