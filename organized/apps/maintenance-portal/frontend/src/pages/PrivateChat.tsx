import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiArrowLeft, FiSend, FiShield, FiHeart, FiMessageCircle, FiLock } from 'react-icons/fi';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const PrivateChat: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hello ${user?.firstName}, I'm your confidential AI support counselor. This is a completely private and secure space where you can discuss anything that's on your mind - work stress, personal concerns, mental health, or just need someone to talk to. Everything shared here is confidential and won't be shared with your employer or colleagues. How can I support you today?`,
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isDarkMode = localStorage.getItem('sms_theme') !== 'light';

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll to bottom when messages change (but not on initial mount)
  useEffect(() => {
    if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const quickTopics = [
    { icon: '😔', label: 'Feeling Isolated', prompt: "I'm feeling isolated being away from home" },
    { icon: '😰', label: 'Work Stress', prompt: "I'm feeling stressed about work demands" },
    { icon: '😴', label: 'Sleep Issues', prompt: "I'm having trouble sleeping on rotation" },
    { icon: '🏠', label: 'Missing Family', prompt: "I'm missing my family and it's affecting me" },
    { icon: '⚠️', label: 'Safety Concerns', prompt: "I have safety concerns I need to discuss" },
    { icon: '💭', label: 'Just Talk', prompt: "I just need someone to talk to" }
  ];

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(inputValue),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 2000);
  };

  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('isolated') || lowerMessage.includes('alone') || lowerMessage.includes('lonely')) {
      return "I understand how challenging it can be to feel isolated, especially when you're away from your support network. Many offshore workers experience these feelings. Let's talk about what's making you feel most isolated right now, and explore some strategies that have helped others in similar situations. Remember, reaching out like this is already a positive step.";
    } else if (lowerMessage.includes('stress') || lowerMessage.includes('pressure') || lowerMessage.includes('overwhelmed')) {
      return "Work stress in offshore environments can be particularly intense. I hear that you're feeling overwhelmed. Can you tell me more about what specific aspects are causing you the most stress? Whether it's workload, safety concerns, team dynamics, or something else, we can work through it together and find healthy coping strategies.";
    } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      return "Sleep issues are very common in offshore work due to swing patterns, noise, and being away from your normal environment. Poor sleep can affect both your wellbeing and safety. Let's discuss your sleep patterns and explore some techniques that might help. What's your current swing pattern, and when do you find it hardest to sleep?";
    } else if (lowerMessage.includes('family') || lowerMessage.includes('miss') || lowerMessage.includes('home')) {
      return "Missing family is one of the hardest parts of offshore work. Your feelings are completely valid and shared by many of your colleagues. While we can't change the distance, we can work on ways to maintain connection and manage these difficult emotions. How often are you able to contact your family, and what aspects of being away are the hardest for you?";
    } else if (lowerMessage.includes('safety') || lowerMessage.includes('dangerous') || lowerMessage.includes('accident')) {
      return "Safety concerns should always be taken seriously. I appreciate you trusting me with this. While I'm here for emotional support, if there's an immediate safety issue, please also report it through the appropriate channels. Can you tell me more about what's concerning you? Sometimes talking through these worries can help clarify what actions might be needed.";
    } else {
      return "Thank you for sharing that with me. I'm here to listen and support you through whatever you're experiencing. Could you tell me a bit more about what's on your mind? Remember, this is a safe space where you can express yourself freely without judgment.";
    }
  };

  const handleQuickTopic = (prompt: string) => {
    setInputValue(prompt);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-purple-950 to-gray-900' : 'bg-gradient-to-br from-purple-50 to-gray-100'}`}>
      {/* Header */}
      <div className={`${isDarkMode ? 'bg-purple-900/20 border-b border-purple-500/30' : 'bg-white border-b border-purple-200'} sticky top-0 z-40`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard/technician')}
                className={`flex items-center space-x-2 ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
              <div className="flex items-center space-x-3">
                <FiShield className="w-6 h-6 text-purple-500" />
                <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Private Support Chat</h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <FiLock className="w-4 h-4 text-purple-500" />
              <span className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* Privacy Notice */}
        <div className={`mb-4 ${isDarkMode ? 'bg-purple-900/20 border border-purple-500/30' : 'bg-purple-100 border border-purple-300'} rounded-lg p-4`}>
          <div className="flex items-start space-x-3">
            <FiShield className="w-5 h-5 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className={`font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'} mb-1`}>Your Privacy is Protected</p>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                This conversation is completely confidential. No records are kept, and nothing is shared with your employer, colleagues, or anyone else. This is your safe space.
              </p>
            </div>
          </div>
        </div>

        {/* Quick Topics */}
        <div className="mb-6">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Quick topics:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quickTopics.map((topic, index) => (
              <button
                key={index}
                onClick={() => handleQuickTopic(topic.prompt)}
                className={`${
                  isDarkMode 
                    ? 'bg-gray-800 border border-gray-700 hover:border-purple-500' 
                    : 'bg-white border border-gray-200 hover:border-purple-400'
                } rounded-lg p-3 transition-all duration-300 hover:scale-105`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{topic.icon}</span>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{topic.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className={`${isDarkMode ? 'bg-gray-900/50' : 'bg-white'} rounded-xl border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4 mb-4`} style={{ minHeight: '400px' }}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-3xl ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
                  <div className="flex items-start space-x-2">
                    {message.sender === 'ai' && (
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <FiHeart className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.sender === 'user'
                          ? isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                          : isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' 
                          ? 'text-purple-200' 
                          : isDarkMode ? 'text-gray-500' : 'text-gray-400'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                    <FiHeart className="w-4 h-4 text-white" />
                  </div>
                  <div className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900/95' : 'bg-white/95'} backdrop-blur-sm border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} p-4`}>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message... Remember, this is completely confidential"
                className={`flex-1 px-4 py-3 ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                } border rounded-lg focus:outline-none focus:border-purple-500`}
              />
              <button
                type="submit"
                disabled={!inputValue.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <FiSend className="w-5 h-5" />
                <span>Send</span>
              </button>
            </form>
            
            <div className="mt-2 flex items-center justify-center space-x-2">
              <FiLock className="w-3 h-3 text-gray-500" />
              <p className="text-xs text-gray-500">Messages are encrypted and never stored or shared</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivateChat;