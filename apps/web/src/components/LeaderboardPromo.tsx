import dynamic from 'next/dynamic';
import Link from 'next/link';
import Leaderboard from '@/components/Leaderboard';
import { Button } from '@/components/ui/button';
import { VIEWED_LEADERBOARD } from '@/constants';
import ReactGA from 'react-ga4';

const Trophy = dynamic(() => import('lucide-react').then(mod => mod.Trophy), { ssr: false });
const Zap = dynamic(() => import('lucide-react').then(mod => mod.Zap), { ssr: false });
const Clock = dynamic(() => import('lucide-react').then(mod => mod.Clock), { ssr: false });
const Infinity = dynamic(() => import('lucide-react').then(mod => mod.Infinity), { ssr: false });
const TrendingUp = dynamic(() => import('lucide-react').then(mod => mod.TrendingUp), { ssr: false });
const ArrowRight = dynamic(() => import('lucide-react').then(mod => mod.ArrowRight), { ssr: false });

const LeaderboardPromo = () => {
  return (
    <div className='flex flex-col lg:flex-row items-start w-full mb-7 gap-8'>
      <div className='w-full lg:w-3/5'>
        <Leaderboard showHeader={false} showPagination={false} pageSize={10} />
      </div>
      
      <div className='w-full lg:w-2/5'>
        <div className='glass-effect rounded-2xl p-8 border border-white/10'>
          <div className='flex items-center gap-3 mb-6'>
            <div className='p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20'>
              <Trophy className='w-6 h-6 text-amber-400' />
            </div>
            <div>
              <h3 className='text-2xl font-bold text-white'>{"Ready to Climb?"}</h3>
              <p className='text-sm text-gray-400'>{"Start your journey to the top"}</p>
            </div>
          </div>

          <p className='text-gray-300 text-lg mb-6 leading-relaxed'>
            {"Compete in ranked 2v2 matches, build your streak, and earn your place among the elite."}
          </p>

          <div className='grid grid-cols-3 gap-3 mb-8'>
            <div className='glass-effect rounded-lg p-4 text-center border border-white/5 hover:border-cyan-400/30 transition-all'>
              <Zap className='w-6 h-6 text-cyan-400 mx-auto mb-2' />
              <div className='text-xs text-gray-400'>{"Fast-paced Blitz"}</div>
            </div>
            <div className='glass-effect rounded-lg p-4 text-center border border-white/5 hover:border-cyan-400/30 transition-all'>
              <Clock className='w-6 h-6 text-blue-400 mx-auto mb-2' />
              <div className='text-xs text-gray-400'>{"Strategic Rapid"}</div>
            </div>
            <div className='glass-effect rounded-lg p-4 text-center border border-white/5 hover:border-cyan-400/30 transition-all'>
              <Infinity className='w-6 h-6 text-purple-400 mx-auto mb-2' />
              <div className='text-xs text-gray-400'>{"Relaxed Untimed"}</div>
            </div>
          </div>

          <Link 
            href='/leaderboard'
            onClick={() => {
              ReactGA.event({
                category: VIEWED_LEADERBOARD,
                action: 'Viewed Leaderboard',
              });
            }}
          >
            <Button className='w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white min-h-[56px] text-lg font-semibold rounded-xl glow-effect transition-all duration-300 group'>
              <TrendingUp className='w-5 h-5 mr-2 group-hover:scale-110 transition-transform' />
              {"View Full Leaderboard"}
              <ArrowRight className='w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform' />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPromo;
