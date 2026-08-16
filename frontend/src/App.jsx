// src/App.jsx
// ✅ REMOVED: Profile route (page not found)
// ✅ ADDED: Training route
// ✅ REMOVED: Equipment Categories route (since removed from sidebar)
// ✅ REMOVED: Settings route

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
// ❌ Profile REMOVED
import Users from './pages/Users';
import Hospitals from './pages/Hospitals';
import Equipment from './pages/Equipment';
import ErrorLogs from './pages/ErrorLogs';
import Repairs from './pages/Repairs';
import Maintenance from './pages/Maintenance';
import SpareParts from './pages/SpareParts';
import ServiceDocumentation from './pages/ServiceDocumentation';
import KnowledgeBase from './pages/KnowledgeBase';
import AMC from './pages/AMC';
import PurchaseOrders from './pages/PurchaseOrders';
import Procurement from './pages/Procurement';
import Reports from './pages/Reports';
import Training from './pages/Training';
import Notifications from './pages/Notifications';
import MainLayout from './components/Layout/MainLayout';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);
    return isAuthenticated ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                    <PrivateRoute>
                        <MainLayout />
                    </PrivateRoute>
                }>
                    <Route index element={<Navigate to="/dashboard" />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    {/* ❌ profile route REMOVED */}
                    <Route path="users" element={<Users />} />
                    <Route path="hospitals" element={<Hospitals />} />
                    <Route path="equipment" element={<Equipment />} />
                    <Route path="errors" element={<ErrorLogs />} />
                    <Route path="repairs" element={<Repairs />} />
                    <Route path="maintenance" element={<Maintenance />} />
                    <Route path="spare-parts" element={<SpareParts />} />
                    <Route path="service-documentation" element={<ServiceDocumentation />} />
                    <Route path="knowledge-base" element={<KnowledgeBase />} />
                    <Route path="amc" element={<AMC />} />
                    <Route path="purchase-orders" element={<PurchaseOrders />} />
                    <Route path="procurement" element={<Procurement />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="training" element={<Training />} />
                    <Route path="notifications" element={<Notifications />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default App;