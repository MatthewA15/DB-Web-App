import React, { useState } from 'react';
import axios from 'axios';

const Signup = () => {
  const [user, setUser] = useState({ name: '', email: '', password: '' });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:5000/customers', user);
      alert('Signup successful');
    } catch (err) {
      alert('Signup failed');
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <input placeholder="Name" value={user.name} onChange={(e) => setUser({...user, name: e.target.value})} />
      <input placeholder="Email" value={user.email} onChange={(e) => setUser({...user, email: e.target.value})} />
      <input type="password" placeholder="Password" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})} />
      <button type="submit">Sign Up</button>
    </form>
  );
};

export default Signup;
