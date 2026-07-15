// ==================== COMPREHENSIVE REALITY VOTING SYSTEM STORAGE ====================

function emitDataUpdate(scope) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('reality-voting-data-updated', { detail: { scope, at: Date.now() } }));
  }
}

const stateCache = new Map();

function clone(value) {
  if (value === null || value === undefined) return value;
  return JSON.parse(JSON.stringify(value));
}

function getApiBase() {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  return process.env.REACT_APP_API_BASE || `http://${window.location.hostname}:5000`;
}

function stateRequest(method, key, body) {
  if (typeof window === 'undefined') return null;
  const xhr = new XMLHttpRequest();
  const url = `${getApiBase()}/api/state/${encodeURIComponent(key)}`;
  xhr.open(method, url, false);
  xhr.setRequestHeader('Content-Type', 'application/json');
  try {
    xhr.send(body ? JSON.stringify(body) : null);
  } catch {
    return null;
  }

  if (xhr.status < 200 || xhr.status >= 300) return null;
  if (!xhr.responseText) return null;
  try {
    return JSON.parse(xhr.responseText);
  } catch {
    return null;
  }
}

function readState(key, fallbackValue) {
  if (stateCache.has(key)) {
    return clone(stateCache.get(key));
  }

  const response = stateRequest('GET', key);
  if (response && response.found) {
    stateCache.set(key, clone(response.value));
    return clone(response.value);
  }

  if (fallbackValue !== undefined) {
    writeState(key, fallbackValue);
    return clone(fallbackValue);
  }

  return fallbackValue;
}

function writeState(key, value) {
  stateCache.set(key, clone(value));
  stateRequest('PUT', key, { value });
}

// ==================== USERS STORAGE ====================
const USERS_KEY = 'reality-voting-users';

export function getUsers() {
  const parsed = readState(USERS_KEY, getDefaultUsers()) || [];
  const hasAdmin = parsed.some(u => u.isAdmin === true && u.email === 'admin@realityshow.com');
  if (!hasAdmin) {
    const admin = {
      id: parsed.length ? Math.max(...parsed.map(u => Number(u.id))) + 1 : 1,
      name: 'Admin',
      email: 'admin@realityshow.com',
      password: 'admin123',
      phoneNumber: '+1234567890',
      isAdmin: true,
      accountStatus: 'approved',
      createdAt: new Date().toISOString(),
      profilePicture: null,
      lastLogin: null
    };
    const withAdmin = [...parsed, admin];
    writeState(USERS_KEY, withAdmin);
    return withAdmin;
  }
  return parsed;
}

function getDefaultUsers() {
  return [
    {
      id: 1000,
      name: 'Admin',
      email: 'admin@realityshow.com',
      password: 'admin123',
      phoneNumber: '+1234567890',
      isAdmin: true,
      accountStatus: 'approved',
      createdAt: new Date().toISOString(),
      profilePicture: null,
      lastLogin: null
    }
  ];
}

export function setUsers(users) {
  writeState(USERS_KEY, users);
  emitDataUpdate('users');
}

export function getUserById(id) {
  const users = getUsers();
  return users.find(u => String(u.id) === String(id));
}

export function getUserByEmail(email) {
  const users = getUsers();
  return users.find(u => u.email.toLowerCase() === String(email).toLowerCase().trim());
}

export function updateUser(id, updates) {
  const users = getUsers();
  const updated = users.map(u =>
    String(u.id) === String(id) ? { ...u, ...updates, updatedAt: new Date().toISOString() } : u
  );
  setUsers(updated);
  return updated.find(u => String(u.id) === String(id));
}

// ==================== CONTESTS STORAGE ====================
const CONTESTS_KEY = 'reality-voting-contests';

export function getContests() {
  return readState(CONTESTS_KEY, []) || [];
}

export function setContests(contests) {
  writeState(CONTESTS_KEY, contests);
  emitDataUpdate('contests');
}

export function getContestById(id) {
  const contests = getContests();
  return contests.find(c => String(c.id) === String(id));
}

export function getActiveContests() {
  const contests = getContests();
  const now = new Date().toISOString();
  return contests.filter(c => {
    if (c.status !== 'active') return false;
    if (c.votingEnabled === false) return false;
    if (c.startDate && new Date(c.startDate) > new Date(now)) return false;
    if (c.endDate && new Date(c.endDate) < new Date(now)) return false;
    return true;
  });
}

export function addContest(contest) {
  const contests = getContests();
  const nextId = contests.length ? Math.max(...contests.map(c => Number(c.id || 0))) + 1 : 1;
  const newContest = {
    id: nextId,
    ...contest,
    status: contest.status || 'draft',
    votingEnabled: contest.votingEnabled || false,
    resultsPublished: false,
    winnerId: null,
    createdAt: new Date().toISOString(),
    totalVotes: 0
  };
  const updated = [...contests, newContest];
  setContests(updated);
  return newContest;
}

export function updateContest(id, updates) {
  const contests = getContests();
  const updated = contests.map(c =>
    String(c.id) === String(id) ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  setContests(updated);
  return updated.find(c => String(c.id) === String(id));
}

export function deleteContest(id) {
  const contests = getContests();
  const updated = contests.filter(c => String(c.id) !== String(id));
  setContests(updated);
  // Delete contestants and votes for this contest
  deleteContestantsByContestId(id);
  deleteVotesByContestId(id);
}

// ==================== CONTESTANTS STORAGE ====================
const CONTESTANTS_KEY = 'reality-voting-contestants';

export function getContestants() {
  return readState(CONTESTANTS_KEY, []) || [];
}

export function setContestants(contestants) {
  writeState(CONTESTANTS_KEY, contestants);
  emitDataUpdate('contestants');
}

export function getContestantsByContestId(contestId) {
  const contestants = getContestants();
  return contestants.filter(c => String(c.contestId) === String(contestId));
}

export function getContestantById(id) {
  const contestants = getContestants();
  return contestants.find(c => String(c.id) === String(id));
}

export function addContestant(contestant) {
  const contestants = getContestants();
  const nextId = contestants.length ? Math.max(...contestants.map(c => Number(c.id || 0))) + 1 : 1;
  const newContestant = {
    id: nextId,
    ...contestant,
    votes: 0,
    createdAt: new Date().toISOString()
  };
  const updated = [...contestants, newContestant];
  setContestants(updated);
  return newContestant;
}

export function updateContestant(id, updates) {
  const contestants = getContestants();
  const updated = contestants.map(c =>
    String(c.id) === String(id) ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
  );
  setContestants(updated);
  return updated.find(c => String(c.id) === String(id));
}

export function deleteContestant(id) {
  const contestants = getContestants();
  const updated = contestants.filter(c => String(c.id) !== String(id));
  setContestants(updated);
  deleteVotesByContestantId(id);
}

function deleteContestantsByContestId(contestId) {
  const contestants = getContestants();
  const contestantIds = contestants.filter(c => String(c.contestId) === String(contestId)).map(c => c.id);
  const updated = contestants.filter(c => String(c.contestId) !== String(contestId));
  setContestants(updated);
  contestantIds.forEach(contId => deleteVotesByContestantId(contId));
}

// ==================== CONTESTANT REQUESTS STORAGE ====================
const CONTESTANT_REQUESTS_KEY = 'reality-voting-contestant-requests';
const DOCUMENTS_KEY = 'reality-voting-documents';

export async function saveContestantDocument(document) {
  if (!document) return null;
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const docs = readState(DOCUMENTS_KEY, {}) || {};
  docs[id] = { id, ...document };
  writeState(DOCUMENTS_KEY, docs);
  emitDataUpdate('documents');
  return { docId: id, name: document.name, type: document.type, storage: 'mongodb' };
}

export async function getContestantDocumentById(docId) {
  if (!docId) return null;
  const docs = readState(DOCUMENTS_KEY, {}) || {};
  return docs[docId] || null;
}

export function getContestantRequests() {
  return readState(CONTESTANT_REQUESTS_KEY, []) || [];
}

export function setContestantRequests(requests) {
  writeState(CONTESTANT_REQUESTS_KEY, requests);
  emitDataUpdate('contestant-requests');
}

export function getContestantRequestsByUserId(userId) {
  const requests = getContestantRequests();
  return requests.filter(r => String(r.userId) === String(userId));
}

export function getContestantRequestsByContestId(contestId) {
  const requests = getContestantRequests();
  return requests.filter(r => String(r.contestId) === String(contestId));
}

export async function addContestantRequest(request) {
  const requests = getContestantRequests();

  if (!request.userProfilePicture) {
    return { error: 'Please upload a profile photo before applying as a contestant' };
  }

  if (!String(request.candidateBio || '').trim()) {
    return { error: 'Candidate bio is required' };
  }

  if (!String(request.candidateReason || '').trim()) {
    return { error: 'Reason to become a candidate is required' };
  }

  const contestRequests = requests.filter(r =>
    String(r.userId) === String(request.userId) &&
    String(r.contestId) === String(request.contestId)
  );

  const activeRequest = contestRequests.find(r => r.status !== 'rejected');
  if (activeRequest) {
    return { error: 'You have already applied for this contest' };
  }

  const rejectedRequest = request.requestId
    ? contestRequests.find(r => String(r.id) === String(request.requestId) && r.status === 'rejected')
    : [...contestRequests]
        .filter(r => r.status === 'rejected')
        .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0];

  // Check if user has reached the limit of 2 applications (exclude rejected)
  const userRequests = requests.filter(r =>
    String(r.userId) === String(request.userId) && r.status !== 'rejected'
  );
  if (userRequests.length >= 2) {
    return { error: 'You can only apply for a maximum of 2 contests. Please wait for approval or rejection before applying to more contests.' };
  }

  let documentRef = request.document || null;
  if (request.document?.data) {
    try {
      documentRef = await saveContestantDocument(request.document);
    } catch {
      return { error: 'Failed to store document. Please try again.' };
    }
  }

  if (rejectedRequest) {
    const updatedRequest = {
      ...rejectedRequest,
      ...request,
      candidateBio: String(request.candidateBio || '').trim(),
      candidateReason: String(request.candidateReason || '').trim(),
      status: 'pending',
      updatedAt: new Date().toISOString(),
      resubmittedAt: new Date().toISOString(),
      rejectionReason: '',
      rejectedBy: null,
      rejectedAt: null,
      document: documentRef || rejectedRequest.document || null
    };

    const resubmitted = requests.map(r =>
      String(r.id) === String(rejectedRequest.id) ? updatedRequest : r
    );

    try {
      setContestantRequests(resubmitted);
      return updatedRequest;
    } catch (error) {
      const isQuotaError = error && (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        String(error.message || '').toLowerCase().includes('quota')
      );
      return {
        error: isQuotaError
          ? 'Storage limit reached. Please clear browser storage and try again.'
          : 'Failed to save application. Please try again.'
      };
    }
  }

  const nextId = requests.length ? Math.max(...requests.map(r => Number(r.id || 0))) + 1 : 1;
  const newRequest = {
    id: nextId,
    ...request,
    candidateBio: String(request.candidateBio || '').trim(),
    candidateReason: String(request.candidateReason || '').trim(),
    status: 'pending', // pending, approved, rejected
    createdAt: new Date().toISOString(),
    document: documentRef
  };

  const updated = [...requests, newRequest];
  try {
    setContestantRequests(updated);
    return newRequest;
  } catch (error) {
    const isQuotaError = error && (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      String(error.message || '').toLowerCase().includes('quota')
    );
    return {
      error: isQuotaError
        ? 'Storage limit reached. Please clear browser storage and try again.'
        : 'Failed to save application. Please try again.'
    };
  }
}

export function updateContestantRequest(id, updates) {
  const requests = getContestantRequests();
  const updated = requests.map(r =>
    String(r.id) === String(id) ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
  );
  setContestantRequests(updated);
  return updated.find(r => String(r.id) === String(id));
}

export function deleteContestantRequest(id) {
  const requests = getContestantRequests();
  const updated = requests.filter(r => String(r.id) !== String(id));
  setContestantRequests(updated);
}

export function approveContestantRequest(requestId, adminId) {
  const request = getContestantRequests().find(r => String(r.id) === String(requestId));
  if (!request) return { error: 'Request not found' };

  const user = getUserById(request.userId);
  if (!user) return { error: 'User not found' };

  // Validate user eligibility
  if (user.accountStatus !== 'approved') {
    return { error: 'User account is not approved' };
  }

  if (user.accountStatus === 'suspended') {
    return { error: 'User account is suspended' };
  }

  // Check if user is already a contestant
  const existingContestants = getContestantsByContestId(request.contestId);
  if (existingContestants.some(c => String(c.userId) === String(request.userId))) {
    return { error: 'User is already a contestant in this contest' };
  }

  // Create contestant
  const newContestant = addContestant({
    contestId: request.contestId,
    userId: request.userId,
    name: user.name,
    email: user.email,
    profilePicture: request.userProfilePicture || user.profilePicture,
    bio: request.candidateBio || request.statement || '',
    reason: request.candidateReason || '',
    statement: request.statement,
    approvedBy: adminId
  });

  // Update request status
  updateContestantRequest(requestId, {
    status: 'approved',
    approvedBy: adminId,
    approvedAt: new Date().toISOString()
  });

  // Notify user
  addNotification({
    userId: request.userId,
    type: 'contestant_approved',
    title: 'Contestant Application Approved',
    message: `Your application to be a contestant has been approved!`,
    link: '/user/dashboard'
  });

  // Log activity
  addActivityLog({
    type: 'contestant_approved',
    userId: adminId,
    targetUserId: request.userId,
    contestId: request.contestId,
    details: `Approved contestant application for user ${user.name}`
  });

  return { success: true, contestant: newContestant };
}

export function rejectContestantRequest(requestId, adminId, reason = '') {
  const request = getContestantRequests().find(r => String(r.id) === String(requestId));
  if (!request) return { error: 'Request not found' };

  // Update request status
  updateContestantRequest(requestId, {
    status: 'rejected',
    rejectedBy: adminId,
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason
  });

  // Notify user
  addNotification({
    userId: request.userId,
    type: 'contestant_rejected',
    title: 'Contestant Application Rejected',
    message: reason || 'Your application to be a contestant has been rejected.',
    link: '/user/dashboard'
  });

  // Log activity
  addActivityLog({
    type: 'contestant_rejected',
    userId: adminId,
    targetUserId: request.userId,
    contestId: request.contestId,
    details: `Rejected contestant application${reason ? ': ' + reason : ''}`
  });

  return { success: true };
}

// ==================== VOTES STORAGE ====================
const VOTES_KEY = 'reality-voting-votes';
const USER_VOTES_KEY = 'reality-voting-user-votes';

export function getVotes() {
  return readState(VOTES_KEY, []) || [];
}

export function setVotes(votes) {
  writeState(VOTES_KEY, votes);
  emitDataUpdate('votes');
}

export function getVotesByContestId(contestId) {
  const votes = getVotes();
  return votes.filter(v => String(v.contestId) === String(contestId));
}

export function getUserVoteForContest(userId, contestId) {
  const votes = getVotes();
  return votes.find(v => String(v.userId) === String(userId) && String(v.contestId) === String(contestId)) || null;
}

export function getVotesByContestantId(contestantId) {
  const votes = getVotes();
  return votes.filter(v => String(v.contestantId) === String(contestantId));
}

export function getUserVotes() {
  return readState(USER_VOTES_KEY, {}) || {};
}

export function setUserVotes(userVotes) {
  writeState(USER_VOTES_KEY, userVotes);
  emitDataUpdate('user-votes');
}

export function hasUserVotedInContest(userId, contestId) {
  const userVotes = getUserVotes();
  return userVotes[String(userId)]?.includes(String(contestId)) || false;
}

export function castVote(userId, contestId, contestantId, confidenceScore = null) {
  // Check if user already voted
  if (hasUserVotedInContest(userId, contestId)) {
    return { success: false, error: 'You have already voted in this contest' };
  }

  // Validate contest
  const contest = getContestById(contestId);
  if (!contest) {
    return { success: false, error: 'Contest not found' };
  }

  if (contest.status !== 'active' || !contest.votingEnabled) {
    return { success: false, error: 'Voting is not currently open for this contest' };
  }

  // Validate contestant
  const contestant = getContestantById(contestantId);
  if (!contestant || String(contestant.contestId) !== String(contestId)) {
    return { success: false, error: 'Invalid contestant' };
  }

  // Prevent active contestants from voting in their own contest
  const contestContestants = getContestantsByContestId(contestId);
  const isActiveContestant = contestContestants.some(c => String(c.userId) === String(userId));
  if (isActiveContestant) {
    return { success: false, error: 'You cannot vote in a contest where you are a contestant' };
  }

  // Create vote
  const votes = getVotes();
  const nextVoteId = votes.length ? Math.max(...votes.map(v => Number(v.id || 0))) + 1 : 1;
  const voteId = `VOTE-${Date.now()}-${nextVoteId}`;
  const newVote = {
    id: nextVoteId,
    voteId: voteId,
    userId: String(userId),
    contestId: String(contestId),
    contestantId: String(contestantId),
    timestamp: new Date().toISOString(),
    confidenceScore: confidenceScore !== null ? Number(confidenceScore) : null
  };

  // Save vote
  const updatedVotes = [...votes, newVote];
  setVotes(updatedVotes);

  // Update user votes tracking
  const userVotes = getUserVotes();
  if (!userVotes[String(userId)]) {
    userVotes[String(userId)] = [];
  }
  userVotes[String(userId)].push(String(contestId));
  setUserVotes(userVotes);

  // Update contest vote count
  updateContest(contestId, {
    totalVotes: (contest.totalVotes || 0) + 1
  });

  // Update contestant vote count
  updateContestant(contestantId, {
    votes: (contestant.votes || 0) + 1
  });

  return { success: true, vote: newVote, voteId: voteId };
}

export function resetUserVote(userId, contestId) {
  const votes = getVotes();
  const voteToRemove = votes.find(v =>
    String(v.userId) === String(userId) && String(v.contestId) === String(contestId)
  );

  if (voteToRemove) {
    // Remove vote
    const updatedVotes = votes.filter(v => v.id !== voteToRemove.id);
    setVotes(updatedVotes);

    // Update user votes tracking
    const userVotes = getUserVotes();
    if (userVotes[String(userId)]) {
      userVotes[String(userId)] = userVotes[String(userId)].filter(id => String(id) !== String(contestId));
      setUserVotes(userVotes);
    }

    // Update contest vote count
    const contest = getContestById(contestId);
    if (contest) {
      updateContest(contestId, {
        totalVotes: Math.max(0, (contest.totalVotes || 0) - 1)
      });
    }

    // Update contestant vote count
    const contestant = getContestantById(voteToRemove.contestantId);
    if (contestant) {
      updateContestant(voteToRemove.contestantId, {
        votes: Math.max(0, (contestant.votes || 0) - 1)
      });
    }

    return { success: true };
  }

  return { success: false, error: 'Vote not found' };
}

function deleteVotesByContestId(contestId) {
  const votes = getVotes();
  const updated = votes.filter(v => String(v.contestId) !== String(contestId));
  setVotes(updated);
}

function deleteVotesByContestantId(contestantId) {
  const votes = getVotes();
  const updated = votes.filter(v => String(v.contestantId) !== String(contestantId));
  setVotes(updated);
}

// ==================== NOTIFICATIONS STORAGE ====================
const NOTIFICATIONS_KEY = 'reality-voting-notifications';

export function getNotifications() {
  const notifications = readState(NOTIFICATIONS_KEY, []) || [];
  return notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function setNotifications(notifications) {
  writeState(NOTIFICATIONS_KEY, notifications);
  emitDataUpdate('notifications');
}

export function getNotificationsByUserId(userId) {
  const notifications = getNotifications();
  return notifications.filter(n => String(n.userId) === String(userId) || n.userId === 'all');
}

export function getUnreadNotificationCount(userId) {
  const notifications = getNotificationsByUserId(userId);
  return notifications.filter(n => !n.read).length;
}

export function addNotification(notification) {
  const notifications = getNotifications();
  const nextId = notifications.length ? Math.max(...notifications.map(n => Number(n.id || 0))) + 1 : 1;
  const newNotification = {
    id: nextId,
    ...notification,
    read: false,
    timestamp: new Date().toISOString()
  };
  const updated = [newNotification, ...notifications].slice(0, 1000); // Keep last 1000
  setNotifications(updated);
  return newNotification;
}

export function markNotificationAsRead(notificationId) {
  const notifications = getNotifications();
  const updated = notifications.map(n =>
    String(n.id) === String(notificationId) ? { ...n, read: true } : n
  );
  setNotifications(updated);
}

// ==================== ANNOUNCEMENTS STORAGE ====================
const ANNOUNCEMENTS_KEY = 'reality-voting-announcements';

export function getAnnouncements() {
  const list = readState(ANNOUNCEMENTS_KEY, []) || [];
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function setAnnouncements(items) {
  writeState(ANNOUNCEMENTS_KEY, items);
  emitDataUpdate('announcements');
}

export function addAnnouncement({ title, message, createdBy }) {
  const items = getAnnouncements();
  const nextId = items.length ? Math.max(...items.map(i => Number(i.id || 0))) + 1 : 1;
  const newItem = {
    id: nextId,
    title: title?.trim() || 'Announcement',
    message: message?.trim() || '',
    createdBy: createdBy || null,
    createdAt: new Date().toISOString()
  };
  const updated = [newItem, ...items].slice(0, 500);
  setAnnouncements(updated);
  return newItem;
}

export function markAllNotificationsAsRead(userId) {
  const notifications = getNotifications();
  const updated = notifications.map(n =>
    (String(n.userId) === String(userId) || n.userId === 'all') && !n.read
      ? { ...n, read: true }
      : n
  );
  setNotifications(updated);
}

// ==================== USER REQUESTS STORAGE ====================
const REQUESTS_KEY = 'reality-voting-requests';

export function getRequests() {
  return readState(REQUESTS_KEY, []) || [];
}

export function setRequests(requests) {
  writeState(REQUESTS_KEY, requests);
  emitDataUpdate('requests');
}

export function getRequestsByUserId(userId) {
  const requests = getRequests();
  return requests.filter(r => String(r.userId) === String(userId));
}

export function getPendingRequests() {
  const requests = getRequests();
  return requests.filter(r => r.status === 'pending');
}

export function addRequest(request) {
  const requests = getRequests();
  const nextId = requests.length ? Math.max(...requests.map(r => Number(r.id || 0))) + 1 : 1;
  const newRequest = {
    id: nextId,
    ...request,
    status: 'pending',
    createdAt: new Date().toISOString(),
    reviewedAt: null,
    reviewedBy: null
  };
  const updated = [...requests, newRequest];
  setRequests(updated);
  return newRequest;
}

export function updateRequest(id, updates) {
  const requests = getRequests();
  const updated = requests.map(r =>
    String(r.id) === String(id)
      ? { ...r, ...updates, reviewedAt: new Date().toISOString() }
      : r
  );
  setRequests(updated);
  return updated.find(r => String(r.id) === String(id));
}

// ==================== SYSTEM SETTINGS STORAGE ====================
const SETTINGS_KEY = 'reality-voting-settings';
const BADGES_KEY = 'reality-voting-badges';

export function getSettings() {
  return readState(SETTINGS_KEY, getDefaultSettings()) || getDefaultSettings();
}

function getDefaultSettings() {
  return {
    systemName: 'Reality Show Voting System',
    logo: null,
    votingEnabled: true,
    maintenanceMode: false,
    votingWindowStart: null, // ISO string
    votingWindowEnd: null,   // ISO string
    badgeEnabled: true,
    earlyVoterMinutes: 30,
    allowVoteReset: true,
    allowUsernameChange: true,
    updatedAt: new Date().toISOString()
  };
}

export function setSettings(settings) {
  writeState(SETTINGS_KEY, settings);
  emitDataUpdate('settings');
}

export function updateSettings(updates) {
  const current = getSettings();
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  setSettings(updated);
  return updated;
}

// Voting window helpers (global window applied to all contests)
export function getVotingWindow() {
  const settings = getSettings();
  const start = settings.votingWindowStart ? new Date(settings.votingWindowStart) : null;
  const end = settings.votingWindowEnd ? new Date(settings.votingWindowEnd) : null;
  return { start, end, enabled: !!(settings.votingWindowStart && settings.votingWindowEnd) };
}

export function getVotingWindowStatus() {
  const { start, end, enabled } = getVotingWindow();
  const now = new Date();
  if (!enabled || !start || !end) return { status: 'open', message: 'Voting window not set', ms: 0 };
  if (now < start) return { status: 'upcoming', message: 'Voting starts soon', ms: start - now };
  if (now > end) return { status: 'closed', message: 'Voting closed', ms: 0 };
  return { status: 'open', message: 'Voting is open', ms: end - now };
}

export function isVotingOpenNow() {
  const { status } = getVotingWindowStatus();
  return status === 'open';
}

// Contest results published helper (supports legacy flag storage)
export function isContestResultsPublished(contestId) {
  const contest = getContestById(contestId);
  return Boolean(contest?.resultsPublished);
}

// Badges storage
function getAllBadges() {
  return readState(BADGES_KEY, {}) || {};
}

function setAllBadges(badges) {
  writeState(BADGES_KEY, badges);
  emitDataUpdate('badges');
}

export function getBadgeStats() {
  const all = getAllBadges();
  const users = getUsers().filter(u => !u.isAdmin);
  const distribution = {};
  Object.values(all).forEach(list => {
    list.forEach(b => {
      distribution[b.type] = (distribution[b.type] || 0) + 1;
    });
  });

  const mostActive = Object.entries(all)
    .map(([userId, list]) => ({ userId, count: list.length }))
    .sort((a, b) => b.count - a.count);

  return {
    totalBadges: Object.values(all).reduce((sum, list) => sum + list.length, 0),
    distribution,
    mostActiveUser: mostActive.length ? users.find(u => String(u.id) === String(mostActive[0].userId)) || null : null
  };
}

export function getUserBadges(userId) {
  const all = getAllBadges();
  return all[String(userId)] || [];
}

export function awardBadge(userId, type, meta = {}) {
  const settings = getSettings();
  if (settings.badgeEnabled === false) return null;
  const all = getAllBadges();
  const userBadges = all[String(userId)] || [];
  const already = userBadges.find(b => b.type === type);
  if (already) return already;
  const badge = { type, meta, awardedAt: new Date().toISOString(), id: `${type}-${Date.now()}` };
  all[String(userId)] = [...userBadges, badge];
  setAllBadges(all);
  return badge;
}

export function hasBadge(userId, type) {
  return getUserBadges(userId).some(b => b.type === type);
}

// ==================== ACTIVITY LOGS STORAGE ====================
const LOGS_KEY = 'reality-voting-logs';

export function getActivityLogs() {
  const logs = readState(LOGS_KEY, []) || [];
  return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function setActivityLogs(logs) {
  writeState(LOGS_KEY, logs);
  emitDataUpdate('logs');
}

export function addActivityLog(log) {
  const logs = getActivityLogs();
  const nextId = logs.length ? Math.max(...logs.map(l => Number(l.id || 0))) + 1 : 1;
  const newLog = {
    id: nextId,
    ...log,
    timestamp: new Date().toISOString()
  };
  const updated = [newLog, ...logs].slice(0, 1000); // Keep last 1000
  setActivityLogs(updated);
  return newLog;
}

export function getActivityLogsByUserId(userId) {
  const logs = getActivityLogs();
  return logs.filter(l => String(l.userId) === String(userId));
}

export function deleteActivityLog(id) {
  const logs = getActivityLogs();
  const updated = logs.filter(l => String(l.id) !== String(id));
  setActivityLogs(updated);
}

export function clearUserActivityLogs(userId) {
  const logs = getActivityLogs();
  const updated = logs.filter(l => String(l.userId) !== String(userId));
  setActivityLogs(updated);
}

// ==================== ANALYTICS HELPERS ====================
export function getSystemStats() {
  const users = getUsers();
  const contests = getContests();
  const votes = getVotes();
  const requests = getRequests();
  const notifications = getNotifications();
  const badgesTotal = Object.values(getAllBadges()).reduce((sum, list) => sum + list.length, 0);

  return {
    totalUsers: users.filter(u => !u.isAdmin).length,
    approvedUsers: users.filter(u => !u.isAdmin && u.accountStatus === 'approved').length,
    pendingUsers: users.filter(u => !u.isAdmin && u.accountStatus === 'pending').length,
    suspendedUsers: users.filter(u => !u.isAdmin && u.accountStatus === 'suspended').length,
    totalContests: contests.length,
    activeContests: contests.filter(c => c.status === 'active').length,
    totalVotes: votes.length,
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    unreadNotifications: notifications.filter(n => !n.read).length,
    totalBadges: badgesTotal
  };
}

export function getConfidenceStatsByContest(contestId) {
  const votes = getVotesByContestId(contestId).filter(v => v.confidenceScore !== null && v.confidenceScore !== undefined);
  const byContestant = {};
  votes.forEach(v => {
    if (!byContestant[v.contestantId]) {
      byContestant[v.contestantId] = { total: 0, count: 0 };
    }
    byContestant[v.contestantId].total += Number(v.confidenceScore);
    byContestant[v.contestantId].count += 1;
  });

  const entries = Object.entries(byContestant).map(([contestantId, info]) => ({
    contestantId: String(contestantId),
    average: info.count ? info.total / info.count : 0,
    count: info.count
  }));

  const overall = votes.length ? (votes.reduce((sum, v) => sum + Number(v.confidenceScore), 0) / votes.length) : null;
  return { overall, byContestant: entries };
}

export function getContestMargin(contestId) {
  const results = getContestResults(contestId);
  if (!results.length) return { status: 'no-data', margin: 0, winnerId: null, runnerUpId: null, totalVotes: 0 };
  const sorted = [...results].sort((a, b) => b.votes - a.votes);
  const winner = sorted[0];
  const runnerUp = sorted[1] || { votes: 0, id: null };
  const margin = (winner?.votes || 0) - (runnerUp?.votes || 0);
  const totalVotes = sorted.reduce((sum, r) => sum + (r.votes || 0), 0);
  const ratio = totalVotes ? margin / totalVotes : 0;
  let classification = 'balanced';
  if (margin === 0) classification = 'tie';
  else if (ratio <= 0.05) classification = 'close';
  else if (ratio >= 0.25) classification = 'landslide';

  return {
    status: 'ok',
    margin,
    winnerId: winner?.id || winner?.contestantId || null,
    runnerUpId: runnerUp?.id || runnerUp?.contestantId || null,
    totalVotes,
    classification
  };
}

export function getImpactForVote(vote) {
  const marginData = getContestMargin(vote.contestId);
  if (marginData.status !== 'ok' || !marginData.winnerId) return { contributionPercent: null, classification: 'no-data', margin: 0 };
  const votedForWinner = String(vote.contestantId) === String(marginData.winnerId);
  const margin = Math.max(0, marginData.margin);
  if (!votedForWinner) {
    return { contributionPercent: 0, classification: marginData.classification, margin };
  }
  if (margin <= 0) {
    return { contributionPercent: 100, classification: 'tie', margin: 0 };
  }
  const contributionPercent = Math.min(100, (1 / margin) * 100);
  return { contributionPercent, classification: marginData.classification, margin };
}

export function getContestResults(contestId) {
  const contestants = getContestantsByContestId(contestId);
  const votes = getVotesByContestId(contestId);

  const voteCounts = {};
  votes.forEach(vote => {
    voteCounts[vote.contestantId] = (voteCounts[vote.contestantId] || 0) + 1;
  });

  return contestants
    .map(c => ({
      ...c,
      votes: voteCounts[String(c.id)] || 0,
      percentage: votes.length > 0 ? ((voteCounts[String(c.id)] || 0) / votes.length) * 100 : 0
    }))
    .sort((a, b) => b.votes - a.votes);
}

// Legacy compatibility functions
export const appendActivityLog = addActivityLog;
export const getActivityLog = getActivityLogs;
export const getSeasons = getContests;
export const setSeasons = setContests;
export const getEpisodes = () => [];
export const setEpisodes = () => { };
export const getActiveEpisodes = () => [];
