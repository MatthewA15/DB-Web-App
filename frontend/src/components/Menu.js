import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Menu = () => {
  const [menu, setMenu] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const res = await axios.get("https://abhinavsiva.pythonanywhere.com/api/menu", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMenu(res.data);
      } catch (err) {
        setError("Failed to load menu.");
        console.error(err);
      }
    };

    fetchMenu();
  }, []);

  return (
    <div className="container mt-4">
      <h2>Menu</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row">
        {menu.map(item => (
          <div className="col-md-4 mb-3" key={item.ItemID}>
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">{item.Name}</h5>
                <p className="card-text">{item.Description}</p>
                <p className="card-text"><strong>${item.Price.toFixed(2)}</strong></p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Menu;
