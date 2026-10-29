import { useCompany } from '@/context/CompanyContext';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  onDark?: boolean;
}

function BuilderDocsMark() {
  const navy = '#17243A';
  const blue = '#1D4ED8';
  const teal = '#0F766E';

  return (
    <svg
      viewBox="0 0 64 64"
      className="h-full w-full"
      role="img"
      aria-label="BuilderDocs"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      {/* Construction building bars */}
      <path d="M6 24V52H17V24H6Z" fill={navy} />
      <path d="M18 14V52H30V14H18Z" fill={blue} />
      <path d="M33 20V52H45V20H33Z" fill={navy} />
      <path d="M38 23V29H41V23H38Z" fill={teal} />

      <path d="M10 32H14V37H10V32Z" fill="#EAF3FF" />
      <path d="M22 23H26V28H22V23Z" fill="#DCEBFF" />
      <path d="M22 31H26V36H22V31Z" fill="#DCEBFF" />
      <path d="M22 39H26V44H22V39Z" fill="#DCEBFF" />
      <path d="M36 31H40V36H36V31Z" fill="#EAF3FF" />
      <path d="M36 39H40V44H36V39Z" fill="#EAF3FF" />

      {/* Document */}
      <path
        d="M28 25H45L57 37V54C57 56.2 55.2 58 53 58H28C25.8 58 24 56.2 24 54V29C24 26.8 25.8 25 28 25Z"
        fill="#FFFFFF"
        stroke={blue}
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Folded document corner */}
      <path
        d="M45 25V34C45 35.7 46.3 37 48 37H57"
        fill={teal}
        stroke={teal}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Document lines */}
      <path
        d="M32 40H43M32 46H47M32 52H41"
        stroke={blue}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Logo({
  className = '',
  variant = 'full',
  size = 'md',
  onDark = false,
}: LogoProps) {
  const { company } = useCompany();

  const companyName =
    company?.settings.companyName?.trim() || 'BuilderDocs';

  const companyLogoUrl = company?.settings.logoUrl || '';

  const sizeConfig = {
    sm: {
      icon: 'h-8 w-8',
      text: 'text-lg',
      gap: 'gap-2.5',
    },
    md: {
      icon: 'h-10 w-10',
      text: 'text-[1.6rem]',
      gap: 'gap-3',
    },
    lg: {
      icon: 'h-12 w-12',
      text: 'text-[2rem]',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  const mark = companyLogoUrl ? (
    <div className="flex h-full w-full items-center justify-center rounded-full border border-slate-200 bg-white p-1.5">
      <img
        src={companyLogoUrl}
        alt={`${companyName} logo`}
        className="h-full w-full object-contain"
      />
    </div>
  ) : (
    <BuilderDocsMark />
  );

  if (variant === 'mark') {
    return (
      <div
        className={`inline-flex shrink-0 items-center justify-center ${config.icon} ${className}`}
        aria-label={companyName}
        title={companyName}
      >
        {mark}
      </div>
    );
  }

  const isBuilderDocs = companyName === 'BuilderDocs';

  return (
    <div
      className={`inline-flex min-w-0 items-center ${config.gap} ${className}`}
    >
      <div className={`shrink-0 self-center ${config.icon}`}>
        {mark}
      </div>

      <div
        className={`flex min-w-0 items-center whitespace-nowrap font-black leading-none tracking-[-0.06em] ${config.text} ${onDark ? 'text-white' : 'text-[#17243A]'}`}
      >
        {isBuilderDocs ? (
          <>
            <span className="inline-block align-middle">Builder</span>
            <span className="ml-0.5 inline-block align-middle text-[#1D4ED8]">Docs</span>
          </>
        ) : (
          <span className="truncate align-middle">{companyName}</span>
        )}
      </div>
    </div>
  );
}
