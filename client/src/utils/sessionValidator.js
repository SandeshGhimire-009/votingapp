/**
 * Session Validator Utility
 * Validates user sessions and ensures only valid users can access protected routes
 */

const USER_SESSION_KEY = 'session-user-id';
const ADMIN_SESSION_KEY = 'session-admin-id';

/**
 * Check if current user session is valid
 * Valid session = user exists, is not admin, and not suspended
 */
export function isValidUserSession(user) {
  if (!user) return false;
  
  // User must not be admin (admin use separate portal)
  if (user.isAdmin) return false;
  
  // User account cannot be suspended
  if (user.accountStatus === 'suspended') return false;
  
  return true;
}

/**
 * Check if current admin session is valid
 * Valid session = user exists, is admin, and not suspended
 */
export function isValidAdminSession(user) {
  if (!user) return false;
  
  // Must be admin
  if (!user.isAdmin) return false;
  
  // User account cannot be suspended
  if (user.accountStatus === 'suspended') return false;
  
  return true;
}

/**
 * Get current valid user from session
 * Returns null if session is invalid
 * Checks both user and admin sessions
 */
export function getCurrentUser() {
  if (typeof window === 'undefined') return null;
  
  // Import here to avoid circular dependency
  const { getUserById } = require('./storage');
  
  // Check user session first
  const userSessionId = sessionStorage.getItem(USER_SESSION_KEY);
  if (userSessionId) {
    const user = getUserById(parseInt(userSessionId));
    if (isValidUserSession(user)) {
      return user;
    } else {
      // Clear invalid user session
      sessionStorage.removeItem(USER_SESSION_KEY);
    }
  }
  
  // Check admin session
  const adminSessionId = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (adminSessionId) {
    const admin = getUserById(parseInt(adminSessionId));
    if (isValidAdminSession(admin)) {
      return admin;
    } else {
      // Clear invalid admin session
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  }
  
  return null;
}

/**
 * Save user session
 * Determines whether to save as user or admin based on user object
 */
export function saveUserSession(userId, isAdmin = false) {
  const sessionKey = isAdmin ? ADMIN_SESSION_KEY : USER_SESSION_KEY;
  sessionStorage.setItem(sessionKey, String(userId));
}

/**
 * Clear user session
 * Clears both user and admin sessions
 */
export function clearSession() {
  sessionStorage.removeItem(USER_SESSION_KEY);
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

/**
 * Get session keys for external use
 */
export function getSessionKeys() {
  return { userKey: USER_SESSION_KEY, adminKey: ADMIN_SESSION_KEY };
}

/**
 * Get session key for external use (legacy support)
 */
export function getSessionKey() {
  return USER_SESSION_KEY;
}
