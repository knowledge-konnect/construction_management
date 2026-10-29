import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuotationBuilder from '@/components/quotation/QuotationBuilder';
import RequireCompany from '@/components/RequireCompany';
import ToastViewport from '@/components/ToastViewport';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { ToastProvider } from '@/context/ToastContext';
import BillingPage from '@/pages/BillingPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import CompanySetupPage from '@/pages/CompanySetupPage';
import CustomersPage from '@/pages/CustomersPage';
import DashboardPage from '@/pages/DashboardPage';
import ExpensesPage from '@/pages/ExpensesPage';
import FlatBillingEditor from '@/pages/FlatBillingEditor';
import FlatBillingPage from '@/pages/FlatBillingPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ProjectsPage, { ProjectDetailPage } from '@/pages/ProjectsPage';
import QuotationsPage from '@/pages/QuotationsPage';
import ReportsPage from '@/pages/ReportsPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SettingsPage from '@/pages/SettingsPage';
import TeamPage from '@/pages/TeamPage';
import TemplatesPage from '@/pages/TemplatesPage';
import { getSafeRedirectPath } from '@/lib/utils';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// Shown at "/" — the public landing page for logged-out visitors.
// Signed-in users are sent straight to their dashboard instead.
function PublicHome() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;
  if (user) return <Navigate to={getSafeRedirectPath(location, '/dashboard')} replace />;
  return <LandingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CompanyProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/company-setup"
                element={
                  <ProtectedRoute>
                    <CompanySetupPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePasswordPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <DashboardPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ProjectsPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ProjectDetailPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <QuotationsPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations/new"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <QuotationBuilder />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/quotations/:id/edit"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <QuotationBuilder />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/customers"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <CustomersPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/expenses"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ExpensesPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/billing"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <BillingPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-receipts"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <FlatBillingPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ReportsPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/flat-billing"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <FlatBillingPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/flat-billing/new"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <FlatBillingEditor />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/flat-billing/:id/edit"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <FlatBillingEditor />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/templates"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <TemplatesPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <SettingsPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/team"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <TeamPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route path="/" element={<PublicHome />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastViewport />
          </BrowserRouter>
        </CompanyProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
