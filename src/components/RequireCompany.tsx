import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Navigate, useLocation } from 'react-router-dom';

export default function RequireCompany({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    const { company, loading: companyLoading } = useCompany();
    const location = useLocation();

    if (loading || companyLoading) {
        return <div className="py-20 text-center text-slate-500">Loading company details…</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!company) {
        return <Navigate to="/company-setup" replace state={{ from: location }} />;
    }

    return children;
}
