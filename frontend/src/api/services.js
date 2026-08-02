import api from './axios'

// Auth Services
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
}

// User Services
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id) => api.post(`/users/${id}/reset-password`)
}

// Role Services
export const roleService = {
  getAll: () => api.get('/users/roles')
}

// Hospital Services
export const hospitalService = {
  getAll: () => api.get('/hospitals'),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (data) => api.post('/hospitals', data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  delete: (id) => api.delete(`/hospitals/${id}`),
  getEngineers: (id) => api.get(`/hospitals/${id}/engineers`)
}

// Equipment Services
export const equipmentService = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  getCategories: () => api.get('/equipment/categories/all')
}

// Error Log Services
export const errorService = {
  getAll: (params) => api.get('/errors', { params }),
  getById: (id) => api.get(`/errors/${id}`),
  create: (data) => api.post('/errors', data),
  update: (id, data) => api.put(`/errors/${id}`, data),
  updateStatus: (id, status) => api.patch(`/errors/${id}/status`, { status }),
  delete: (id) => api.delete(`/errors/${id}`)
}

// Repair Services
export const repairService = {
  getAll: (params) => api.get('/repairs', { params }),
  getById: (id) => api.get(`/repairs/${id}`),
  create: (data) => api.post('/repairs', data),
  update: (id, data) => api.put(`/repairs/${id}`, data),
  delete: (id) => api.delete(`/repairs/${id}`)
}

// Spare Parts Services
export const sparePartService = {
  getAll: (params) => api.get('/spare-parts', { params }),
  getById: (id) => api.get(`/spare-parts/${id}`),
  create: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  delete: (id) => api.delete(`/spare-parts/${id}`)
}

// Maintenance Services
export const maintenanceService = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`)
}

// Knowledge Base Services
export const knowledgeBaseService = {
  getAll: (params) => api.get('/knowledge-base', { params }),
  getById: (id) => api.get(`/knowledge-base/${id}`),
  getByEquipment: (equipmentId) => api.get(`/knowledge-base/equipment/${equipmentId}`),
  create: (data) => api.post('/knowledge-base', data),
  update: (id, data) => api.put(`/knowledge-base/${id}`, data),
  delete: (id) => api.delete(`/knowledge-base/${id}`)
}

// Report Services
export const reportService = {
  generate: (params) => api.get('/reports', { params }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
  exportCSV: (params) => api.get('/reports/export/csv', { params, responseType: 'blob' })
}

// AMC Services
export const amcService = {
  getAll: (params) => api.get('/amc', { params }),
  getById: (id) => api.get(`/amc/${id}`),
  create: (data) => api.post('/amc', data),
  update: (id, data) => api.put(`/amc/${id}`, data),
  delete: (id) => api.delete(`/amc/${id}`)
}

// Purchase Order Services
export const purchaseOrderService = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`)
}

// Procurement Services
export const procurementService = {
  getAll: (params) => api.get('/procurement', { params }),
  getById: (id) => api.get(`/procurement/${id}`),
  create: (data) => api.post('/procurement', data),
  update: (id, data) => api.put(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`)
}

// Notification Services
export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
}

// Dashboard Services
export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getChartData: (type) => api.get(`/dashboard/charts/${type}`),
  getRecentActivity: () => api.get('/dashboard/recent-activity')
}