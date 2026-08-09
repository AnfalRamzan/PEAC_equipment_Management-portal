import api from './axios'

// ============================================================
// ✅ AUTH SERVICES
// ============================================================
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me')
}

// ============================================================
// ✅ USER SERVICES
// ============================================================
export const userService = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  resetPassword: (id, data) => api.post(`/users/${id}/reset-password`, data),
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.post('/users/change-password', data),
  // ✅ Upload profile picture
  uploadProfilePicture: (formData) => api.post('/users/profile-picture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  // ✅ Delete profile picture
  deleteProfilePicture: () => api.delete('/users/profile-picture'),
}

// ============================================================
// ✅ ROLE SERVICES
// ============================================================
export const roleService = {
  getAll: () => api.get('/users/roles')
}

// ============================================================
// ✅ HOSPITAL SERVICES
// ============================================================
export const hospitalService = {
  getAll: () => api.get('/hospitals'),
  getById: (id) => api.get(`/hospitals/${id}`),
  create: (data) => api.post('/hospitals', data),
  update: (id, data) => api.put(`/hospitals/${id}`, data),
  delete: (id) => api.delete(`/hospitals/${id}`),
  getEngineers: (id) => api.get(`/hospitals/${id}/engineers`)
}

// ============================================================
// ✅ DEPARTMENT SERVICES
// ============================================================
export const departmentService = {
  getAll: () => api.get('/departments'),
  getByHospital: (hospitalId) => api.get(`/departments/hospital/${hospitalId}`),
  create: (data) => api.post('/departments', data),
}

// ============================================================
// ✅ EQUIPMENT SERVICES
// ============================================================
export const equipmentService = {
  getAll: (params) => api.get('/equipment', { params }),
  getById: (id) => api.get(`/equipment/${id}`),
  create: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
  delete: (id) => api.delete(`/equipment/${id}`),
  
  // Equipment Categories
  getCategories: () => api.get('/equipment/categories/all'),
  createCategory: (data) => api.post('/equipment/categories', data),
  updateCategory: (id, data) => api.put(`/equipment/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/equipment/categories/${id}`),
  
  // Departments (Equipment)
  createDepartment: (data) => api.post('/equipment/departments', data),
  getDepartmentsByHospital: (hospitalId) => api.get(`/equipment/departments/hospital/${hospitalId}`),
  
  // Upload equipment images
  uploadImages: (id, data) => api.post(`/equipment/${id}/upload`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// ============================================================
// ✅ ERROR LOG SERVICES
// ============================================================
export const errorService = {
  getAll: (params) => api.get('/errors', { params }),
  getById: (id) => api.get(`/errors/${id}`),
  create: (data) => api.post('/errors', data),
  update: (id, data) => api.put(`/errors/${id}`, data),
  updateStatus: (id, status) => api.patch(`/errors/${id}/status`, { status }),
  delete: (id) => api.delete(`/errors/${id}`),
  uploadFile: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/errors/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  }
}

// ============================================================
// ✅ REPAIR SERVICES
// ============================================================
export const repairService = {
  getAll: (params) => api.get('/repairs', { params }),
  getById: (id) => api.get(`/repairs/${id}`),
  create: (data) => api.post('/repairs', data),
  update: (id, data) => api.put(`/repairs/${id}`, data),
  delete: (id) => api.delete(`/repairs/${id}`),
  complete: (id, data) => api.put(`/repairs/${id}/complete`, data),
  assign: (id, engineerId) => api.put(`/repairs/${id}/assign`, { engineer_id: engineerId })
}

// ============================================================
// ✅ SPARE PARTS SERVICES
// ============================================================
export const sparePartService = {
  getAll: (params) => api.get('/spare-parts', { params }),
  getById: (id) => api.get(`/spare-parts/${id}`),
  create: (data) => api.post('/spare-parts', data),
  update: (id, data) => api.put(`/spare-parts/${id}`, data),
  delete: (id) => api.delete(`/spare-parts/${id}`)
}

// ============================================================
// ✅ MAINTENANCE SERVICES
// ============================================================
export const maintenanceService = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  complete: (id, data) => api.put(`/maintenance/${id}/complete`, data)
}

// ============================================================
// ✅ KNOWLEDGE BASE SERVICES
// ============================================================
export const knowledgeBaseService = {
  getAll: (params) => api.get('/knowledge-base', { params }),
  getById: (id) => api.get(`/knowledge-base/${id}`),
  getByEquipment: (equipmentId) => api.get(`/knowledge-base/equipment/${equipmentId}`),
  create: (data) => api.post('/knowledge-base', data),
  update: (id, data) => api.put(`/knowledge-base/${id}`, data),
  delete: (id) => api.delete(`/knowledge-base/${id}`)
}

// ============================================================
// ✅ REPORT SERVICES
// ============================================================
export const reportService = {
  generate: (params) => api.get('/reports', { params }),
  exportPDF: (params) => api.get('/reports/export/pdf', { params, responseType: 'blob' }),
  exportExcel: (params) => api.get('/reports/export/excel', { params, responseType: 'blob' }),
  exportCSV: (params) => api.get('/reports/export/csv', { params, responseType: 'blob' })
}

// ============================================================
// ✅ AMC SERVICES
// ============================================================
export const amcService = {
  getAll: (params) => api.get('/amc', { params }),
  getById: (id) => api.get(`/amc/${id}`),
  create: (data) => api.post('/amc', data),
  update: (id, data) => api.put(`/amc/${id}`, data),
  delete: (id) => api.delete(`/amc/${id}`),
  renew: (id, data) => api.put(`/amc/${id}/renew`, data)
}

// ============================================================
// ✅ PURCHASE ORDER SERVICES
// ============================================================
export const purchaseOrderService = {
  getAll: (params) => api.get('/purchase-orders', { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post('/purchase-orders', data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  approve: (id) => api.put(`/purchase-orders/${id}/approve`),
  reject: (id) => api.put(`/purchase-orders/${id}/reject`)
}

// ============================================================
// ✅ PROCUREMENT SERVICES
// ============================================================
export const procurementService = {
  getAll: (params) => api.get('/procurement', { params }),
  getById: (id) => api.get(`/procurement/${id}`),
  create: (data) => api.post('/procurement', data),
  update: (id, data) => api.put(`/procurement/${id}`, data),
  delete: (id) => api.delete(`/procurement/${id}`)
}

// ============================================================
// ✅ NOTIFICATION SERVICES
// ============================================================
export const notificationService = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread/count'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
}

// ============================================================
// ✅ DASHBOARD SERVICES
// ============================================================
export const dashboardService = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getChartData: (type) => api.get(`/dashboard/charts/${type}`),
  getRecentActivity: () => api.get('/dashboard/recent-activity')
}

// ============================================================
// ✅ SERVICE DOCUMENTATION SERVICES
// ============================================================
export const serviceDocumentationService = {
  getAll: (params) => api.get('/service-documentation', { params }),
  getById: (id) => api.get(`/service-documentation/${id}`),
  create: (data) => api.post('/service-documentation', data),
  update: (id, data) => api.put(`/service-documentation/${id}`, data),
  delete: (id) => api.delete(`/service-documentation/${id}`),
}

// ============================================================
// ✅ SETTINGS SERVICES
// ============================================================
export const settingsService = {
  getAll: () => api.get('/settings'),
  updateGeneral: (data) => api.put('/settings/general', data),
  updateSecurity: (data) => api.put('/settings/security', data),
  updateEmail: (data) => api.put('/settings/email', data),
  updateNotifications: (data) => api.put('/settings/notifications', data),
  testEmail: (data) => api.post('/settings/test-email', data),
}

// ============================================================
// ✅ EXPORT ALL SERVICES
// ============================================================
export default {
  authService,
  userService,
  roleService,
  hospitalService,
  departmentService,
  equipmentService,
  errorService,
  repairService,
  sparePartService,
  maintenanceService,
  knowledgeBaseService,
  reportService,
  amcService,
  purchaseOrderService,
  procurementService,
  notificationService,
  dashboardService,
  serviceDocumentationService,
  settingsService,
}