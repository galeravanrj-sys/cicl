import React, { useState } from 'react';
import { API_BASE } from '../utils/apiBase';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Replace with your actual API endpoint
    await axios.post(`${API_BASE}/auth/forgot-password`, { email });
      
      setMessage('Password reset instructions have been sent to your email.');
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process your request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      {/* Top section with header and form */}
      <div style={{ 
        height: '50%', 
        width: '100%',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px', zIndex: 10 }}>
          <Link to="/login" style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#3498db',
            borderRadius: '5px',
            color: 'white',
            textDecoration: 'none'
          }}>
            ←
          </Link>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '30px',
          width: '100%'
        }}>
          <h2 style={{ marginRight: '10px', margin: 0, textTransform: 'uppercase' }}>HopeTrack</h2>
          <img 
            src="https://cdn-icons-png.flaticon.com/512/1584/1584961.png" 
            alt="Progress Icon" 
            style={{ width: '60px', height: '60px' }}
          />
        </div>
        
        <div style={{ width: '100%', maxWidth: '400px', padding: '0 20px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Forgot Password</h3>
          
          {message && <div style={{ 
            padding: '10px', 
            backgroundColor: '#d4edda', 
            color: '#155724',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>{message}</div>}
          
          {error && <div style={{ 
            padding: '10px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24',
            borderRadius: '5px',
            marginBottom: '15px'
          }}>{error}</div>}
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <input
              type="text"
              placeholder="Username or Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '5px',
                border: '1px solid #ddd',
                marginBottom: '15px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3a4a6d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: 'pointer'
              }}
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
      
      {/* Bottom section with the image */}
      <div style={{ 
        height: '50%', 
        width: '100%',
        backgroundImage: 'url(/images/children-hands-raised.jpg)', 
        backgroundSize: 'cover',
        backgroundPosition: 'center top'
      }}>
      </div>
    </div>
  );
};

export default ForgotPassword;