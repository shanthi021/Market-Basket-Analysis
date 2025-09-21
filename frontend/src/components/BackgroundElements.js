import React from 'react';
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
`;

const pulse = keyframes`
  0%, 100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.1);
  }
`;

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
`;

const FloatingShape = styled.div`
  position: absolute;
  border-radius: 50%;
  background: ${props => props.color};
  opacity: 0.1;
  animation: ${float} ${props => props.duration}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const PulseShape = styled.div`
  position: absolute;
  border-radius: 50%;
  background: ${props => props.color};
  opacity: 0.3;
  animation: ${pulse} ${props => props.duration}s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
`;

const RotatingShape = styled.div`
  position: absolute;
  width: ${props => props.size}px;
  height: ${props => props.size}px;
  border: 2px solid ${props => props.color};
  border-radius: 50%;
  opacity: 0.1;
  animation: ${rotate} ${props => props.duration}s linear infinite;
  animation-delay: ${props => props.delay}s;
`;

const BackgroundElements = () => {
  return (
    <BackgroundContainer>
      {/* Floating circles */}
      <FloatingShape
        color="rgba(102, 126, 234, 0.3)"
        size="80px"
        duration="6"
        delay="0"
        style={{
          width: '80px',
          height: '80px',
          top: '20%',
          left: '10%'
        }}
      />
      <FloatingShape
        color="rgba(118, 75, 162, 0.3)"
        size="60px"
        duration="8"
        delay="2"
        style={{
          width: '60px',
          height: '60px',
          top: '60%',
          right: '15%'
        }}
      />
      <FloatingShape
        color="rgba(16, 185, 129, 0.3)"
        size="100px"
        duration="10"
        delay="4"
        style={{
          width: '100px',
          height: '100px',
          bottom: '20%',
          left: '20%'
        }}
      />
      
      {/* Pulse shapes */}
      <PulseShape
        color="rgba(245, 158, 11, 0.2)"
        size="120px"
        duration="4"
        delay="1"
        style={{
          width: '120px',
          height: '120px',
          top: '30%',
          right: '30%'
        }}
      />
      <PulseShape
        color="rgba(239, 68, 68, 0.2)"
        size="90px"
        duration="6"
        delay="3"
        style={{
          width: '90px',
          height: '90px',
          bottom: '40%',
          right: '10%'
        }}
      />
      
      {/* Rotating shapes */}
      <RotatingShape
        color="rgba(139, 92, 246, 0.2)"
        size="150"
        duration="20"
        delay="0"
        style={{
          top: '10%',
          right: '20%'
        }}
      />
      <RotatingShape
        color="rgba(6, 182, 212, 0.2)"
        size="100"
        duration="15"
        delay="5"
        style={{
          bottom: '10%',
          left: '10%'
        }}
      />
      
      {/* Additional decorative elements */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '5%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: `${pulse} 8s ease-in-out infinite`
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '20%',
          right: '5%',
          width: '150px',
          height: '150px',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.1) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: `${pulse} 6s ease-in-out infinite`,
          animationDelay: '2s'
        }}
      />
    </BackgroundContainer>
  );
};

export default BackgroundElements;
