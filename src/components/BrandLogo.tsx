interface BrandLogoProps {
    className?: string;
    variant?: 'full' | 'mark';
    size?: 'sm' | 'md' | 'lg';
    onDark?: boolean;
    src?: string;
    alt?: string;
}

const sizeConfig = {
    sm: {
        mark: 'h-8 w-8',
        text: 'text-xl',
        gap: 'gap-2',
    },
    md: {
        mark: 'h-10 w-10',
        text: 'text-[1.8rem]',
        gap: 'gap-3',
    },
    lg: {
        mark: 'h-12 w-12',
        text: 'text-[2.2rem]',
        gap: 'gap-3',
    },
} as const;

const fallbackLogoSrc = '/builderdocs-mark-transparent.svg';

export default function BrandLogo({
    className = '',
    variant = 'full',
    size = 'md',
    onDark = false,
    src,
    alt = 'BuilderDocs logo',
}: BrandLogoProps) {
    const config = sizeConfig[size];
    const imageSource = src && src.trim() ? src : fallbackLogoSrc;

    const mark = (
        <img
            src={imageSource}
            alt={alt}
            className="h-full w-full object-contain"
            loading="eager"
            decoding="async"
            onError={(event) => {
                if (event.currentTarget.src !== window.location.origin + fallbackLogoSrc) {
                    event.currentTarget.src = fallbackLogoSrc;
                }
            }}
        />
    );

    if (variant === 'mark') {
        return (
            <div
                className={`inline-flex shrink-0 items-center justify-center ${config.mark} ${className}`}
                aria-label="BuilderDocs"
                title="BuilderDocs"
            >
                {mark}
            </div>
        );
    }

    return (
        <div className={`inline-flex min-w-0 items-center ${config.gap} ${className}`}>
            <div className={`shrink-0 self-center ${config.mark}`}>{mark}</div>
            <div
                className={`flex min-w-0 items-center whitespace-nowrap font-black leading-none tracking-[-0.05em] ${config.text} ${onDark ? 'text-white' : 'text-[#0E2245]'}`}
            >
                <span className="inline-block align-middle">Builder</span>
                <span className={`ml-0.5 inline-block align-middle ${onDark ? 'text-[#6FA8FF]' : 'text-[#1D4ED8]'}`}>Docs</span>
            </div>
        </div>
    );
}
