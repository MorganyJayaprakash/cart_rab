import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="auth-container">
      <h2 className="auth-title">Welcome Back</h2>
      <p className="auth-subtitle">Sign in to your account</p>
      {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <input 
          className="auth-input" 
          type="email" 
          placeholder="Email address" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          className="auth-input" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button className="auth-button" type="submit">Log In</button>
      </form>
      <Link className="auth-link" to="/register">Don't have an account? Sign up</Link>
    </div>
  );
};

export default Login;
