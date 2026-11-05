/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#F5F7FC',
        surface: '#FFFFFF',
        'surface-soft': '#F8FAFC',
        'surface-alt': '#EEF4FF',
        'surface-muted': '#F1F5F9',
        navy: '#17243B',
        primary: '#2454D6',
        'primary-hover': '#1D3FAD',
        'primary-soft': '#EAF1FF',
        border: '#E2E8F0',
        text: '#17243B',
        'text-secondary': '#64748B',
        'text-muted': '#94A3B8',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',
        info: '#2563EB',
      },
      boxShadow: {
        soft: '0 10px 24px rgba(15, 23, 42, 0.05)',
        card: '0 8px 22px rgba(23, 36, 58, 0.06)',
        modal: '0 24px 60px rgba(15, 23, 42, 0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        xl: '12px',
        '2xl': '20px',
      },
    },
  },
  plugins: [],
};
