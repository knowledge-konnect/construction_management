import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import QuotationBuilder from '@/components/quotation/QuotationBuilder';
import RequireCompany from '@/components/RequireCompany';
import ToastViewport from '@/components/ToastViewport';
import { AuthProvider } from '@/context/AuthContext';
import { CompanyProvider } from '@/context/CompanyContext';
import { ToastProvider } from '@/context/ToastContext';
import CompanySetupPage from '@/pages/CompanySetupPage';
import DashboardPage from '@/pages/DashboardPage';
import FlatBillingEditor from '@/pages/FlatBillingEditor';
import FlatBillingPage from '@/pages/FlatBillingPage';
import LoginPage from '@/pages/LoginPage';
import QuotationsPage from '@/pages/QuotationsPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import SettingsPage from '@/pages/SettingsPage';
import TemplatesPage from '@/pages/TemplatesPage';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

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
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <ToastViewport />
          </BrowserRouter>
        </CompanyProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
