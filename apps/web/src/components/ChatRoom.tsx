import React, { useContext, useState } from 'react';
import { ChessGameContext } from '@/contexts/ChessGame';
import Linkify from 'react-linkify';

import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  Conversation,
  ConversationList,
  Sidebar,
} from '@chatscope/chat-ui-kit-react';
import Link from 'next/link';
import { containsLink, formatAnonUsername } from '@/utils/strings';

const ChatRoom = () => {

  const { chatMessages, sendChatMessage, userId, blackTeam, whiteTeam, spectators } = useContext(ChessGameContext);
  const [chat, setChat] = useState<string>('');
  const getUsername = (senderUserId: string, senderUsername: string) => {
    if(senderUserId === 'relaychess.com'){
      return senderUsername;
    }
    else if(userId === senderUserId){
      return "You";
    }
    else if(userId !== senderUserId){
      return formatAnonUsername(senderUsername);
    }
    return "Anonymous";
  };

  return (
    <div className='relative height-[500px] mt-[5%] mr-4 ml-4 mb-[200px] sm:w-[100%] md:w-[450px]'>
      <MainContainer className="glass-effect border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
        <Sidebar position="left" scrollable={true} style={{width: '140px', padding: '12px'}}>
          <ConversationList style={{fontSize: '14px', padding: '8px 0'}}>
            {
              whiteTeam?.usersInRoom?.map((user) => {
                const displayName = formatAnonUsername(user.username);
                return (
                  <div key={user.id} style={{marginBottom: '8px'}}>
                    <Conversation name={displayName} info={"Playing as White"} />
                    <div className="h-px w-full bg-white/10 my-2" />
                  </div>
                );
              })
            }
            {
              blackTeam?.usersInRoom?.map((user) => {
                const displayName = formatAnonUsername(user.username);
                return (
                  <div key={user.id} style={{marginBottom: '8px'}}>
                    <Conversation name={displayName} info={"Playing as Black"} />
                    <div className="h-px w-full bg-white/10 my-2" />
                  </div>
                );
              })
            }
            {
              spectators?.map((user) => {
                const spectatingMessage = userId === user.id ? "You are spectating" : "Spectating";
                // Handle username being boolean (legacy type issue) or string
                const username = typeof user.username === 'string' ? user.username : user.id;
                const displayName = formatAnonUsername(username);
                return (
                  <div key={user.id} style={{marginBottom: '8px'}}>
                    <Conversation name={displayName} info={spectatingMessage} />
                    <div className="h-px w-full bg-white/10 my-2" />
                  </div>
                );
              })
            }
          </ConversationList>
        </Sidebar>
        <ChatContainer>
          <MessageList style={{padding: '12px'}}>
            {
              (chatMessages ?? []).slice().reverse()?.map((message) => {
                return (
                  <Message
                    key={message.id}
                    className='px-3 py-2 mb-2'
                    style={{borderRadius: '12px', marginBottom: '8px'}}
                    model={{
                      message: message.message,
                      sentTime: "just now",
                      sender: getUsername(message.userId, message.username),
                      direction: userId === message.userId ? 'outgoing' : 'incoming',
                      position: 'single',
                    }}
                  >
                    {containsLink(message.message) && (
                      <Message.CustomContent>
                        <Linkify componentDecorator={(decoratedHref, decoratedText, key) => (
                          <Link className='underline text-cyan-400 hover:text-cyan-300 transition-colors' target="blank" rel="noopener" href={decoratedHref} key={key}>
                            {decoratedText}
                          </Link>
                        )}>
                          {message.message}
                        </Linkify>
                      </Message.CustomContent>
                    )} 
                    <Message.Header sender={getUsername(message.userId, message.username)} />
                  </Message>
                );
              })
            }
          </MessageList>
          <MessageInput 
            attachButton={false}
            value={chat} 
            placeholder={"Type message here..."} 
            onChange={(text) => setChat(text)}
            onSend={() => {
              if(chat.trim() !== ''){
                sendChatMessage(chat);
              }
              setChat('');
            }}
            style={{padding: '12px'}}
          />
        </ChatContainer>
      </MainContainer>
    </div>
  );
};

export default ChatRoom;