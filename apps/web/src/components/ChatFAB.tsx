import dynamic from 'next/dynamic';
import React, { useState, useEffect, useContext } from 'react';
const MessageSquare = dynamic(() => import('lucide-react').then(mod => mod.MessageSquare), { ssr: false });
const X = dynamic(() => import('lucide-react').then(mod => mod.X), { ssr: false });
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatRoom from './ChatRoom';
import { ChessGameContext } from '@/contexts/ChessGame';

interface ChatFABProps {
  className?: string;
}

export const ChatFAB = ({ className }: ChatFABProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { chatMessages, userId } = useContext(ChessGameContext);
  const lastMessageRef = React.useRef<string>('');
  // Track new messages
  useEffect(() => {
    if (!chatMessages?.length || isChatOpen) return;

    const lastMessage = chatMessages[0]; // this is reversed so 0 is first message
    if (lastMessage.id !== lastMessageRef.current && lastMessage.userId !== userId) {
      setUnreadCount(prev => prev + 1);
      lastMessageRef.current = lastMessage.id;
    }
  }, [chatMessages, userId, isChatOpen]);

  // Clear unread count when opening chat
  const handleOpenChat = () => {
    setUnreadCount(0);
    setIsChatOpen(true);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Button 
        className={cn(
          'fixed bottom-6 left-6 z-40',
          'w-14 h-14 rounded-full shadow-lg',
          'bg-[#2b3151] hover:bg-[#3a4268]',
          'flex items-center justify-center',
          'transition-transform hover:scale-105 active:scale-95',
          className
        )}
        onClick={handleOpenChat}
      >
        <MessageSquare className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-medium flex items-center justify-center animate-in fade-in zoom-in duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </Button>

      {/* Chat Overlay */}
      <div 
        className={cn(
          'fixed inset-0 bg-black/50 transition-opacity duration-300 z-50',
          isChatOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsChatOpen(false)}
      />
      <div 
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-[#2b3151] rounded-t-xl transition-transform duration-300 z-50',
          'h-[80vh] flex flex-col',
          isChatOpen ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        {/* Fixed Header */}
        <div className="flex-none flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{"Chat"}</h2>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/10"
            onClick={() => setIsChatOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="h-full w-full max-w-[450px] mx-auto p-4">
            <ChatRoom />
          </div>
        </div>
      </div>
    </>
  );
}; 