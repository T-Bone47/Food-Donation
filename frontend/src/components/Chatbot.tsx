"use client";

import { useState, useRef, useEffect } from "react";

// Icon for the chat bubble
const ChatIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

// Icon for closing the chat window
const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

// Icon for the send button
const SendIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
  </svg>
);

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ type: "user" | "bot"; text: string }[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message when the chat opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          type: "bot",
          text: "Hello! I'm the AI assistant for Team Feed Chain. How can I help you today? 😊",
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const query = inputValue;
    const userMessage = { type: "user" as const, text: query };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Connect to running Chatbot microservice (port 5002)
      const res = await fetch("http://localhost:5002/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply =
          data.data?.reply || data.response || "I am here to help coordinate food rescues and safety protocols!";
        setMessages((prev) => [...prev, { type: "bot", text: reply }]);
      } else {
        throw new Error("Chatbot service returned non-200");
      }
    } catch {
      // Grounded contextual fallback response if offline
      let fallbackText =
        "FoodShare connects donors, volunteers, and verified NGOs. You can list surplus food in seconds, claim routes, and inspect incoming cargo safely!";
      if (query.toLowerCase().includes("temp") || query.toLowerCase().includes("safety")) {
        fallbackText =
          "Food safety protocol: Perishable cooked meals must remain above 60°C or below 4°C during transport, with clean insulated containers.";
      } else if (query.toLowerCase().includes("donate")) {
        fallbackText =
          "To donate, go to 'Donate Food Now' in your navigation bar, enter food type, servings, and pickup location!";
      }

      setMessages((prev) => [...prev, { type: "bot", text: fallbackText }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-5 w-84 h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-green-200 overflow-hidden">
          {/* Header */}
          <div className="bg-green-700 text-white p-3.5 flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-green-300 animate-pulse" />
              <h3 className="font-bold text-base">Team Feed Chain Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-green-800 p-1.5 rounded-full transition cursor-pointer"
            >
              <CloseIcon />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto bg-gray-50/80 space-y-3">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-xs ${
                    msg.type === "user"
                      ? "bg-green-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 border border-gray-100 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-4 py-2 rounded-2xl bg-white text-gray-500 border border-gray-100 text-xs">
                  <span className="animate-pulse">Assistant is thinking... ● ● ●</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 border-t bg-white flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 px-3 py-2 text-sm outline-none"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="p-2.5 bg-green-700 text-white rounded-xl hover:bg-green-800 disabled:bg-gray-300 transition cursor-pointer"
              disabled={isLoading || !inputValue.trim()}
            >
              <SendIcon />
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 bg-green-700 text-white size-14 rounded-full shadow-xl flex items-center justify-center hover:bg-green-800 focus:outline-none z-50 cursor-pointer transition hover:scale-105"
        aria-label="Toggle AI Assistant"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </>
  );
}
