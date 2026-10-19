import logoFull from '@/assets/techspear-logo-full.png';
import logoIcon from '@/assets/techspear-logo-icon.png';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

// Real Techspear brand mark (src/assets/techspear-logo-full.png / -icon.png) — cropped and
// resized down from the original 11115x2853 / 8.8MB export (src/assets/techspear_logo.png,
// still in the repo but unused: far too large to ship on every page load). `showText`
// toggles between the full lockup (icon + wordmark + tagline) and the icon mark alone.
export function Logo({ className = 'h-8', showText = true }: LogoProps) {
  return (
    <img
      src={showText ? logoFull : logoIcon}
      alt="Techspear"
      className={`object-contain ${className}`}
    />
  );
}
