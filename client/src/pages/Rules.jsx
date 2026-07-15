import React, { useState } from 'react';
import { FaChevronDown, FaChevronUp, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const Rules = () => {
  const [openSections, setOpenSections] = useState({});

  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const rules = [
    {
      id: 1,
      title: 'Voting Eligibility',
      content: 'Only registered users with approved accounts can participate in voting. Users must be at least 18 years old to register.'
    },
    {
      id: 2,
      title: 'Voting Rules',
      content: 'Each user can vote only once per contest. Votes cannot be changed or cancelled after submission. Make sure you review your selection before confirming your vote.'
    },
    {
      id: 3,
      title: 'Account Requirements',
      content: 'All accounts require admin approval before voting privileges are activated. Ensure you provide accurate information during registration.'
    },
    {
      id: 4,
      title: 'Vote Reset',
      content: 'Vote resets are only available through a formal request to administrators. Approval is subject to review and not guaranteed.'
    },
    {
      id: 5,
      title: 'Results and Transparency',
      content: 'Results are published after the voting period ends. All votes are securely stored and can be audited by administrators.'
    },
    {
      id: 6,
      title: 'Prohibited Activities',
      content: 'Creating multiple accounts, attempting to manipulate votes, or any fraudulent activity will result in immediate account suspension and potential legal action.'
    }
  ];

  return (
    <section style={{ padding: '60px 0', minHeight: '100vh', background: 'var(--bg-top)' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{
            fontSize: '3rem',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold'
          }}>
            Voting Rules & Guidelines
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#666', lineHeight: '1.8' }}>
            Please read and understand these rules before participating in the voting process.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {rules.map((rule) => (
            <div
              key={rule.id}
              style={{
                background: 'white',
                borderRadius: '15px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #e0e0e0',
                overflow: 'hidden',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <button
                onClick={() => toggleSection(rule.id)}
                style={{
                  width: '100%',
                  padding: '25px 30px',
                  background: openSections[rule.id] 
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'transparent',
                  color: openSections[rule.id] ? 'white' : '#333',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '1.2rem',
                  fontWeight: 'bold',
                  transition: 'all 0.3s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {openSections[rule.id] ? (
                    <FaCheckCircle style={{ fontSize: '1.3rem' }} />
                  ) : (
                    <FaExclamationCircle style={{ fontSize: '1.3rem' }} />
                  )}
                  {rule.title}
                </span>
                {openSections[rule.id] ? (
                  <FaChevronUp style={{ fontSize: '1rem' }} />
                ) : (
                  <FaChevronDown style={{ fontSize: '1rem' }} />
                )}
              </button>
              {openSections[rule.id] && (
                <div style={{
                  padding: '25px 30px',
                  background: '#f8f9fa',
                  color: '#666',
                  lineHeight: '1.8',
                  borderTop: '1px solid #e0e0e0',
                  animation: 'slideDown 0.3s ease'
                }}>
                  {rule.content}
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          border: '2px solid #667eea',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#333' }}>
            Questions or Concerns?
          </h2>
          <p style={{ color: '#666', marginBottom: '25px', lineHeight: '1.8' }}>
            If you have any questions about the voting rules or need assistance, 
            please contact the administrator or submit a request through your dashboard.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
      `}</style>
    </section>
  );
};

export default Rules;
