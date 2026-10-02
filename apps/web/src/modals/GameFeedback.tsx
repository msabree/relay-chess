import { useContext, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppContext } from '@/contexts/App';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import dynamic from 'next/dynamic';
import { contactUs } from '@/apis/auth';
import { useUser } from '@/hooks/useUser';
import ReactGA from 'react-ga4';

const MessageSquare = dynamic(() => import('lucide-react').then(mod => mod.MessageSquare), { ssr: false });
const Send = dynamic(() => import('lucide-react').then(mod => mod.Send), { ssr: false });
const Trophy = dynamic(() => import('lucide-react').then(mod => mod.Trophy), { ssr: false });
const Bug = dynamic(() => import('lucide-react').then(mod => mod.Bug), { ssr: false });
const Lightbulb = dynamic(() => import('lucide-react').then(mod => mod.Lightbulb), { ssr: false });
const Palette = dynamic(() => import('lucide-react').then(mod => mod.Palette), { ssr: false });
const Gamepad2 = dynamic(() => import('lucide-react').then(mod => mod.Gamepad2), { ssr: false });
const HelpCircle = dynamic(() => import('lucide-react').then(mod => mod.HelpCircle), { ssr: false });

interface GameFeedbackProps {
  open: boolean;
  onClose: () => void;
}

type FeedbackCategory = 'bug' | 'feature' | 'ui' | 'gameplay' | 'other' | null;

export default function GameFeedback({ open, onClose }: GameFeedbackProps) {
  const { } = useContext(AppContext);
  const userQuery = useUser();
  const [feedback, setFeedback] = useState<string>('');
  const [category, setCategory] = useState<FeedbackCategory>(null);
  const [sentFeedback, setSentFeedback] = useState<boolean>(false);

  const handleClose = () => {
    setFeedback('');
    setCategory(null);
    setSentFeedback(false);
    onClose();
  };

  const handleSubmit = () => {
    if(feedback.trim() !== '' && userQuery.data){
      const categoryLabel = category || 'other';
      const feedbackText = category 
        ? `[${categoryLabel.toUpperCase()}] ${feedback}` 
        : feedback;
      
      setSentFeedback(true);
      
      ReactGA.event({
        category: 'Game Feedback',
        action: 'Submitted Feedback',
        label: categoryLabel,
      });
      
      contactUs(
        userQuery.data._id ?? 'anonymous', 
        userQuery.data.username ?? 'n/a', 
        feedbackText
      );
      
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  };

  if (userQuery.data === undefined) {
    return null;
  }

  const categories = [
    { 
      id: 'bug' as FeedbackCategory, 
      icon: Bug, 
      selectedClass: 'border-red-400/50 bg-red-400/20 text-red-400',
      hoverClass: 'hover:border-red-400/30 hover:bg-red-400/10'
    },
    { 
      id: 'feature' as FeedbackCategory, 
      icon: Lightbulb, 
      selectedClass: 'border-yellow-400/50 bg-yellow-400/20 text-yellow-400',
      hoverClass: 'hover:border-yellow-400/30 hover:bg-yellow-400/10'
    },
    { 
      id: 'ui' as FeedbackCategory, 
      icon: Palette, 
      selectedClass: 'border-cyan-400/50 bg-cyan-400/20 text-cyan-400',
      hoverClass: 'hover:border-cyan-400/30 hover:bg-cyan-400/10'
    },
    { 
      id: 'gameplay' as FeedbackCategory, 
      icon: Gamepad2, 
      selectedClass: 'border-blue-400/50 bg-blue-400/20 text-blue-400',
      hoverClass: 'hover:border-blue-400/30 hover:bg-blue-400/10'
    },
    { 
      id: 'other' as FeedbackCategory, 
      icon: HelpCircle, 
      selectedClass: 'border-gray-400/50 bg-gray-400/20 text-gray-400',
      hoverClass: 'hover:border-gray-400/30 hover:bg-gray-400/10'
    },
  ];

  const getPlaceholder = () => {
    if (category === 'bug') return "Describe the bug. What happened? What did you expect?";
    if (category === 'feature') return "What feature would you like to see? How would it work?";
    if (category === 'ui') return "What UI/UX issue did you encounter? How can we improve it?";
    if (category === 'gameplay') return "What gameplay issue did you experience?";
    return "Share your thoughts, suggestions, or concerns...";
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='glass-effect border border-white/10 backdrop-blur-xl max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='text-center text-3xl font-bold text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-3'>
            <MessageSquare className='w-8 h-8 text-cyan-400' />
            {"Help us improve"}
          </DialogTitle>
        </DialogHeader>
        
        <div className='glass-effect border border-white/10 rounded-xl p-6 space-y-6'>
          {/* Category Selection */}
          <div>
            <div className='text-sm font-semibold text-white mb-3 flex items-center gap-2'>
              <MessageSquare className='w-4 h-4 text-cyan-400' />
              {"What type of feedback is this?"}
            </div>
            <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? cat.selectedClass
                        : `border-white/10 text-gray-400 ${cat.hoverClass}`
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? '' : 'text-gray-400'}`} />
                    <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                      {({ bug: 'Bug Report', feature: 'Feature Request', ui: 'UI/UX Issue', gameplay: 'Gameplay Issue', other: 'Other' } as Record<string, string>)[cat.id ?? 'other']}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className='space-y-3'>
            <div className='text-sm font-semibold text-white flex items-center gap-2'>
              <MessageSquare className='w-4 h-4 text-cyan-400' />
              {"Tell us more"}
            </div>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={getPlaceholder()}
              className='glass-effect border border-white/10 bg-white/5 text-white placeholder:text-gray-400 rounded-lg focus:border-cyan-400/50 focus:ring-cyan-400/50 h-32 resize-none'
            />
            <Button 
              disabled={sentFeedback || feedback.trim() === ''} 
              className='w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold py-3 rounded-lg transition-all duration-300 glow-effect disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              onClick={handleSubmit}
            >
              {sentFeedback ? (
                <>
                  <Trophy className='w-4 h-4' />
                  {"Thanks for your feedback!"}
                </>
              ) : (
                <>
                  <Send className='w-4 h-4' />
                  {"Submit Feedback"}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className='flex flex-row justify-center gap-3 mt-4'>
          <Button 
            variant="ghost"
            className='text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200'
            type='button' 
            onClick={handleClose}
          >
            {"Close"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

