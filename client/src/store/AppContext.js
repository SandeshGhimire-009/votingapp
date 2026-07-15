import React, { createContext, useContext, useEffect, useReducer } from 'react';
import {
  getUsers, setUsers, updateUser,
  getContests, getActiveContests, getContestById, addContest, updateContest, deleteContest,
  getContestants, getContestantsByContestId, getContestantById, addContestant, updateContestant, deleteContestant,
  castVote, hasUserVotedInContest, resetUserVote, getVotesByContestId, getContestResults,
  getNotifications, getNotificationsByUserId, getUnreadNotificationCount, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
  getRequests, getRequestsByUserId, getPendingRequests, addRequest, updateRequest,
  getSettings, updateSettings,
  getActivityLogs, addActivityLog, getSystemStats,
  getUserVotes, getVotingWindowStatus, getVotingWindow, awardBadge, hasBadge
} from '../utils/storage';
import { fetchElections, fetchElectionCandidates, castVoteApi, fetchVoterById, registerVoterApi, loginVoterApi, updateVoterProfileApi } from '../api';

const USER_SESSION_KEY = 'session-user-id';
const ADMIN_SESSION_KEY = 'session-admin-id';

const initialState = {
  contests: [],
  activeContests: [],
  contestants: [],
  users: [],
  user: null,
  isAuthenticated: false,
  initialized: false,
  loading: false,
  error: null,
  stats: null,
  settings: null,
  notifications: [],
  requests: []
};

const ActionTypes = {
  INIT: 'INIT',
  SET_INITIALIZED: 'SET_INITIALIZED',
  INIT_CONTESTS: 'INIT_CONTESTS',
  INIT_ACTIVE_CONTESTS: 'INIT_ACTIVE_CONTESTS',
  INIT_CONTESTANTS: 'INIT_CONTESTANTS',
  INIT_USERS: 'INIT_USERS',
  INIT_SETTINGS: 'INIT_SETTINGS',
  INIT_STATS: 'INIT_STATS',
  INIT_NOTIFICATIONS: 'INIT_NOTIFICATIONS',
  INIT_REQUESTS: 'INIT_REQUESTS',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  CAST_VOTE: 'CAST_VOTE',
  UPDATE_CONTEST: 'UPDATE_CONTEST',
  UPDATE_CONTESTANT: 'UPDATE_CONTESTANT',
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  MARK_NOTIFICATION_READ: 'MARK_NOTIFICATION_READ',
  ADD_REQUEST: 'ADD_REQUEST',
  UPDATE_REQUEST: 'UPDATE_REQUEST'
};

const appReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.INIT:
      return {
        ...state,
        users: action.payload.users,
        user: action.payload.user,
        isAuthenticated: !!action.payload.user,
        initialized: action.payload.initialized ?? state.initialized
      };
    case ActionTypes.SET_INITIALIZED:
      return {
        ...state,
        initialized: !!action.payload
      };
    case ActionTypes.INIT_CONTESTS:
      return { ...state, contests: action.payload };
    case ActionTypes.INIT_ACTIVE_CONTESTS:
      return { ...state, activeContests: action.payload };
    case ActionTypes.INIT_CONTESTANTS:
      return { ...state, contestants: action.payload };
    case ActionTypes.INIT_USERS:
      return { ...state, users: action.payload };
    case ActionTypes.INIT_SETTINGS:
      return { ...state, settings: action.payload };
    case ActionTypes.INIT_STATS:
      return { ...state, stats: action.payload };
    case ActionTypes.INIT_NOTIFICATIONS:
      return { ...state, notifications: action.payload };
    case ActionTypes.INIT_REQUESTS:
      return { ...state, requests: action.payload };
    case ActionTypes.LOGIN:
      return { ...state, user: action.payload, isAuthenticated: true, error: null };
    case ActionTypes.LOGOUT:
      return { ...state, user: null, isAuthenticated: false };
    case ActionTypes.REGISTER:
      return { ...state, users: action.payload.users, user: action.payload.user, isAuthenticated: true };
    case ActionTypes.UPDATE_PROFILE:
      return { ...state, users: action.payload.users, user: action.payload.user };
    case ActionTypes.CAST_VOTE:
      return { ...state };
    case ActionTypes.UPDATE_CONTEST:
      return {
        ...state,
        contests: state.contests.map(c => c.id === action.payload.id ? action.payload : c),
        activeContests: state.activeContests.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case ActionTypes.UPDATE_CONTESTANT:
      return {
        ...state,
        contestants: state.contestants.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case ActionTypes.ADD_NOTIFICATION:
      return { ...state, notifications: [action.payload, ...state.notifications] };
    case ActionTypes.MARK_NOTIFICATION_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
    case ActionTypes.ADD_REQUEST:
      return { ...state, requests: [...state.requests, action.payload] };
    case ActionTypes.UPDATE_REQUEST:
      return {
        ...state,
        requests: state.requests.map(r => r.id === action.payload.id ? action.payload : r)
      };
    default:
      return state;
  }
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const normalizeUserForCompare = (user) => {
    if (!user) return null;
    return {
      id: Number(user.id),
      email: String(user.email || '').toLowerCase().trim(),
      name: user.name || '',
      phoneNumber: user.phoneNumber || '',
      studentId: user.studentId || '',
      isAdmin: !!user.isAdmin,
      accountStatus: user.accountStatus || '',
      hasVoted: Array.isArray(user.hasVoted)
        ? [...user.hasVoted].map(Number).sort((a, b) => a - b)
        : [],
      document: user.document || null,
      profilePicture: user.profilePicture || null,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
      lastLogin: user.lastLogin || null,
    };
  };

  const isSameUserData = (left, right) => {
    const normalizedLeft = normalizeUserForCompare(left);
    const normalizedRight = normalizeUserForCompare(right);
    return JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight);
  };

  const syncServerElectionData = async () => {
    try {
      const electionList = await fetchElections();
      const allCandidates = [];

      for (const election of electionList) {
        const candidates = await fetchElectionCandidates(election.id);
        const normalized = candidates.map((candidate) => ({
          ...candidate,
          contestId: election.id,
        }));
        allCandidates.push(...normalized);
      }

      const mappedContests = electionList.map((election) => ({
        id: election.id,
        title: election.title,
        description: election.description,
        startDate: election.startDate,
        endDate: election.endDate,
        status: election.status,
        resultsPublished: election.resultsPublished === true,
        totalVotes: election.totalVotes || 0,
        votingEnabled: election.status === 'active',
      }));

      dispatch({ type: ActionTypes.INIT_CONTESTS, payload: mappedContests });
      dispatch({ type: ActionTypes.INIT_ACTIVE_CONTESTS, payload: mappedContests.filter(c => c.status === 'active') });
      dispatch({ type: ActionTypes.INIT_CONTESTANTS, payload: allCandidates });

      const stats = {
        totalUsers: state.users?.filter(u => !u.isAdmin).length || 0,
        approvedUsers: state.users?.filter(u => !u.isAdmin && u.accountStatus === 'approved').length || 0,
        pendingUsers: state.users?.filter(u => !u.isAdmin && u.accountStatus === 'pending').length || 0,
        suspendedUsers: state.users?.filter(u => !u.isAdmin && u.accountStatus === 'suspended').length || 0,
        totalContests: mappedContests.length,
        activeContests: mappedContests.filter(c => c.status === 'active').length,
        totalVotes: mappedContests.reduce((sum, c) => sum + (c.totalVotes || 0), 0),
        totalRequests: 0,
        pendingRequests: 0,
        unreadNotifications: 0,
      };
      dispatch({ type: ActionTypes.INIT_STATS, payload: stats });
      return true;
    } catch (error) {
      return false;
    }
  };

  const syncCurrentUserFromServer = async (user) => {
    if (!user?.id) return user;
    try {
      const serverUser = await fetchVoterById(user.id);
      const merged = {
        ...user,
        ...serverUser,
      };
      if (!isSameUserData(user, merged)) {
        dispatch({ type: ActionTypes.LOGIN, payload: merged });
      }
      return merged;
    } catch (error) {
      return user;
    }
  };

  useEffect(() => {
    // Initialize users and session
    const users = getUsers();
    dispatch({ type: ActionTypes.INIT, payload: { users, user: null, initialized: false } });

    const initializeData = async () => {
      try {
        let user = null;

      const hydrateSessionUser = async (sessionId, mustBeAdmin) => {
        try {
          const serverUser = await fetchVoterById(Number(sessionId));
          if (!serverUser) return null;
          if (!!serverUser.isAdmin !== mustBeAdmin) return null;
          if (serverUser.accountStatus === 'suspended') return null;
          return serverUser;
        } catch (_) {
          return null;
        }
      };

        const userSessionId = sessionStorage.getItem(USER_SESSION_KEY);
        if (userSessionId) {
          user = await hydrateSessionUser(userSessionId, false);
          if (!user) {
            sessionStorage.removeItem(USER_SESSION_KEY);
          }
        }

        if (!user) {
          const adminSessionId = sessionStorage.getItem(ADMIN_SESSION_KEY);
          if (adminSessionId) {
            user = await hydrateSessionUser(adminSessionId, true);
            if (!user) {
              sessionStorage.removeItem(ADMIN_SESSION_KEY);
            }
          }
        }

        if (user) {
          dispatch({ type: ActionTypes.LOGIN, payload: user });
        }

        // Load settings
        const settings = getSettings();
        dispatch({ type: ActionTypes.INIT_SETTINGS, payload: settings });

        const serverLoaded = await syncServerElectionData();
        if (!serverLoaded) {
          const contests = getContests();
          dispatch({ type: ActionTypes.INIT_CONTESTS, payload: contests });

          const activeContests = getActiveContests();
          dispatch({ type: ActionTypes.INIT_ACTIVE_CONTESTS, payload: activeContests });

          const contestants = getContestants();
          dispatch({ type: ActionTypes.INIT_CONTESTANTS, payload: contestants });

          const stats = getSystemStats();
          dispatch({ type: ActionTypes.INIT_STATS, payload: stats });
        }

        // Load notifications for logged-in user
        if (user) {
          await syncCurrentUserFromServer(user);
          const notifications = getNotificationsByUserId(user.id);
          dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });

          const requests = getRequestsByUserId(user.id);
          dispatch({ type: ActionTypes.INIT_REQUESTS, payload: requests });
        }
      } finally {
        dispatch({ type: ActionTypes.SET_INITIALIZED, payload: true });
      }
    };

    initializeData();

    // Refresh data every minute
    const interval = setInterval(async () => {
      await syncServerElectionData();

      const activeSessionId = sessionStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(ADMIN_SESSION_KEY);
      if (!activeSessionId) return;

      const numericUserId = Number(activeSessionId);
      await syncCurrentUserFromServer({ id: numericUserId });
      const notifications = getNotificationsByUserId(numericUserId);
      dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginVoterApi({ email, password });
      const found = response?.user;
      if (!found?.id) {
        return { success: false, error: 'Invalid email or password' };
      }

      // Check account status
      if (found.accountStatus === 'suspended') {
        return { success: false, error: 'Your account has been suspended. Please contact admin.' };
      }

      // Update last login timestamp
      const loginUpdates = { lastLogin: new Date().toISOString() };
      const updatedUser = { ...found, ...loginUpdates };
      
      // Save session with appropriate key based on user type
      const sessionKey = found.isAdmin ? ADMIN_SESSION_KEY : USER_SESSION_KEY;
      sessionStorage.setItem(sessionKey, String(found.id));
      dispatch({ type: ActionTypes.LOGIN, payload: updatedUser });
      
      // Load user notifications and requests
      const notifications = getNotificationsByUserId(found.id);
      dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });
      
      const requests = getRequestsByUserId(found.id);
      dispatch({ type: ActionTypes.INIT_REQUESTS, payload: requests });

      addActivityLog({ type: 'login', userId: found.id, action: 'User logged in' });
      
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error?.message || 'Login failed. Please try again.' };
    }
  };

  const logout = () => {
    if (state.user) {
      addActivityLog({ type: 'logout', userId: state.user.id, action: 'User logged out' });
    }
    // Clear both session types
    sessionStorage.removeItem(USER_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    dispatch({ type: ActionTypes.LOGOUT });
    dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: [] });
    dispatch({ type: ActionTypes.INIT_REQUESTS, payload: [] });
  };

  const register = async ({ name, email, phoneNumber, password, role = 'user', profilePicture = null }) => {
    try {
      const newUser = await registerVoterApi({
        name,
        email,
        phoneNumber,
        password,
        role,
        profilePicture,
      });
      if (!newUser?.id) {
        return { success: false, error: 'Registration failed. Please try again.' };
      }

      const isAdmin = !!newUser.isAdmin;

      const users = getUsers();
      const mergedUsers = users.some(u => String(u.id) === String(newUser.id))
        ? users.map(u => (String(u.id) === String(newUser.id) ? { ...u, ...newUser } : u))
        : [...users, newUser];
      setUsers(mergedUsers);

      addNotification({
        userId: 'all', // Admin notification
        type: 'user_registration',
        title: isAdmin ? 'New Admin Registration Request' : 'New User Registration',
        message: `${newUser.name} (${newUser.email}) has registered and is pending approval.`,
        link: '/admin/users'
      });

      if (isAdmin && newUser.accountStatus !== 'approved') {
        dispatch({ type: ActionTypes.INIT_USERS, payload: mergedUsers });
        return { success: true, user: newUser, pendingApproval: true };
      }

      // Auto-login after registration
      const sessionKey = newUser.isAdmin ? ADMIN_SESSION_KEY : USER_SESSION_KEY;
      sessionStorage.setItem(sessionKey, String(newUser.id));
      dispatch({ type: ActionTypes.REGISTER, payload: { users: mergedUsers, user: newUser } });

      // If approved, load notifications
      if (newUser.accountStatus === 'approved') {
        const notifications = getNotificationsByUserId(newUser.id);
        dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });
      }

      addActivityLog({ type: 'register', userId: newUser.id, action: 'User registered' });

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error?.message || 'Registration failed. Please try again.' };
    }
  };

  const updateProfile = async (updates) => {
    const current = state.user;
    if (!current) return { success: false, error: 'No user logged in' };

    try {
      const persisted = await updateVoterProfileApi({ id: current.id, ...updates });
      const updated = updateUser(current.id, persisted || updates);
      const users = getUsers();
      
      dispatch({ type: ActionTypes.UPDATE_PROFILE, payload: { users, user: updated } });
      addActivityLog({ type: 'profile_update', userId: current.id, action: 'Profile updated' });

      // Badge: profile completed (only once)
      const settings = getSettings();
      const hasAllProfileFields = Boolean(updated.name && updated.email && updated.phoneNumber);
      if (settings.badgeEnabled !== false && hasAllProfileFields && !hasBadge(current.id, 'profile_complete')) {
        awardBadge(current.id, 'profile_complete', { phone: updated.phoneNumber });
      }
      
      return { success: true, user: updated };
    } catch (error) {
      return { success: false, error: 'Failed to update profile' };
    }
  };

  const voteForContestant = async (contestId, contestantId, confidenceScore = null) => {
    if (!state.user) {
      return { success: false, error: 'You must be logged in to vote' };
    }

    // Check account status
    if (state.user.accountStatus === 'suspended') {
      return { success: false, error: 'Your account has been suspended. Please contact admin.' };
    }

    // Check if voting is enabled
    const settings = getSettings();
    if (!settings.votingEnabled) {
      return { success: false, error: 'Voting is currently disabled' };
    }

    // Check global voting window
    const windowStatus = getVotingWindowStatus();
    if (windowStatus.status !== 'open') {
      const ms = windowStatus.ms || 0;
      const minutes = Math.max(1, Math.round(ms / 60000));
      const waitMessage = windowStatus.status === 'upcoming' ? `Voting starts in ~${minutes} min` : 'Voting is closed';
      return { success: false, error: waitMessage, windowStatus };
    }

    const userVotesBefore = getUserVotes();
    const previousVotes = userVotesBefore[String(state.user.id)]?.length || 0;

    let result = null;

    try {
      const apiResult = await castVoteApi({
        candidateId: contestantId,
        userId: state.user.id,
        confidenceScore,
        algorithm: 'plurality',
      });
      const generatedVoteId = `API-${Date.now()}-${contestId}-${contestantId}`;
      result = { success: true, voteId: generatedVoteId, payload: apiResult };
    } catch (error) {
      result = castVote(state.user.id, contestId, contestantId, confidenceScore);
    }

    if (result.success) {
      // Refresh data
      const synced = await syncServerElectionData();
      if (!synced) {
        const activeContests = getActiveContests();
        dispatch({ type: ActionTypes.INIT_ACTIVE_CONTESTS, payload: activeContests });

        const contestants = getContestants();
        dispatch({ type: ActionTypes.INIT_CONTESTANTS, payload: contestants });

        const stats = getSystemStats();
        dispatch({ type: ActionTypes.INIT_STATS, payload: stats });
      }

      // Update contest
      const updatedContest = getContestById(contestId);
      if (updatedContest) {
        dispatch({ type: ActionTypes.UPDATE_CONTEST, payload: updatedContest });
      }

      // Update contestant
      const updatedContestant = getContestantById(contestantId);
      if (updatedContestant) {
        dispatch({ type: ActionTypes.UPDATE_CONTESTANT, payload: updatedContestant });
      }

      // Create notification
      addNotification({
        userId: state.user.id,
        type: 'vote_confirmation',
        title: 'Vote Cast Successfully',
        message: `Your vote has been recorded. Vote ID: ${result.voteId}`,
        link: `/user/profile`
      });

      // Reload notifications
      const notifications = getNotificationsByUserId(state.user.id);
      dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });

      const refreshedUser = await syncCurrentUserFromServer(state.user);
      if (!refreshedUser?.hasVoted?.includes(contestId)) {
        const mergedUser = {
          ...state.user,
          hasVoted: [...new Set([...(state.user?.hasVoted || []), contestId])],
        };
        dispatch({ type: ActionTypes.LOGIN, payload: mergedUser });
      }

      addActivityLog({
        type: 'vote',
        userId: state.user.id,
        contestId: contestId,
        contestantId: contestantId,
        confidenceScore,
        action: 'Vote cast'
      });

      // Badge awarding (first vote, early voter)
      if (settings.badgeEnabled !== false) {
        if (previousVotes === 0) {
          awardBadge(state.user.id, 'first_vote', { contestId });
        }
        const { start } = getVotingWindow();
        if (start && settings.earlyVoterMinutes) {
          const diffMs = Date.now() - start.getTime();
          if (diffMs >= 0 && diffMs <= Number(settings.earlyVoterMinutes) * 60000) {
            awardBadge(state.user.id, 'early_voter', { contestId, windowStart: start.toISOString() });
          }
        }
      }

      return { success: true, message: 'Vote cast successfully!', voteId: result.voteId };
    }

    return result;
  };

  const hasVotedInContest = (contestId) => {
    if (!state.user) return false;
    if (Array.isArray(state.user.hasVoted)) {
      return state.user.hasVoted.some(id => Number(id) === Number(contestId));
    }
    return hasUserVotedInContest(state.user.id, contestId);
  };

  const submitRequest = async (requestType, data) => {
    if (!state.user) {
      return { success: false, error: 'You must be logged in to submit requests' };
    }

    try {
      const newRequest = addRequest({
        userId: state.user.id,
        requestType: requestType, // 'vote_reset', 'username_change', etc.
        data: data,
        status: 'pending'
      });

      dispatch({ type: ActionTypes.ADD_REQUEST, payload: newRequest });

      // Notify admin
      addNotification({
        userId: 'all',
        type: 'new_request',
        title: 'New User Request',
        message: `${state.user.name} submitted a ${requestType.replace('_', ' ')} request`,
        link: '/admin/requests'
      });

      // Reload user requests
      const requests = getRequestsByUserId(state.user.id);
      dispatch({ type: ActionTypes.INIT_REQUESTS, payload: requests });

      addActivityLog({
        type: 'request_submitted',
        userId: state.user.id,
        requestType: requestType,
        action: 'Request submitted'
      });

      return { success: true, request: newRequest };
    } catch (error) {
      return { success: false, error: 'Failed to submit request' };
    }
  };

  const markNotificationRead = (notificationId) => {
    markNotificationAsRead(notificationId);
    const notifications = state.notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    dispatch({ type: ActionTypes.MARK_NOTIFICATION_READ, payload: notificationId });
  };

  const markAllNotificationsRead = () => {
    if (!state.user) return;
    markAllNotificationsAsRead(state.user.id);
    const notifications = state.notifications.map(n => ({ ...n, read: true }));
    dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });
  };

  const refreshData = async ({ syncUser = false } = {}) => {
    const settings = getSettings();
    dispatch({ type: ActionTypes.INIT_SETTINGS, payload: settings });

    const synced = await syncServerElectionData();
    if (!synced) {
      const contests = getContests();
      const activeContests = getActiveContests();
      const contestants = getContestants();
      const stats = getSystemStats();

      dispatch({ type: ActionTypes.INIT_CONTESTS, payload: contests });
      dispatch({ type: ActionTypes.INIT_ACTIVE_CONTESTS, payload: activeContests });
      dispatch({ type: ActionTypes.INIT_CONTESTANTS, payload: contestants });
      dispatch({ type: ActionTypes.INIT_STATS, payload: stats });
    }

    if (state.user) {
      if (syncUser) {
        await syncCurrentUserFromServer(state.user);
      }
      const notifications = getNotificationsByUserId(state.user.id);
      dispatch({ type: ActionTypes.INIT_NOTIFICATIONS, payload: notifications });

      const requests = getRequestsByUserId(state.user.id);
      dispatch({ type: ActionTypes.INIT_REQUESTS, payload: requests });
    }
  };

  const value = {
    ...state,
    login,
    logout,
    register,
    updateProfile,
    voteForContestant,
    hasVotedInContest,
    submitRequest,
    markNotificationRead,
    markAllNotificationsRead,
    refreshData,
    // Helper functions
    getContestById,
    getContestantsByContestId,
    getContestResults,
    getVotesByContestId,
    resetUserVote: (contestId) => {
      if (!state.user) return { success: false };
      const result = resetUserVote(state.user.id, contestId);
      if (result.success) {
        refreshData();
      }
      return result;
    }
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export { AppContext };
