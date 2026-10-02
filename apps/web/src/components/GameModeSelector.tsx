import dynamic from 'next/dynamic';

const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
const Shield = dynamic(() => import('lucide-react').then(mod => mod.Shield), { ssr: false });
const Zap = dynamic(() => import('lucide-react').then(mod => mod.Zap), { ssr: false });

interface GameModeSelectorProps {
  activeButton: 'solo' | 'team' | 'private';
  onButtonClick: (_buttonType: 'solo' | 'team' | 'private') => void;
  variant?: 'dark' | 'light';
}

const GameModeSelector = ({ activeButton, onButtonClick, variant = 'dark' }: GameModeSelectorProps) => {
  const isLight = variant === 'light';

  const gameModeButtons = [
    {
      id: 'private' as const,
      title: 'Private game',
      description: 'Invite your group into one room',
      icon: Shield,
      badge: 'Recommended',
      action: () => onButtonClick('private'),
    },
    {
      id: 'team' as const,
      title: 'Team lobby',
      description: 'Create or join a team code',
      icon: Users,
      badge: 'Recommended',
      action: () => onButtonClick('team'),
    },
    {
      id: 'solo' as const,
      title: 'Quick match',
      description: 'Public queue — often quiet',
      icon: Zap,
      badge: 'Low traffic',
      action: () => onButtonClick('solo'),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h2 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-3 ${isLight ? 'text-stone-900' : 'text-white'}`}>
          How do you want to play?
        </h2>
        <p className={`text-base max-w-xl mx-auto ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
          Bring your own players. That is how Relay Chess works best right now.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {gameModeButtons.map((button) => {
          const Icon = button.icon;
          const selected = activeButton === button.id;
          return (
            <button
              key={button.id}
              type="button"
              onClick={button.action}
              className={
                isLight
                  ? `text-left p-6 rounded-xl border transition-colors ${
                      selected
                        ? 'border-stone-900 bg-white shadow-sm ring-1 ring-stone-900'
                        : 'border-stone-200 bg-white hover:border-stone-400'
                    }`
                  : `group relative p-8 rounded-2xl glass-effect transition-all duration-300 hover:scale-105 ${
                      selected ? 'ring-2 ring-cyan-400 glow-effect' : 'hover:ring-1 hover:ring-cyan-400/50'
                    }`
              }
            >
              <div className={`flex flex-col gap-4 ${isLight ? 'items-start' : 'items-center text-center'}`}>
                <div className="flex w-full items-start justify-between gap-2">
                  <div
                    className={
                      isLight
                        ? `p-2.5 rounded-lg ${selected ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700'}`
                        : `p-4 rounded-xl ${selected ? 'bg-gradient-to-br from-cyan-500 to-blue-500' : 'bg-gray-700/50 group-hover:bg-gray-700'}`
                    }
                  >
                    <Icon className={`w-6 h-6 ${isLight ? '' : 'text-white'}`} />
                  </div>
                  <span
                    className={
                      isLight
                        ? `text-[11px] font-medium uppercase tracking-wide px-2 py-1 rounded-md shrink-0 ${
                            button.id === 'solo'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`
                        : `text-[10px] font-medium uppercase tracking-wide px-2 py-1 rounded-md shrink-0 ${
                            button.id === 'solo'
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          }`
                    }
                  >
                    {button.badge}
                  </span>
                </div>
                <div>
                  <h3 className={`text-lg font-semibold mb-1 ${isLight ? 'text-stone-900' : 'text-white'}`}>
                    {button.title}
                  </h3>
                  <p className={`text-sm ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>{button.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameModeSelector;
