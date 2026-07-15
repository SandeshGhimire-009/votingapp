import React from 'react';
import { Link } from 'react-router-dom';
import { FaTv, FaVoteYea, FaShieldAlt, FaUsers, FaTrophy, FaLock } from 'react-icons/fa';

const About = () => {
  return (
    <section style={{ padding: '60px 0', minHeight: '100vh', background: 'var(--bg-top)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '4rem',
            color: 'white',
            boxShadow: '0 15px 40px rgba(102, 126, 234, 0.3)'
          }}>
            <FaTv />
          </div>
          <h1 style={{
            fontSize: '3rem',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            About Reality Voting System
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#666', maxWidth: '700px', margin: '0 auto', lineHeight: '1.8' }}>
            A modern, secure, and user-friendly platform for reality show voting. 
            Cast your votes, track results, and be part of the action!
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '30px',
          marginBottom: '60px'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2rem',
              color: 'white'
            }}>
              <FaVoteYea />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#333' }}>Easy Voting</h3>
            <p style={{ color: '#666', lineHeight: '1.7' }}>
              Simple and intuitive voting interface that makes it easy to support your favorite contestants.
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #51cf66 0%, #40c057 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2rem',
              color: 'white'
            }}>
              <FaLock />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#333' }}>Secure & Private</h3>
            <p style={{ color: '#666', lineHeight: '1.7' }}>
              Your votes are secure and private. We use advanced security measures to protect your data.
            </p>
          </div>

          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            textAlign: 'center'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ffd43b 0%, #fcc419 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '2rem',
              color: 'white'
            }}>
              <FaTrophy />
            </div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#333' }}>Real-time Results</h3>
            <p style={{ color: '#666', lineHeight: '1.7' }}>
              View live results and rankings as votes are cast. Stay updated with the latest standings.
            </p>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '25px',
          padding: '60px 40px',
          textAlign: 'center',
          color: 'white',
          marginBottom: '60px'
        }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Join the Community</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.95 }}>
            Be part of the excitement! Register now and start voting for your favorites.
          </p>
          <Link
            to="/register"
            style={{
              display: 'inline-block',
              padding: '18px 40px',
              background: 'white',
              color: '#667eea',
              textDecoration: 'none',
              borderRadius: '50px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default About;
