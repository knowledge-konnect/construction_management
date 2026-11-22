import Layout from '@/components/Layout';
import { AppLoader } from '@/components/loading/Loaders';
import ProtectedRoute from '@/components/ProtectedRoute';
import RequireCompany from '@/components/RequireCompany';
import ToastViewport from '@/components/ToastViewport';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { ToastProvider } from '@/context/ToastContext';
import { getSafeRedirectPath } from '@/lib/utils';
import ChangePasswordPage from '@/pages/ChangePasswordPage';
import CompanySetupPage from '@/pages/CompanySetupPage';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const AccessManagementPage = lazy(() => import('@/pages/AccessManagementPage'));
const BillingPage = lazy(() => import('@/pages/BillingPage'));
const ComponentShowcasePage = lazy(() => import('@/pages/ComponentShowcasePage'));
const CustomersPage = lazy(() => import('@/pages/CustomersPage'));
const ExpensesPage = lazy(() => import('@/pages/ExpensesPage'));
const ExternalDashboardPage = lazy(() => import('@/pages/ExternalDashboardPage'));
const FlatBillingEditor = lazy(() => import('@/pages/FlatBillingEditor'));
const FlatBillingPage = lazy(() => import('@/pages/FlatBillingPage'));
const InvestorsPage = lazy(() => import('@/pages/InvestorsPage'));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage'));
const PartiesPage = lazy(() => import('@/pages/PartiesPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('@/pages/ProjectsPage').then((module) => ({ default: module.ProjectDetailPage })));
const ProjectCreatePage = lazy(() => import('@/pages/ProjectsPage').then((module) => ({ default: module.ProjectCreatePage })));
const ProjectEditPage = lazy(() => import('@/pages/ProjectsPage').then((module) => ({ default: module.ProjectEditPage })));
const QuotationBuilder = lazy(() => import('@/components/quotation/QuotationBuilder'));
const QuotationsPage = lazy(() => import('@/pages/QuotationsPage'));
const ReceiptsPage = lazy(() => import('@/pages/ReceiptsPage'));
const ReportsPage = lazy(() => import('@/pages/ReportsPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const SuppliersPage = lazy(() => import('@/pages/SuppliersPage'));
const TeamPage = lazy(() => import('@/pages/TeamPage'));
const TemplatesPage = lazy(() => import('@/pages/TemplatesPage'));

function withRouteLoader(node: ReactNode) {
  return (
    <Suspense fallback={<AppLoader message="Loading page…" />}>
      {node}
    </Suspense>
  );
}

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
                        {withRouteLoader(<DashboardPage />)}
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {withRouteLoader(<ProfilePage />)}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/client-dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {withRouteLoader(<ExternalDashboardPage mode="client" />)}
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/investor-dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      {withRouteLoader(<ExternalDashboardPage mode="investor" />)}
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
                        {withRouteLoader(<ProjectsPage />)}
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
                        {withRouteLoader(<ProjectDetailPage />)}
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
                        {withRouteLoader(<ProjectCreatePage />)}
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
                        {withRouteLoader(<ProjectEditPage />)}
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
                        {withRouteLoader(<AccessManagementPage />)}
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
                        {withRouteLoader(<QuotationsPage />)}
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
                        {withRouteLoader(<QuotationBuilder />)}
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
                        {withRouteLoader(<QuotationBuilder />)}
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
                        {withRouteLoader(<PartiesPage />)}
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
                        {withRouteLoader(<CustomersPage />)}
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
                        {withRouteLoader(<SuppliersPage />)}
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
                        {withRouteLoader(<InvestorsPage />)}
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
                        {withRouteLoader(<ExpensesPage />)}
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
                        {withRouteLoader(<BillingPage />)}
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
                        {withRouteLoader(<InvoicesPage />)}
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
                        {withRouteLoader(<ReceiptsPage />)}
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
                        {withRouteLoader(<FlatBillingPage />)}
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
                        {withRouteLoader(<ReportsPage />)}
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
                        {withRouteLoader(<FlatBillingPage />)}
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
                        {withRouteLoader(<FlatBillingEditor />)}
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
                        {withRouteLoader(<FlatBillingEditor />)}
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
                        {withRouteLoader(<TemplatesPage />)}
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
                        {withRouteLoader(<SettingsPage />)}
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
                        {withRouteLoader(<TeamPage />)}
                      </Layout>
                    </RequireCompany>
                  </ProtectedRoute>
                }
              />
              <Route path="/component-showcase" element={withRouteLoader(<ComponentShowcasePage />)} />
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
