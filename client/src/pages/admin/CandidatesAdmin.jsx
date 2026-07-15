import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { adminFetch } from '../../api';
import {
  addActivityLog
} from '../../utils/storage';
import {
  FaUsers, FaSearch, FaPlus, FaTrash, FaImage, FaUpload,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle
} from 'react-icons/fa';

const CandidatesAdmin = () => {
  const { user, refreshData } = useApp();
  const navigate = useNavigate();
  const imageInputRef = useRef(null);
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [activeContests, setActiveContests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contestId: '',
    image: null
  });

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate]);

  useEffect(() => {
    filterCandidates();
  }, [searchTerm, candidates]);

  const loadData = async () => {
    try {
      const allContests = await adminFetch('/api/elections');
      const allCandidates = (allContests || []).flatMap(contest =>
        (contest.candidates || []).map(candidate => ({
          ...candidate,
          contestId: contest.id,
          contestTitle: contest.title
        }))
      );

      setCandidates(allCandidates);
      setFilteredCandidates(allCandidates);
      setActiveContests(allContests || []);
      refreshData();
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to load candidates' });
    }
  };

  const filterCandidates = () => {
    if (!searchTerm.trim()) {
      setFilteredCandidates(candidates);
      return;
    }
    const filtered = candidates.filter(c =>
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCandidates(filtered);
  };

  const cleanFormData = () => {
    setFormData({ name: '', description: '', contestId: activeContests[0]?.id || '', image: null });
    setImagePreview(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size must be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    if (!formData.contestId) {
      setMessage({ type: 'error', text: 'Please select a contest' });
      setLoading(false);
      return;
    }

    try {
      await adminFetch('/api/admin/candidates', {
        method: 'POST',
        body: JSON.stringify({
        electionId: formData.contestId,
        name: formData.name.trim(),
        position: 'Contestant',
        bio: formData.description.trim(),
        image: formData.image
      })
      });

      addActivityLog({
        type: 'candidate_added',
        userId: user.id,
        action: `Added candidate "${formData.name}"`
      });

      await loadData();
      setShowModal(false);
      cleanFormData();
      setMessage({ type: 'success', text: 'Candidate added successfully!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error?.message || 'Failed to add candidate' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will confirm deletion.`)) {
      try {
        await adminFetch(`/api/admin/candidates/${id}`, {
          method: 'DELETE'
        });
        addActivityLog({
          type: 'candidate_deleted',
          userId: user.id,
          action: `Deleted candidate "${name}"`
        });
        await loadData();
        setMessage({ type: 'success', text: 'Candidate deleted successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } catch (error) {
        setMessage({ type: 'error', text: error?.message || 'Failed to delete candidate' });
      }
    }
  };

  if (!user || !user.isAdmin) return null;

  return (
    <section style={{ padding: '30px 0', minHeight: '100vh', background: 'var(--bg-top)' }}>
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
          <h1 style={{
            fontSize: '2.5rem',
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '15px'
          }}>
            <FaUsers /> Candidates Management
          </h1>
          <button
            onClick={() => {
              cleanFormData();
              setShowModal(true);
            }}
            style={{
              padding: '12px 25px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '1rem',
              transition: 'all 0.3s ease'
            }}
          >
            <FaPlus /> Add Candidate
          </button>
        </div>

        {message.text && (
          <div style={{
            padding: '15px 20px',
            borderRadius: '12px',
            marginBottom: '25px',
            background: message.type === 'success' ? '#51cf66' : '#ff6b6b',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            {message.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            {message.text}
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '30px', position: 'relative', maxWidth: '500px' }}>
          <FaSearch style={{
            position: 'absolute',
            left: '15px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 15px 12px 45px',
              border: '2px solid #e0e0e0',
              borderRadius: '10px',
              fontSize: '1rem',
              transition: 'border-color 0.3s ease'
            }}
          />
        </div>

        {/* Candidates Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' }}>
          {filteredCandidates.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              background: 'white',
              padding: '60px',
              borderRadius: '20px',
              textAlign: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
              <FaUsers style={{ fontSize: '4rem', color: '#ccc', marginBottom: '20px' }} />
              <h3 style={{ marginBottom: '10px', color: '#666' }}>No Candidates Found</h3>
              <p style={{ color: '#999' }}>
                {searchTerm ? 'Try adjusting your search terms' : 'Add candidates to get started'}
              </p>
            </div>
          ) : (
            filteredCandidates.map(candidate => {
              return (
                <div
                  key={candidate.id}
                  style={{
                    background: 'white',
                    padding: '25px',
                    borderRadius: '20px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    border: '1px solid #e0e0e0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '15px',
                    transition: 'transform 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                    {candidate.image ? (
                      <img
                        src={candidate.image}
                        alt={candidate.name}
                        style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold'
                      }}>
                        {candidate.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>{candidate.name}</h3>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>
                        {candidate.contestTitle || 'Unknown Contest'}
                      </span>
                    </div>
                  </div>

                  <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: '1.5', flex: 1 }}>
                    {candidate.description || 'No description provided'}
                  </p>

                  <div style={{ borderTop: '1px solid #eee', paddingTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: '#666' }}>
                      <strong>{candidate.votes || 0}</strong> votes
                    </span>
                    <button
                      onClick={() => handleDelete(candidate.id, candidate.name)}
                      style={{
                        padding: '8px 12px',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                      title="Delete Candidate"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '25px',
              padding: '40px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.8rem', marginBottom: '25px' }}>Add New Candidate</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Contest *</label>
                <select
                  value={formData.contestId}
                  onChange={(e) => setFormData({ ...formData, contestId: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  <option value="">Select a contest...</option>
                  {activeContests.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.status})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '10px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Image</label>
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" style={{ width: '100px', height: '100px', borderRadius: '10px', marginBottom: '10px', objectFit: 'cover' }} />
                )}
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 20px',
                    background: '#f0f0f0',
                    border: '1px solid #ccc',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <FaUpload /> Upload Image
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end', marginTop: '30px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 30px',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 30px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Adding...' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default CandidatesAdmin;
