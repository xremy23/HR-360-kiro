import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store/store';
import toast from 'react-hot-toast';
import { chatbotService } from '../services/chatbotService';
import { indexedDBService } from '../services/indexedDBService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Message {
  id: string;
  userMessage: string;
  botResponse: string;
  context?: {
    relatedGuideIds?: string[];
    confidence?: number;
    keywords?: string[];
  };
  suggestedGuides?: any[];
  isHelpful?: boolean;
  createdAt: Date;
  isOffline?: boolean;
}

const Chatbot: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  
  // UI State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your HR Crisis 360 safety chatbot. Ask me any question concerning disasters, workplace threat lockdowns, transport strikes, or HR protocols!',
    },
  ]);
  const [typedMessage, setTypedMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle message sending with simulated crisis responses
  const handleChatSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || isChatLoading) return;

    const userQuery = typedMessage.trim();
    const updatedMessages = [
      ...chatMessages,
      { role: 'user' as const, content: userQuery },
    ];
    setChatMessages(updatedMessages);
    setTypedMessage('');
    setIsChatLoading(true);

    try {
      // Simulated API response from HR intelligence database
      await new Promise((resolve) => setTimeout(resolve, 1200));

      let botReply =
        '🛡️ Thank you for reaching out. Based on your safety protocols, here is your action response:\n\n';

      if (userQuery.toLowerCase().includes('earthquake')) {
        botReply +=
          '🌋 **Earthquake Response (Drop, Cover, Hold)**:\n1. Immediately seek shelter under sturdy office frames.\n2. Keep away from glass windows, overhead cabinets, and heavy server racks.\n3. Wait for the safety team\'s whistle signal before evacuating to the designated open-air parking deck.';
      } else if (
        userQuery.toLowerCase().includes('active') ||
        userQuery.toLowerCase().includes('shooter') ||
        userQuery.toLowerCase().includes('threat')
      ) {
        botReply +=
          '🔫 **Active Threat Lockdown Response (Run, Hide, Fight)**:\n1. Lock key access points and move away from glass doors.\n2. Put devices on absolute silence mode.\n3. Await official Safety Officer clearance over the secure intercom before releasing locks.';
      } else if (
        userQuery.toLowerCase().includes('strike') ||
        userQuery.toLowerCase().includes('transport') ||
        userQuery.toLowerCase().includes('wfh')
      ) {
        botReply +=
          '💻 **Transport Strike WFH Mandate**:\nAs per HR Policy Section 8.4, if active strikes impede regular transit, remote operations are authorized. Coordinate with your immediate Supervisor to register your off-site status.';
      } else if (
        userQuery.toLowerCase().includes('flood') ||
        userQuery.toLowerCase().includes('water')
      ) {
        botReply +=
          '💧 **Flood Response Protocol**:\n1. Move to higher floors immediately if flooding occurs in lower levels.\n2. Shut off electrical panels to prevent hazards.\n3. Document all damage with photos before cleanup begins.';
      } else if (
        userQuery.toLowerCase().includes('typhoon') ||
        userQuery.toLowerCase().includes('wind')
      ) {
        botReply +=
          '🌀 **Typhoon Response Protocol**:\n1. Secure all loose items in your work area.\n2. Move away from windows and glass structures.\n3. Monitor the emergency broadcast system for updates and evacuation orders.';
      } else {
        botReply +=
          '🛡️ Your Safety Officers are monitoring your status. Please report your wellness via the \'Check-In\' button on the main dashboard for live tracking.';
      }

      setChatMessages([
        ...updatedMessages,
        { role: 'assistant', content: botReply },
      ]);
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Clear chat history
  const handleClearChat = () => {
    setChatMessages([
      {
        role: 'assistant',
        content:
          'Hello! I am your HR Crisis 360 safety chatbot. Ask me any question concerning disasters, workplace threat lockdowns, transport strikes, or HR protocols!',
      },
    ]);
  };

  // Set predefined questions
  const setSuggestedMessage = (message: string) => {
    setTypedMessage(message);
  };

  return (
    <div className="w-full min-h-screen bg-stone-50 dark:bg-neutral-950 flex flex-col">
      {/* --- HEADER COMPONENT --- */}
      <header className="pb-2 border-b border-stone-200 dark:border-neutral-800/80 sticky top-0 z-20 bg-stone-50/95 dark:bg-neutral-950/95 backdrop-blur px-4 py-4">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#038F8D] to-[#024645] flex items-center justify-center text-white shadow-md shadow-[#038F8D]/10">
              ✨
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-[#024645] dark:text-stone-150">
                HR Crisis 360 Advisor
              </h1>
              <span className="text-[8px] bg-[#038F8D]/10 dark:bg-[#038F8D]/15 text-[#038F8D] dark:text-[#49D7D1] font-bold px-1.5 py-0.2 rounded font-mono uppercase">
                Safety Agent
              </span>
            </div>
          </div>
          <button
            onClick={handleClearChat}
            className="text-[9px] font-bold text-stone-450 hover:text-rose-500 dark:text-stone-450 dark:hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            🗑️ Clear Chat
          </button>
        </div>
      </header>

      {/* --- SCROLLABLE MESSAGES FEED --- */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 max-w-md mx-auto w-full scrollbar-none pb-96">
        {chatMessages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={idx}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`p-3 rounded-2xl max-w-xs leading-relaxed shadow-sm border transition-all text-xs ${
                  isUser
                    ? 'bg-gradient-to-br from-[#038F8D] to-[#01403E] text-white rounded-br-none border-[#038F8D]/20 shadow-sm'
                    : 'bg-[#038F8D]/8 dark:bg-[#024645]/20 border-[#038F8D]/15 dark:border-[#49D7D1]/15 text-[#024645] dark:text-stone-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-[8.5px] uppercase tracking-wider opacity-75 mb-1 select-none">
                  {isUser ? (
                    <span className="text-[#49D7D1]">My Command</span>
                  ) : (
                    <span className="text-[#038F8D] dark:text-[#49D7D1] flex items-center gap-1">
                      🛡️ HR Crisis Coordinator
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-line text-[11px] font-medium leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}

        {/* LOADING STATE */}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-[#038F8D]/8 dark:bg-[#024645]/20 border border-[#038F8D]/15 dark:border-[#49D7D1]/15 p-3 rounded-2xl rounded-bl-none text-[11px] w-4/5">
              <span className="font-extrabold text-[9px] uppercase text-[#038F8D] dark:text-[#49D7D1] flex items-center gap-1 animate-pulse mb-1">
                🔄 Analyzing Safety Registers...
              </span>
              <p className="text-stone-400 dark:text-stone-450 italic font-mono text-[9.5px]">
                Searching files & AI safety grids...
              </p>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* --- SUGGESTED CHIPS / PRESETS - Fixed at bottom above input --- */}
      {chatMessages.length === 1 && (
        <div className="px-4 py-3 max-w-md mx-auto w-full space-y-1.5 border-t border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-neutral-950/95 backdrop-blur sticky bottom-24">
          <p className="text-[8.5px] text-stone-400 dark:text-stone-500 font-extrabold uppercase tracking-wider pl-1 font-mono">
            💡 Suggested Crisis Scenarios
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() =>
                setSuggestedMessage(
                  'What should I do during an Earthquake?'
                )
              }
              className="p-1.5 border border-[#038F8D]/15 dark:border-[#49D7D1]/10 bg-[#038F8D]/5 dark:bg-[#038F8D]/10 hover:bg-[#038F8D]/10 dark:hover:bg-[#49D7D1]/20 text-[10px] rounded-lg font-bold text-[#038F8D] dark:text-[#49D7D1] text-left cursor-pointer transition-all active:scale-[98%]"
            >
              🌋 Earthquake Steps
            </button>
            <button
              onClick={() =>
                setSuggestedMessage(
                  'Active shooter threat rules?'
                )
              }
              className="p-1.5 border border-[#038F8D]/15 dark:border-[#49D7D1]/10 bg-[#038F8D]/5 dark:bg-[#038F8D]/10 hover:bg-[#038F8D]/10 dark:hover:bg-[#49D7D1]/20 text-[10px] rounded-lg font-bold text-[#038F8D] dark:text-[#49D7D1] text-left cursor-pointer transition-all active:scale-[98%]"
            >
              🔫 Active Threat
            </button>
            <button
              onClick={() =>
                setSuggestedMessage(
                  'What is the protocol for HR harassment?'
                )
              }
              className="p-1.5 border border-[#038F8D]/15 dark:border-[#49D7D1]/10 bg-[#038F8D]/5 dark:bg-[#038F8D]/10 hover:bg-[#038F8D]/10 dark:hover:bg-[#49D7D1]/20 text-[10px] rounded-lg font-bold text-[#038F8D] dark:text-[#49D7D1] text-left cursor-pointer transition-all active:scale-[98%]"
            >
              ⚖️ Harassment Guide
            </button>
            <button
              onClick={() =>
                setSuggestedMessage(
                  'Transport strike guidelines?'
                )
              }
              className="p-1.5 border border-[#038F8D]/15 dark:border-[#49D7D1]/10 bg-[#038F8D]/5 dark:bg-[#038F8D]/10 hover:bg-[#038F8D]/10 dark:hover:bg-[#49D7D1]/20 text-[10px] rounded-lg font-bold text-[#038F8D] dark:text-[#49D7D1] text-left cursor-pointer transition-all active:scale-[98%]"
            >
              💻 Transport Strike WFH
            </button>
          </div>
        </div>
      )}

      {/* --- ACTION FOOTER & INPUT BAR --- */}
      <form
        onSubmit={handleChatSend}
        className="flex gap-1.5 sticky bottom-0 bg-stone-50 dark:bg-neutral-950/95 backdrop-blur pt-1 px-4 py-3 border-t border-stone-200 dark:border-neutral-800 max-w-md mx-auto w-full"
      >
        <input
          type="text"
          placeholder="Ask HR 360 Bot safety actions..."
          value={typedMessage}
          disabled={isChatLoading}
          onChange={(e) => setTypedMessage(e.target.value)}
          className="flex-1 text-xs px-3 py-2 rounded-xl border border-stone-200 dark:border-neutral-850 bg-white dark:bg-neutral-900 focus:outline-none focus:border-[#038F8D] text-stone-800 dark:text-neutral-200 placeholder-stone-400 dark:placeholder-neutral-600 font-medium disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isChatLoading || !typedMessage.trim()}
          className="bg-gradient-to-r from-[#038F8D] to-[#024645] hover:from-[#027574] hover:to-[#01302e] text-white px-4 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-40 transition-all cursor-pointer active:scale-95 font-extrabold text-[10px]"
        >
          📤 Send
        </button>
      </form>
    </div>
  );
};

export default Chatbot;
