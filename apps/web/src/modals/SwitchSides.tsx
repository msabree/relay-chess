import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import { ChessGameContext } from '@/contexts/ChessGame';
import { useContext } from 'react';

const RotateCcw = dynamic(() => import('lucide-react').then(mod => mod.RotateCcw), { ssr: false });
const Eye = dynamic(() => import('lucide-react').then(mod => mod.Eye), { ssr: false });

interface SwitchSidesProps {
  open: boolean;
  onClose: () => void;
}

export default function SwitchSides({ open, onClose }: SwitchSidesProps) {
  const { changeTeam } = useContext(ChessGameContext);

  const handleSwitch = (side: 'w' | 'b' | 'spectator') => {
    changeTeam(side);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass-effect border border-white/10 backdrop-blur-xl max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <RotateCcw className="w-7 h-7 text-cyan-400" />
            Switch Sides
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col space-y-4 py-6">
          <Button
            onClick={() => handleSwitch('w')}
            className="glass-effect border border-white/20 hover:border-white/40 bg-gradient-to-r from-white/10 to-gray-100/10 hover:from-white/20 hover:to-gray-100/20 text-white font-semibold py-6 rounded-xl transition-all duration-300 glow-effect group relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <div className="w-8 h-8 rounded bg-white shadow-lg"></div>
              </div>
              <span className="text-lg">Play as White</span>
            </div>
          </Button>
          
          <Button
            onClick={() => handleSwitch('b')}
            className="glass-effect border border-white/20 hover:border-white/40 bg-gradient-to-r from-gray-900/30 to-black/30 hover:from-gray-900/40 hover:to-black/40 text-white font-semibold py-6 rounded-xl transition-all duration-300 glow-effect group relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-gray-900/40 flex items-center justify-center group-hover:bg-gray-900/60 transition-colors">
                <div className="w-8 h-8 rounded bg-gray-800 shadow-lg border border-gray-700"></div>
              </div>
              <span className="text-lg">Play as Black</span>
            </div>
          </Button>
          
          <Button
            onClick={() => handleSwitch('spectator')}
            className="glass-effect border border-cyan-400/30 hover:border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:from-cyan-500/20 hover:to-blue-500/20 text-white font-semibold py-6 rounded-xl transition-all duration-300 group relative overflow-hidden"
          >
            <div className="flex items-center justify-center gap-3 relative z-10">
              <div className="w-12 h-12 rounded-lg bg-cyan-400/20 flex items-center justify-center group-hover:bg-cyan-400/30 transition-colors">
                <Eye className="w-6 h-6 text-cyan-400" />
              </div>
              <span className="text-lg">Spectate</span>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 