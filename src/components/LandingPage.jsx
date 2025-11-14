import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const LandingPage = () => {
  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ 
        width: '50%', 
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '400px',
          width: '100%'
        }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            marginBottom: '120px',
            justifyContent: 'center'
          }}>
            <div style={{ textAlign: 'right', marginRight: '15px' }}>
              <div style={{ 
                fontSize: '28px', 
                fontWeight: 'bold', 
                lineHeight: '1.2',
                textTransform: 'uppercase',
                color: '#2c3e50'
              }}>HOPETRACK</div>
            </div>
            <img 
              src="/images/hopetrack-icon.svg" 
              alt="HopeTrack Icon" 
              style={{ width: '65px', height: '65px' }}
            />
          </div>
          
          <Link 
            to="/login" 
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#6c8cbf',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '20px',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.15s ease-in-out'
            }}
          >
            Log In
          </Link>
          
          <Link 
            to="/register" 
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#3a4a6d',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              textAlign: 'center',
              textDecoration: 'none',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transition: 'background-color 0.15s ease-in-out'
            }}
          >
            Sign Up
          </Link>
        </div>
      </div>
      
      <div style={{ 
        width: '50%', 
        height: '100%',
        backgroundImage: 'url(/images/children-background.png)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      </div>
    </div>
  );
};

export default LandingPage;