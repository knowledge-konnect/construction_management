import { useAuth } from '@/context/AuthContext';
import type { CompanySettings } from '@/lib/models';
import type { CompanyRecord } from '@/services/company.service';
import {
    createCompany as createCompanyService,
    getCompanyByUserId,
    updateCompanySettings as updateCompanySettingsService,
} from '@/services/company.service';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react';

interface CompanyContextValue {
    company: CompanyRecord | null;
    loading: boolean;
    refreshCompany: () => Promise<void>;
    createCompany: (settings: CompanySettings) => Promise<boolean>;
    updateSettings: (settings: CompanySettings) => Promise<boolean>;
}

const CompanyContext = createContext<CompanyContextValue | null>(null);

export function CompanyProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [company, setCompany] = useState<CompanyRecord | null>(null);
    const [loading, setLoading] = useState(true);

    const loadCompany = useCallback(async () => {
        if (!user) {
            setCompany(null);
            setLoading(false);
            return;
        }
        setLoading(true);
        const companyRecord = await getCompanyByUserId(user.id);
        setCompany(companyRecord);
        setLoading(false);
    }, [user]);

    useEffect(() => {
        void loadCompany();
    }, [loadCompany]);

    const createCompany = useCallback(
        async (settings: CompanySettings) => {
            if (!user) return false;
            const created = await createCompanyService(user.id, settings);
            if (created) {
                setCompany(created);
                return true;
            }
            return false;
        },
        [user],
    );

    const updateSettings = useCallback(
        async (settings: CompanySettings) => {
            if (!company) return false;
            const updated = await updateCompanySettingsService(company.companyId, settings);
            if (updated) {
                setCompany(updated);
                return true;
            }
            return false;
        },
        [company],
    );

    const refreshCompany = useCallback(async () => {
        await loadCompany();
    }, [loadCompany]);

    return (
        <CompanyContext.Provider value={{ company, loading, refreshCompany, createCompany, updateSettings }}>
            {children}
        </CompanyContext.Provider>
    );
}

export function useCompany() {
    const ctx = useContext(CompanyContext);
    if (!ctx) throw new Error('useCompany must be used within CompanyProvider');
    return ctx;
}
