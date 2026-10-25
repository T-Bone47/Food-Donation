"use client";

import { useState, useRef, useEffect } from 'react';

// --- Helper Components ---

// Icon for the chat bubble
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

// Icon for closing the chat window
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
);

// Icon for the send button
const SendIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
    </svg>
);


// --- Main Chatbot Component ---

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ type: 'user' | 'bot'; text: string }[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Automatically scroll to the latest message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add a welcome message when the chat opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([{ type: 'bot', text: "Hello! I'm the FoodShare assistant. Ask me about donating, volunteering, or NGO verification. 😊" }]);
        }
    }, [isOpen, messages.length]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const userMessage = { type: 'user' as 'user', text: inputValue };
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const chatbotUrl =
                process.env.NEXT_PUBLIC_CHATBOT_URL || 'http://localhost:5001';
            const response = await fetch(`${chatbotUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: inputValue }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(
                    data.error || `Chatbot request failed: ${response.status}`
                );
            }

            const botMessage = { type: 'bot' as 'bot', text: data.response || "Sorry, I encountered an issue." };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Fetch Error:", error);
            const errorMessage = { type: 'bot' as 'bot', text: "I'm having trouble connecting to my brain right now. Please make sure the AI server is running or try again later." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-5 w-80 h-[450px] bg-white rounded-lg shadow-2xl flex flex-col z-50">
                    {/* Header */}
                    <div className="bg-green-600 text-white p-3 rounded-t-lg flex justify-between items-center">
                        <h3 className="font-bold text-lg">FoodShare Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-green-700 p-1 rounded-full">
                            <CloseIcon />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex mb-3 ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`px-4 py-2 rounded-xl max-w-xs ${msg.type === 'user' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start mb-3">
                               <div className="px-4 py-2 rounded-xl bg-gray-200 text-gray-800">
                                   <span className="animate-pulse">● ● ●</span>
                               </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Form */}
                    <form onSubmit={handleSendMessage} className="p-3 border-t bg-white rounded-b-lg flex items-center">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask a question..."
                            maxLength={500}
                            className="flex-1 rounded-lg border-gray-300 focus:ring-green-500 focus:border-green-500 p-2"
                            disabled={isLoading}
                        />
                        <button type="submit" className="ml-2 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-400" disabled={isLoading}>
                            <SendIcon />
                        </button>
                    </form>
                </div>
            )}

            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-5 right-5 bg-green-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-green-700 focus:outline-none z-50"
            >
                {isOpen ? <CloseIcon /> : <ChatIcon />}
            </button>
        </>
    );
}