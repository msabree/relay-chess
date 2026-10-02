import dynamic from 'next/dynamic';
const Sparkles = dynamic(() => import('lucide-react').then(mod => mod.Sparkles), { ssr: false });
const Zap = dynamic(() => import('lucide-react').then(mod => mod.Zap), { ssr: false });
const BookOpen = dynamic(() => import('lucide-react').then(mod => mod.BookOpen), { ssr: false });
const AlertTriangle = dynamic(() => import('lucide-react').then(mod => mod.AlertTriangle), { ssr: false });
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });

interface MoveBadgeProps {
  feedback: 'best' | 'good' | 'unexpected' | 'mistake' | 'blunder' | '';
  isOpening?: boolean;
  className?: string;
}

export const MoveBadge = ({ feedback, isOpening = false, className = '' }: MoveBadgeProps) => {
  if (!feedback) return null;

  const badgeConfigs: Record<string, { 
    label: string; 
    icon: any; 
    color: string; 
    glow: string; 
    bg: string;
    border: string;
    iconColor: string;
  }> = {
    best: {
      icon: isOpening ? BookOpen : Sparkles,
      label: isOpening ? "Book" : "Brilliant",
      color: 'text-cyan-400',
      glow: 'shadow-[0_0_20px_rgba(6,182,212,0.6)]',
      bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-400/50',
      iconColor: 'text-cyan-400'
    },
    good: {
      icon: Zap,
      label: "Great",
      color: 'text-blue-400',
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      bg: 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-400/50',
      iconColor: 'text-blue-400'
    },
    unexpected: {
      icon: AlertTriangle,
      label: "Inaccuracy",
      color: 'text-yellow-400',
      glow: 'shadow-[0_0_10px_rgba(250,204,21,0.4)]',
      bg: 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20',
      border: 'border-yellow-400/50',
      iconColor: 'text-yellow-400'
    },
    mistake: {
      icon: AlertTriangle,
      label: "Mistake",
      color: 'text-orange-400',
      glow: 'shadow-[0_0_10px_rgba(251,146,60,0.4)]',
      bg: 'bg-gradient-to-r from-orange-500/20 to-red-500/20',
      border: 'border-orange-400/50',
      iconColor: 'text-orange-400'
    },
    blunder: {
      icon: X,
      label: "Blunder",
      color: 'text-red-500',
      glow: 'shadow-[0_0_20px_rgba(239,68,68,0.6)]',
      bg: 'bg-gradient-to-r from-red-500/20 to-pink-500/20',
      border: 'border-red-400/50',
      iconColor: 'text-red-500'
    }
  };

  const config = badgeConfigs[feedback];
  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-sm ${config.bg} ${config.border} ${config.glow} ${className} transition-all duration-300 hover:scale-105`}>
      <Icon className={`h-5 w-5 ${config.iconColor} ${feedback === 'best' ? 'animate-pulse' : ''}`} />
      <span className={`font-black text-xs tracking-widest uppercase ${config.color}`}>
        {config.label}
      </span>
      {feedback === 'blunder' && <span className="text-red-400">⚠️</span>}
    </div>
  );
};
