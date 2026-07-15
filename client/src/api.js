export const adminFetch = async (url, options = {}) => {
  const adminSessionId = sessionStorage.getItem('session-admin-id') || sessionStorage.getItem('session-user-id');
  const headers = {
    'Content-Type': 'application/json',
    ...(adminSessionId ? { 'x-user-id': adminSessionId } : {}),
    ...(options.headers || {})
  };
  const isApi = typeof url === 'string' && url.startsWith('/api');
  const defaultBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
  const apiBase = process.env.REACT_APP_API_BASE || (isApi ? defaultBase : '');
  const fullUrl = isApi ? `${apiBase}${url}` : url;

  const res = await fetch(fullUrl, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (HTTP ${res.status})`;
    try {
      const err = await res.json();
      if (err && err.message) msg = err.message;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
};

export const apiFetch = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const isApi = typeof url === 'string' && url.startsWith('/api');
  const defaultBase = typeof window !== 'undefined' ? `http://${window.location.hostname}:5000` : 'http://localhost:5000';
  const apiBase = process.env.REACT_APP_API_BASE || (isApi ? defaultBase : '');
  const fullUrl = isApi ? `${apiBase}${url}` : url;

  const res = await fetch(fullUrl, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (HTTP ${res.status})`;
    try {
      const err = await res.json();
      if (err && err.message) msg = err.message;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
};

export const getApiUserId = () => {
  const userId = sessionStorage.getItem('session-user-id');
  const adminId = sessionStorage.getItem('session-admin-id');
  return userId || adminId || null;
};

export const fetchElections = async () => {
  return apiFetch('/api/elections');
};

export const fetchElectionCandidates = async (electionId) => {
  return apiFetch(`/api/elections/${electionId}/candidates`);
};

export const fetchResults = async () => {
  return apiFetch('/api/results');
};

export const fetchVoterById = async (id) => {
  return apiFetch(`/api/voters/${id}`);
};

export const updateVoterProfileApi = async ({ id, name, email, phoneNumber, profilePicture }) => {
  const actingUserId = getApiUserId();
  return apiFetch(`/api/voters/${id}`, {
    method: 'PATCH',
    headers: {
      ...(actingUserId ? { 'x-user-id': String(actingUserId) } : {}),
    },
    body: JSON.stringify({
      name,
      email,
      phoneNumber,
      profilePicture,
    }),
  });
};

export const registerVoterApi = async ({ name, email, phoneNumber, password, role = 'user', profilePicture = null }) => {
  return apiFetch('/api/voters/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email,
      phoneNumber,
      password,
      role,
      profilePicture,
    }),
  });
};

export const loginVoterApi = async ({ email, password }) => {
  return apiFetch('/api/voters/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const castVoteApi = async ({ candidateId, userId, confidenceScore = null, algorithm = 'plurality' }) => {
  return apiFetch(`/api/candidates/${candidateId}/vote`, {
    method: 'POST',
    headers: {
      'x-user-id': String(userId),
    },
    body: JSON.stringify({
      userId,
      confidenceScore,
      algorithm,
    }),
  });
};


