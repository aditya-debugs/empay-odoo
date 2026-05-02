import api from '../../services/api';

export const authService = {
  adminExists:   ()      => api.get('/auth/admin-exists'),
  registerAdmin: (data)  => api.post('/auth/register-admin', data),
  login:         (data)  => api.post('/auth/login', data),
  me:            ()      => api.get('/auth/me'),
  logout:        ()      => api.post('/auth/logout'),
};

export default authService;
