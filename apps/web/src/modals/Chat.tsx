import { useContext } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppContext } from '@/contexts/App';
import ChatRoom from '@/components/ChatRoom';

export default function Chat() {
  const { modal, setModal } = useContext(AppContext);
  
  return (
    <Dialog 
      open={modal.name === 'CHAT'} 
      onOpenChange={() => setModal({ name: '' })}
    >
      <DialogContent className="bg-[#2b3151] border-none p-0 max-w-[450px] w-full h-[80vh] flex flex-col">
        <DialogHeader className="flex-none p-4 border-b border-white/10">
          <DialogTitle className="text-lg font-semibold text-white">Chat</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <div className="h-full w-full p-4">
            <ChatRoom />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 