import Layout from '@/components/Layout';
import { AppLoader } from '@/components/loading/Loaders';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuotationBuilder from '@/components/quotation/QuotationBuilder';
import RequireCompany from '@/components/RequireCompany';
import ToastViewport from '@/components/ToastViewport';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { ToastProvider } from '@/context/ToastContext';
import { getSafeRedirectPath } from '@/lib/utils';
import AccessManagementPage from '@/pages/AccessManagementPage';
import BillingPage from '@/pages/BillingPage';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import CompanySetupPage from '@/pages/CompanySetupPage';
import ComponentShowcasePage from '@/pages/ComponentShowcasePage';
import CustomersPage from '@/pages/CustomersPage';
import DashboardPage from '@/pages/DashboardPage';
import ExpensesPage from '@/pages/ExpensesPage';
import ExternalDashboardPage from '@/pages/ExternalDashboardPage';
import FlatBillingEditor from '@/pages/FlatBillingEditor';
import FlatBillingPage from '@/pages/FlatBillingPage';
import InvestorsPage from '@/pages/InvestorsPage';
import InvoicesPage from '@/pages/InvoicesPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import PartiesPage from '@/pages/PartiesPage';
import ProjectsPage, { ProjectCreatePage, ProjectDetailPage, ProjectEditPage } from '@/pages/ProjectsPage';
import QuotationsPage from '@/pages/QuotationsPage';
import ReceiptsPage from '@/pages/ReceiptsPage';
import ReportsPage from '@/pages/ReportsPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SettingsPage from '@/pages/SettingsPage';
import SuppliersPage from '@/pages/SuppliersPage';
import TeamPage from '@/pages/TeamPage';
import TemplatesPage from '@/pages/TemplatesPage';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// Shown at "/" — the public landing page for logged-out visitors.
// Signed-in users are sent straight to their dashboard instead.
function PublicHome() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AppLoader message="Verifying your sign-in and preparing your workspace…" />;
  if (user) {
    if (user.role === 'client') return <Navigate to={getSafeRedirectPath(location, '/client-dashboard')} replace />;
    if (user.role === 'investor') return <Navigate to={getSafeRedirectPath(location, '/investor-dashboard')} replace />;
    return <Navigate to={getSafeRedirectPath(location, '/dashboard')} replace />;
  }
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
                path="/client-dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ExternalDashboardPage mode="client" />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor-dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ExternalDashboardPage mode="investor" />
                    </Layout>
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
                path="/projects/new"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ProjectCreatePage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/projects/:id/edit"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ProjectEditPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/access-management"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <AccessManagementPage />
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
                path="/parties"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <PartiesPage />
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
                path="/suppliers"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <SuppliersPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investors"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <InvestorsPage />
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
                path="/invoices"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <InvoicesPage />
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/receipts"
                element={
                  <ProtectedRoute>
                    <RequireCompany>
                      <Layout>
                        <ReceiptsPage />
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
              <Route path="/component-showcase" element={<ComponentShowcasePage />} />
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
