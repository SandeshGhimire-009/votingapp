// Navigation helpers and utilities for user dashboard
import { useNavigate } from 'react-router-dom';

export const useUserNavigation = () => {
  const navigate = useNavigate();

  const navigationRoutes = {
    dashboard: '/user/dashboard',
    vote: (id = 1) => `/user/vote/${id}`,
    profile: '/user/profile',
    requests: '/user/requests',
    results: (id = '') => `/user/results${id ? '/' + id : ''}`,
    notifications: '/user/notifications',
    history: '/user/history',
    activity: '/user/activity',
    login: '/',
  };

  const navTo = (route, params = null) => {
    if (typeof route === 'function') {
      navigate(route(params));
    } else {
      navigate(route);
    }
  };

  const goToDashboard = () => navTo(navigationRoutes.dashboard);
  const goToVote = (id) => navTo(navigationRoutes.vote, id);
  const goToProfile = () => navTo(navigationRoutes.profile);
  const goToRequests = () => navTo(navigationRoutes.requests);
  const goToResults = (id) => navTo(navigationRoutes.results, id);
  const goToNotifications = () => navTo(navigationRoutes.notifications);
  const goToHistory = () => navTo(navigationRoutes.history);
  const goToActivity = () => navTo(navigationRoutes.activity);
  const goToLogin = () => navTo(navigationRoutes.login);

  return {
    navigate,
    navigationRoutes,
    navTo,
    goToDashboard,
    goToVote,
    goToProfile,
    goToRequests,
    goToResults,
    goToNotifications,
    goToHistory,
    goToActivity,
    goToLogin,
  };
};

export default useUserNavigation;
