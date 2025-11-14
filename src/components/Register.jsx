import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { API_BASE } from '../utils/apiBase';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    password: '',
    // Add any additional fields you need
    role: 'encoder', // Default role
    phoneNumber: '',
    address: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const { register, error } = useContext(AuthContext);
  const navigate = useNavigate();

  const { firstName, middleName, lastName, email, password } = formData;

  const onChange = e => {
    const { name, type, value, checked } = e.target;
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    // Form validation
    if (!firstName || !lastName || !email || !password) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }
    
    // Register user
    const success = await register({ 
      firstName, 
      middleName, 
      lastName, 
      email, 
      password,
      // Persist login by default after registration
      remember: true
    });
    
    if (success) {
      // Add a small delay to ensure authentication state is set
      console.log('Registration successful, navigating to dashboard...');
      // Use replace instead of navigate to avoid back button issues
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 200);
    } else {
      console.log('Registration failed');
    }
  };

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
      {/* Left section with registration form */}
      <div style={{ 
        width: '50%', 
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        padding: '40px',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <Link to="/" style={{ 
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '40px',
            height: '40px',
            backgroundColor: '#3a4a6d',
            borderRadius: '5px',
            color: 'white',
            textDecoration: 'none',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            ←
          </Link>
        </div>
        
        <div style={{ 
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          maxWidth: '400px',
          margin: '0 auto',
          width: '100%'
        }}>
          <div style={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
            width: '100%'
          }}>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              marginBottom: '30px',
              justifyContent: 'center',
              width: '100%'
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
                src="/images/progress-icon.png" 
                alt="Progress Icon" 
                style={{ width: '65px', height: '65px' }}
              />
            </div>
          </div>
          
          {(formError || error) && (
            <div style={{ 
              padding: '12px 15px', 
              backgroundColor: '#f8d7da', 
              color: '#721c24',
              borderRadius: '5px',
              marginBottom: '20px',
              width: '100%',
              boxSizing: 'border-box',
              fontSize: '14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              {formError || error}
            </div>
          )}
          
          <form onSubmit={onSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={firstName}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={middleName}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={lastName}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Email
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={onChange}
                style={{
                  width: '100%',
                  padding: '12px 15px',
                  borderRadius: '5px',
                  border: '1px solid #ced4da',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease-in-out',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                fontSize: '14px',
                color: '#495057'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={password}
                  onChange={onChange}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 15px',
                    borderRadius: '5px',
                    border: '1px solid #ced4da',
                    fontSize: '16px',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s ease-in-out',
                    outline: 'none'
                  }}
                />
                <button
                  type="button"
                  aria-label="Toggle password visibility"
                  onClick={() => setShowPassword(p => !p)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#6c757d',
                    cursor: 'pointer'
                  }}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>
            </div>
            

            <button type="submit" style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#3a4a6d',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              marginBottom: '20px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              Create Account
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 20px' }}>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#dee2e6' }} />
              <span style={{ margin: '0 12px', color: '#6c757d', fontSize: '12px' }}>OR</span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#dee2e6' }} />
            </div>

            <button
              type="button"
              onClick={() => { 
                // Persist login by default for Google sign up from Register
                window.location.href = `${API_BASE}/auth/google?remember=1`; 
              }}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#ffffff',
                color: '#3a4a6d',
                border: '1px solid #3a4a6d',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FcGoogle size={20} />
              <span>Sign up with Google</span>
            </button>

            <div style={{ textAlign: 'center' }}>
              <Link to="/login" style={{ color: '#3a4a6d', textDecoration: 'none' }}>
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </div>

      {/* Right section with background image or illustration */}
      <div style={{
        width: '50%',
        height: '100%',
        backgroundImage: 'url(/images/children-hands-raised.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }} />
    </div>
  );

};

export default Register;
