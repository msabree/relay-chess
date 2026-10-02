import { useContext, useState } from 'react';
import { AppContext } from '@/contexts/App';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { Input } from '@/components/ui/input';

const Users = dynamic(() => import('lucide-react').then(mod => mod.Users), { ssr: false });
const UserPlus = dynamic(() => import('lucide-react').then(mod => mod.UserPlus), { ssr: false });
const ArrowRight = dynamic(() => import('lucide-react').then(mod => mod.ArrowRight), { ssr: false });
const Copy = dynamic(() => import('lucide-react').then(mod => mod.Copy), { ssr: false });

type TeamPlayExperienceProps = {
  variant?: 'dark' | 'light';
};

const TeamPlayExperience = ({ variant = 'dark' }: TeamPlayExperienceProps) => {
  const { setModal } = useContext(AppContext);
  const [teamCode, setTeamCode] = useState('');
  const isLight = variant === 'light';

  const handleJoinTeam = () => {
    if (teamCode.trim() !== '') {
      setModal({ name: 'INVITE_TEAMMATES', data: { inviteCode: teamCode } });
    }
  };

  const cardClass = isLight
    ? 'rounded-xl p-6 border border-stone-200 bg-stone-50'
    : 'glass-effect rounded-xl p-6 border border-white/10 hover:border-cyan-400/30 transition-all duration-300';

  const primaryBtn = isLight
    ? 'bg-stone-900 hover:bg-stone-800 text-white'
    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white glow-effect';

  return (
    <div className={isLight ? 'text-stone-900 w-full' : 'text-white w-full'}>
      <div className="flex items-center gap-3 mb-6">
        <div className={isLight ? 'p-3 rounded-lg bg-stone-100' : 'p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20'}>
          <Users className={`w-6 h-6 ${isLight ? 'text-stone-700' : 'text-cyan-400'}`} />
        </div>
        <div>
          <h3 className="text-xl font-semibold tracking-tight">Team up with friends</h3>
          <p className={`text-sm ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>Same team, shared clock</p>
        </div>
      </div>

      <p className={`mb-8 text-base leading-relaxed ${isLight ? 'text-stone-600' : 'text-gray-300'}`}>
        Create a team code and send it to three friends, or paste a code you received. This is the most reliable way to
        get a full 2v2 game.
      </p>

      <div className="flex flex-col gap-4 w-full">
        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <Copy className={`w-5 h-5 ${isLight ? 'text-stone-600' : 'text-cyan-400'}`} />
            <h4 className="text-base font-semibold">Join with a code</h4>
          </div>
          <p className={`text-sm mb-4 ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
            Enter the team code from your host.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Team code"
              value={teamCode}
              onChange={(e) => setTeamCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleJoinTeam();
              }}
              className={
                isLight
                  ? 'flex-1 min-h-[48px] border-stone-300 bg-white text-stone-900'
                  : 'flex-1 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-cyan-400 min-h-[48px] text-base'
              }
            />
            <Button
              className={`whitespace-nowrap px-6 min-h-[48px] font-medium ${primaryBtn}`}
              onClick={handleJoinTeam}
              disabled={teamCode.trim() === ''}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Join
            </Button>
          </div>
        </div>

        <div className="relative w-full my-1">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${isLight ? 'border-stone-200' : 'border-white/10'}`} />
          </div>
          <div className="relative flex justify-center text-sm">
            <span
              className={`px-3 text-xs font-medium ${isLight ? 'bg-white text-stone-500' : 'px-4 glass-effect rounded-full text-gray-400'}`}
            >
              OR
            </span>
          </div>
        </div>

        <div className={cardClass}>
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className={`w-5 h-5 ${isLight ? 'text-stone-600' : 'text-cyan-400'}`} />
            <h4 className="text-base font-semibold">Host a new team</h4>
          </div>
          <p className={`text-sm mb-4 ${isLight ? 'text-stone-600' : 'text-gray-400'}`}>
            We will give you a link to share with teammates.
          </p>
          <Button className={`w-full min-h-[48px] font-medium ${primaryBtn}`} onClick={() => setModal({ name: 'INVITE_TEAMMATES' })}>
            Create team & invite
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TeamPlayExperience;
