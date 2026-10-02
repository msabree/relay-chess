import { useContext } from 'react';
import { signIn } from 'next-auth/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppContext } from '@/contexts/App';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';
import Google from '@/icons/Google';
import Apple from '@/icons/Apple';

const Sparkles = dynamic(() => import('lucide-react').then(mod => mod.Sparkles), { ssr: false });

export default function SignIn() {
  const { modal, setModal } = useContext(AppContext);
  return (
    <Dialog open={modal.name === 'SIGN_IN'} onOpenChange={() => setModal({ name: '' })}>
      <DialogContent className='glass-effect border border-white/10 backdrop-blur-xl shadow-xl max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-center text-3xl font-bold text-gradient bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center justify-center gap-3'>
            <Sparkles className='w-7 h-7 text-cyan-400' />
            {"Welcome to Relay Chess"}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          <div className='text-center text-gray-300 text-lg leading-relaxed'>
            {"Sign in to play team chess with friends and track your progress"}
          </div>

          <div className='space-y-3'>
            <Button
              variant='ghost'
              className='w-full flex items-center justify-center gap-3 glass-effect border border-white/10 hover:border-white/30 hover:bg-white/10 text-white font-semibold py-6 rounded-xl transition-all duration-300 group'
              onClick={() => signIn('google')}
            >
              <Google className='h-6 w-6' />
              <span>{"Continue with Google"}</span>
            </Button>

            <Button
              variant='ghost'
              className='w-full flex items-center justify-center gap-3 glass-effect border border-white/10 hover:border-white/30 hover:bg-white/10 text-white font-semibold py-6 rounded-xl transition-all duration-300 group'
              onClick={() => signIn('apple')}
            >
              <Apple className='h-6 w-6 fill-white' />
              <span>{"Continue with Apple"}</span>
            </Button>
          </div>

          <div className='text-center text-xs text-gray-400 leading-relaxed pt-2'>
            {"By signing in, you agree to our"}{' '}
            <a href='/terms-of-service' className='text-cyan-400 hover:text-cyan-300 underline' target='_blank' rel='noopener noreferrer'>
              {"Terms of Service"}
            </a>
            {' '}{"and"}{' '}
            <a href='/privacy-policy' className='text-cyan-400 hover:text-cyan-300 underline' target='_blank' rel='noopener noreferrer'>
              {"Privacy Policy"}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
