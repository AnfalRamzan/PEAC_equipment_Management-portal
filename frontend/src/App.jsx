import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Layout
import MainLayout from './components/Layout/MainLayout'
import ProtectedRoute from './components/Auth/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Hospitals from './pages/Hospitals'
import Equipment from './pages/Equipment'
import ErrorLogs from './pages/ErrorLogs'
import Repairs from './pages/Repairs'
import SpareParts from './pages/SpareParts'
import KnowledgeBase from './pages/KnowledgeBase'
import Maintenance from './pages/Maintenance'
import Reports from './pages/Reports'
import AMC from './pages/AMC'
import PurchaseOrders from './pages/PurchaseOrders'
import Procurement from './pages/Procurement'
import ServiceDocumentation from './pages/ServiceDocumentation'
import Users from './pages/Users'
import Notifications from './pages/Notifications'
import Profile from './pages/Profile'

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="hospitals" element={<Hospitals />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="errors" element={<ErrorLogs />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="spare-parts" element={<SpareParts />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="reports" element={<Reports />} />
          <Route path="amc" element={<AMC />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="service-documentation" element={<ServiceDocumentation />} />
          <Route path="users" element={<Users />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App