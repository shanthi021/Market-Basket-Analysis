import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ShoppingCart, TrendingUp, Users, BarChart3 } from 'lucide-react';
import styled from 'styled-components';

// ✅ Keep all your styled components
const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  z-index: 1;
`;

const LoginCard = styled(motion.div)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 450px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  z-index: 1;
`;

const BackgroundPattern = styled.div`
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(102, 126, 234, 0.1) 50%,
    transparent 70%
  );
  animation: rotate 20s linear infinite;
  z-index: -1;
  
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-align: center;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  color: #6b7280;
  text-align: center;
  margin-bottom: 32px;
  font-size: 1.1rem;
`;

const Form = styled.form`
  position: relative;
  z-index: 1;
`;

const InputGroup = styled.div`
  position: relative;
  margin-bottom: 24px;
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.8);
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
    background: white;
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #667eea;
  }
`;

const LoginButton = styled(motion.button)`
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 24px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const RegisterLink = styled.div`
  text-align: center;
  color: #6b7280;
  
  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      color: #764ba2;
    }
  }
`;

const FeatureIcons = styled.div`
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 32px;
  opacity: 0.6;
`;

const FeatureIcon = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 500;
`;

/* ------------------- Component ------------------- */
const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth(); // ✅ use login from AuthContext
  const navigate = useNavigate();

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Call AuthContext login instead of axios directly
    const result = await login(formData.username, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      // Error toast already handled in AuthContext
      console.error(result.error);
    }

    setLoading(false);
  };

  return (
    <LoginContainer>
      <LoginCard
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <BackgroundPattern />
        <Title>Welcome Back</Title>
        <Subtitle>Sign in to your Market Basket Analysis account</Subtitle>
        
        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </InputGroup>

          <InputGroup>
            <Input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </PasswordToggle>
          </InputGroup>

          <LoginButton
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </LoginButton>
        </Form>

        <RegisterLink>
          Don’t have an account? <Link to="/register">Sign up here</Link>
        </RegisterLink>

        <FeatureIcons>
          <FeatureIcon>
            <ShoppingCart size={24} />
            <span>Analytics</span>
          </FeatureIcon>
          <FeatureIcon>
            <TrendingUp size={24} />
            <span>Insights</span>
          </FeatureIcon>
          <FeatureIcon>
            <Users size={24} />
            <span>Segmentation</span>
          </FeatureIcon>
          <FeatureIcon>
            <BarChart3 size={24} />
            <span>Reports</span>
          </FeatureIcon>
        </FeatureIcons>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;