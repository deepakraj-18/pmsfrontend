import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FormHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color?: string;
}

const COLOR_MAP: Record<string, { bgGlow: string; borderGlow: string; iconGrad: string }> = {
  emerald: {
    bgGlow: 'linear-gradient(135deg, hsl(150 60% 45% / 0.08), hsl(170 70% 50% / 0.05))',
    borderGlow: '1px solid hsl(150 60% 45% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(150 60% 45%), hsl(170 70% 50%))',
  },
  blue: {
    bgGlow: 'linear-gradient(135deg, hsl(210 70% 55% / 0.08), hsl(230 80% 60% / 0.05))',
    borderGlow: '1px solid hsl(210 70% 55% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(210 70% 55%), hsl(230 80% 60%))',
  },
  purple: {
    bgGlow: 'linear-gradient(135deg, hsl(270 60% 55% / 0.08), hsl(290 70% 60% / 0.05))',
    borderGlow: '1px solid hsl(270 60% 55% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(270 60% 55%), hsl(290 70% 60%))',
  },
  amber: {
    bgGlow: 'linear-gradient(135deg, hsl(35 80% 55% / 0.08), hsl(45 90% 50% / 0.05))',
    borderGlow: '1px solid hsl(35 80% 55% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(35 80% 55%), hsl(45 90% 50%))',
  },
  rose: {
    bgGlow: 'linear-gradient(135deg, hsl(340 70% 55% / 0.08), hsl(350 80% 60% / 0.05))',
    borderGlow: '1px solid hsl(340 70% 55% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(340 70% 55%), hsl(350 80% 60%))',
  },
  cyan: {
    bgGlow: 'linear-gradient(135deg, hsl(190 70% 50% / 0.08), hsl(200 80% 55% / 0.05))',
    borderGlow: '1px solid hsl(190 70% 50% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(190 70% 50%), hsl(200 80% 55%))',
  },
  teal: {
    bgGlow: 'linear-gradient(135deg, hsl(160 60% 45% / 0.08), hsl(180 70% 50% / 0.05))',
    borderGlow: '1px solid hsl(160 60% 45% / 0.2)',
    iconGrad: 'linear-gradient(135deg, hsl(160 60% 45%), hsl(180 70% 50%))',
  },
};

export function FormHeader({ icon: Icon, title, subtitle, color = 'emerald' }: FormHeaderProps) {
  const c = COLOR_MAP[color] || COLOR_MAP.emerald;
  return (
        <div className="flex items-center gap-4 mb-6 p-5 rounded-2xl" style={{
            background: c.bgGlow,
            border: c.borderGlow,
        }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: c.iconGrad }}>
                <Icon size={22} className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h1>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
            </div>
        </div>
  );
}
