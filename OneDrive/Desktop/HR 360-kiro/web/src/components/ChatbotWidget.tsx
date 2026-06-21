import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import toast from 'react-hot-toast';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your HR Crisis 360 safety chatbot. Ask me any questions about disasters, workplace threats, or HR protocols!',
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to latest message when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto scroll to bottom when chat window opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 0);
    }
  }, [isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Simulate bot response
      await new Promise((resolve) => setTimeout(resolve, 1200));

      let botReply =
        '🛡️ Thank you for reaching out. Based on your safety protocols, here is your action response:\n\n';

      if (userMessage.toLowerCase().includes('earthquake')) {
        botReply +=
          '🌋 **Earthquake Response (Drop, Cover, Hold)**:\n1. Immediately seek shelter under sturdy office frames.\n2. Keep away from glass windows, overhead cabinets, and heavy server racks.\n3. Wait for the safety team\'s whistle signal before evacuating.';
      } else if (
        userMessage.toLowerCase().includes('active') ||
        userMessage.toLowerCase().includes('shooter') ||
        userMessage.toLowerCase().includes('threat')
      ) {
        botReply +=
          '🔫 **Active Threat Lockdown Response (Run, Hide, Fight)**:\n1. Lock key access points and move away from glass doors.\n2. Put devices on absolute silence mode.\n3. Await official Safety Officer clearance before releasing locks.';
      } else if (
        userMessage.toLowerCase().includes('strike') ||
        userMessage.toLowerCase().includes('transport') ||
        userMessage.toLowerCase().includes('wfh')
      ) {
        botReply +=
          '💻 **Transport Strike WFH Mandate**:\nAs per HR Policy Section 8.4, if active strikes impede regular transit, remote operations are authorized. Coordinate with your Supervisor to register your off-site status.';
      } else {
        botReply +=
          '🛡️ Your Safety Officers are monitoring your status. Please report your wellness via the Check-In feature in the main dashboard.';
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: botReply }]);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-[#038F8D] to-[#024645] hover:from-[#02706e] hover:to-[#01302e] text-white shadow-lg hover:shadow-xl transition flex items-center justify-center z-40"
        title="Open Chatbot"
      >
        <MessageSquare size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-8 right-8 w-96 bg-white dark:bg-neutral-900 rounded-2xl border border-stone-200 dark:border-neutral-800 shadow-2xl flex flex-col z-50 h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#038F8D] to-[#024645] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">HR Crisis 360 Advisor</h3>
          <p className="text-xs opacity-90">Safety Agent</p>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white dark:bg-neutral-900/20 rounded-lg transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                  isUser
                    ? 'bg-[#038F8D] text-white rounded-br-none'
                    : 'bg-stone-200 dark:bg-neutral-800 text-black dark:text-white rounded-bl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 dark:bg-neutral-800 px-4 py-2 rounded-lg text-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-[#038F8D] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#038F8D] rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-[#038F8D] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-stone-200 dark:border-neutral-800 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask a safety question..."
            className="flex-1 px-3 py-2 border border-stone-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:border-[#038F8D] text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-2 bg-[#038F8D] hover:bg-[#02706e] text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatbotWidget;

