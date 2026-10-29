import { useAuth } from '@/context/AuthContext';
import { useCompany } from '@/context/CompanyContext';
<<<<<<< HEAD
import { Navigate, useLocation } from 'react-router-dom';
=======
import { Navigate } from 'react-router-dom';
>>>>>>> origin/main

export default function RequireCompany({ children }: { children: JSX.Element }) {
    const { user, loading } = useAuth();
    const { company, loading: companyLoading } = useCompany();
<<<<<<< HEAD
    const location = useLocation();
=======
>>>>>>> origin/main

    if (loading || companyLoading) {
        return <div className="py-20 text-center text-slate-500">Loading company details…</div>;
    }

    if (!user) {
<<<<<<< HEAD
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!company) {
        return <Navigate to="/company-setup" replace state={{ from: location }} />;
=======
        return <Navigate to="/login" replace />;
    }

    if (!company) {
        return <Navigate to="/company-setup" replace />;
>>>>>>> origin/main
    }

    return children;
}
