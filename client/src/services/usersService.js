import api from './api';

export const usersService = {
  // Users (admin only)
  list:           (role)        => api.get(role ? `/users?role=${role}` : '/users'),
  get:            (id)          => api.get(`/users/${id}`),
  create:         (payload)     => api.post('/users', payload),
  changeRole:     (id, role)    => api.patch(`/users/${id}/change-role`, { role }),
  deactivate:     (id)          => api.patch(`/users/${id}/deactivate`),
  activate:       (id)          => api.patch(`/users/${id}/activate`),
  resetPassword:  (id)          => api.patch(`/users/${id}/reset-password`),
  remove:         (id)          => api.delete(`/users/${id}`),
};

export const employeesService = {
  list: ()    => api.get('/employees'),
  get:  (id)  => api.get(`/employees/${id}`),
};

export default usersService;
