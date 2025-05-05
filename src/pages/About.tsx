import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React Leaflet
// This is needed because the webpack/vite build process doesn't handle Leaflet's assets correctly
const icon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const AboutPage: React.FC = () => {
  const aboutStyle = {
    padding: '4rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };
  
  const contentStyle = {
    display: 'flex' as const,
    flexDirection: 'column' as const,
    gap: '2rem',
    alignItems: 'center' as const,
  };
  
  const headingStyle = {
    fontSize: '2.5rem',
    color: '#2c3e50',
    marginBottom: '2rem',
    textAlign: 'center' as const,
  };
  
  const cardStyle = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    padding: '2rem',
    width: '100%',
  };
  
  const cardHeadingStyle = {
    color: '#3498db',
    marginBottom: '1rem',
    fontSize: '1.5rem',
  };
  
  const paragraphStyle = {
    color: '#555',
    lineHeight: 1.6,
    fontSize: '1.1rem',
  };

  const mapStyle = {
    height: '400px',
    width: '100%',
    borderRadius: '8px',
    marginTop: '1rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  };

  // Store location coordinates
  const position: [number, number] = [33.8823, -117.8851]; // Cal State Fullerton, CA

  return (
    <section style={aboutStyle}>
      <div style={contentStyle}>
        <h1 style={headingStyle}>About Us</h1>
        
        <div style={cardStyle}>
          <h2 style={cardHeadingStyle}>Who We Are</h2>
          <p style={paragraphStyle}>Welcome to Our Store, your one-stop shop for high-quality products at unbeatable prices. We are committed to providing a seamless shopping experience with fast delivery and excellent customer support.</p>
        </div>
        
        <div style={cardStyle}>
          <h2 style={cardHeadingStyle}>Our Mission</h2>
          <p style={paragraphStyle}>Our mission is to create a reliable and user-friendly online marketplace where customers can find everything they need with ease.</p>
        </div>
        
        <div style={cardStyle}>
          <h2 style={cardHeadingStyle}>Meet Our Team</h2>
          <p style={paragraphStyle}>We are a passionate team of developers, designers, and business experts dedicated to making online shopping simple and enjoyable.</p>
        </div>

        <div style={cardStyle}>
          <h2 style={cardHeadingStyle}>Visit Our Store</h2>
          <p style={paragraphStyle}>Come visit our physical location in Fullerton, California. We're open Monday through Saturday from 9:00 AM to 9:00 PM.</p>
          
          <div style={mapStyle}>
            <MapContainer 
              center={position} 
              zoom={15} 
              scrollWheelZoom={false}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position} icon={icon}>
                <Popup>
                  Our Store <br /> Located in Fullerton, CA
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutPage;