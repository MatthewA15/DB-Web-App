// About.js
import React from 'react';
import mapImage from './map.png';

const About = () => {
  return (
    <div className="container mt-5">
      <h2 className="mb-3">About Our Restaurant</h2>
      <p>Welcome to <strong>Delicious Eats</strong>! We’ve been serving flavorful dishes made from fresh ingredients since 2005.</p>
      
      <h5>📍 Location</h5>
      <p>123 Tasty Street, Flavor Town, ON, Canada</p>
      
      <h5>⏰ Hours</h5>
      <ul>
        <li>Mon–Fri: 11am – 10pm</li>
        <li>Sat–Sun: 12pm – 11pm</li>
      </ul>

      <h5>📞 Contact</h5>
      <p>Phone: (123) 456-7890</p>
      <p>Email: contact@deliciouseats.com</p>

      <h5>🗺️ Find us on the map:</h5>
      <img
  	src={mapImage}
  	alt="Our location on the map"
 	style={{ width: '100%', maxWidth: '600px', borderRadius: '10px', border: '1px solid #ccc' }}
      />
    </div>
  );
};

export default About;
