import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
import { Navigate } from 'react-router-dom';

export default function RequireCompany({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    const { company, loading: companyLoading } = useCompany();

    if (loading || companyLoading) {
        return <div className="py-20 text-center text-slate-500">Loading company details…</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!company) {
        return <Navigate to="/company-setup" replace />;
    }

    return children;
}
