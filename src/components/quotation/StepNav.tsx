import { type ReactNode } from 'react';
import { Check } from 'lucide-react';

export interface StepDef {
  key: string;
  label: string;
}

interface Props {
  steps: StepDef[];
  current: number;
  onStepClick: (idx: number) => void;
  children: ReactNode;
}

export default function StepNav({ steps, current, onStepClick, children }: Props) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4 overflow-x-auto">
        {steps.map((step, idx) => {
          const isActive = idx === current;
          const isDone = idx < current;
          return (
            <button
              key={step.key}
              onClick={() => onStepClick(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#0B2857] text-white'
                  : isDone
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                  isActive
                    ? 'bg-[#F4B72B] text-[#071C3F]'
                    : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              {step.label}
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}
