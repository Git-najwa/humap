export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
  },
  ACTIVITIES: {
    LIST: '/activities',
    DETAIL: (id) => `/activities/${id}`,
    CREATE: '/activities',
    UPDATE: (id) => `/activities/${id}`,
    DELETE: (id) => `/activities/${id}`,
  },
  REVIEWS: {
    BY_ACTIVITY: (id) => `/reviews/activity/${id}`,
    CREATE: '/reviews',
    UPDATE: (id) => `/reviews/${id}`,
    DELETE: (id) => `/reviews/${id}`,
  },
  LISTS: {
    LIST: '/lists',
    DETAIL: (id) => `/lists/${id}`,
    CREATE: '/lists',
    UPDATE: (id) => `/lists/${id}`,
    DELETE: (id) => `/lists/${id}`,
    ADD_ACTIVITY: (listId) => `/lists/${listId}/activities`,
    REMOVE_ACTIVITY: (listId, activityId) => `/lists/${listId}/activities/${activityId}`,
  },
}
