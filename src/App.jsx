import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Clients from "./pages/Clients";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Onboarding from "./pages/Onboarding";
import DgiiReport from "./pages/DgiiReport";
import InventoryMovements from "./pages/InventoryMovements";
import Profit from "./pages/Profit";

function PrivateRoute({ children }) {
  const { token, loading, companyConfigured, checkingCompany } = useAuth();
  if (loading || checkingCompany) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (!companyConfigured) return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardingRoute({ children }) {
  const { token, loading, companyConfigured, checkingCompany } = useAuth();
  if (loading || checkingCompany) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (companyConfigured) return <Navigate to="/dashboard" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? <Navigate to="/dashboard" replace /> : children;
}

function AdminRoute({ children }) {
  const { token, loading, user } = useAuth();
  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "500",
              boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
            },
            success: {
              style: {
                background: "#ecfdf5",
                color: "#065f46",
                border: "1px solid #a7f3d0",
              },
            },
            error: {
              style: {
                background: "#fef2f2",
                color: "#991b1b",
                border: "1px solid #fecaca",
              },
            },
          }}
        />
        <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/products"
            element={
              <PrivateRoute>
                <Products />
              </PrivateRoute>
            }
          />
          <Route
            path="/sales"
            element={
              <PrivateRoute>
                <Sales />
              </PrivateRoute>
            }
          />
          <Route
            path="/clients"
            element={
              <PrivateRoute>
                <Clients />
              </PrivateRoute>
            }
          />
          <Route
            path="/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            }
          />
          <Route
            path="/suppliers"
            element={
              <PrivateRoute>
                <Suppliers />
              </PrivateRoute>
            }
          />
          <Route
            path="/purchases"
            element={
              <PrivateRoute>
                <Purchases />
              </PrivateRoute>
            }
          />
          <Route
            path="/kardex"
            element={
              <PrivateRoute>
                <InventoryMovements />
              </PrivateRoute>
            }
          />
          <Route
            path="/dgii"
            element={
              <AdminRoute>
                <DgiiReport />
              </AdminRoute>
            }
          />
          <Route
            path="/profit"
            element={
              <PrivateRoute>
                <Profit />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}