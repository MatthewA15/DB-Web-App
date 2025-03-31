import React, { useState } from 'react';
import axios from 'axios';

const Feedback = () => {
  const [orderID, setOrderID] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      await axios.post('https://abhinavsiva.pythonanywhere.com/api/feedback', {
        order_id: orderID,
        rating,
        comments
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmitted(true);
    } catch (err) {
      alert('Failed to submit feedback');
      console.error(err);
    }
  };

  return (
    <div className="container">
      <h3 className="mb-3">Give Feedback</h3>
      {submitted ? (
        <div className="alert alert-success">✅ Feedback submitted. Thank you!</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Order ID</label>
            <input type="number" className="form-control" value={orderID} onChange={(e) => setOrderID(e.target.value)} required />
          </div>
          <div className="mb-3">
            <label>Rating (1–5)</label>
            <select className="form-select" value={rating} onChange={(e) => setRating(e.target.value)}>
              {[1,2,3,4,5].map(num => <option key={num} value={num}>{num}</option>)}
            </select>
          </div>
          <div className="mb-3">
            <label>Comments</label>
            <textarea className="form-control" rows="3" value={comments} onChange={(e) => setComments(e.target.value)} required />
          </div>
          <button className="btn btn-primary" type="submit">Submit Feedback</button>
        </form>
      )}
    </div>
  );
};

export default Feedback;
