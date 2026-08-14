// Generic Logo component — displays SVG mark and company name from CompanyContext.

import { useCompany } from '@/context/CompanyContext';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', variant = 'full', size = 'md' }: LogoProps) {
  const { company } = useCompany();
  const companyName = company?.settings.companyName || '';
  const tagline = company?.settings.tagline || '';

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const mark = (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Company logo"
      className="w-full h-full"
    >
      <rect width="48" height="48" rx="10" fill="#F4B72B" />
      <path d="M14 34V20L24 12L34 20V34" stroke="#071C3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M19 34V24H29V34" stroke="#071C3F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <rect x="22" y="27" width="4" height="4" fill="#071C3F" />
      <path d="M12 34H36" stroke="#071C3F" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );

  if (variant === 'mark') {
    return <div className={`flex-shrink-0 ${sizeClasses[size]} ${className}`}>{mark}</div>;
  }

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`flex-shrink-0 ${sizeClasses[size]}`}>{mark}</div>
      <div className="leading-none">
        <div className="text-white font-bold text-lg tracking-wide">{companyName || 'BuilderDocs'}</div>
        <div className="text-[#F4B72B] text-[10px] font-semibold tracking-widest uppercase mt-0.5">{tagline || 'Construction Documents'}</div>
      </div>
    </div>
  );
}
