import React, { useState, useRef, useEffect } from 'react';
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Droplet, 
  ShieldCheck, 
  RotateCcw, 
  ChevronDown, 
  Bot, 
  User, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import './ReLoopChatbot.css';

const INITIAL_MESSAGES = [
  {
    id: 'welcome-1',
    sender: 'bot',
    text: "👋 **Welcome to ReLoop AI!**\n\nI am your 24/7 **Water Reuse & Quality Assistant**. Ask me anything about:\n• Finding & allocating recycled water\n• Water Quality parameters (pH, TDS, BOD, CPCB standards)\n• ReLoop Rescue™ 10 km emergency failover\n• Calculating your freshwater & cost savings",
    timestamp: 'Just now',
    suggestedQuestions: [
      "How do I request water?",
      "Do I need a Quality Check?",
      "What is ReLoop Rescue?",
      "How much can I save on water costs?"
    ]
  }
];

export default function ReLoopChatbot({ onNavigateTab }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setShowTooltip(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  // Client-side fallback in case of network interruption
  const getFallbackAnswer = (query) => {
    const q = query.toLowerCase();
    if (q.includes('request') || q.includes('order') || q.includes('find') || q.includes('buy')) {
      return {
        text: "### How to Request Water on ReLoop:\n1. Open the **Find Water** tab or scroll to **Available Water Sources**.\n2. Click **Request** on your chosen supplier (e.g. Factory A, STP Plant).\n3. Select your registered demand, required litres, and choose whether you need a **Quality Check**.\n4. Click **Confirm Matching & Routing** to dispatch your order!",
        actions: [{ label: "Open Find Water", tab: "find-water" }]
      };
    }
    if (q.includes('quality') || q.includes('test') || q.includes('tds') || q.includes('ph') || q.includes('verifier')) {
      return {
        text: "### Quality Check Guidelines 🧪\n• **Tested Parameters:** pH (6.5-8.5), TDS (<2100 mg/L), Turbidity, and BOD.\n• **Accredited Verification:** Verifiers inspect the batch and issue a digital CPCB-compliant certificate before tanker dispatch.\n• **When to choose it:** Highly recommended for landscaping, cooling towers, and commercial facilities.",
        actions: []
      };
    }
    if (q.includes('rescue') || q.includes('failover') || q.includes('backup') || q.includes('emergency')) {
      return {
        text: "### ReLoop Rescue™ Continuous Supply Shield 🛡️\nIf your primary water supplier experiences an unexpected outage or audit alert, **ReLoop Rescue** automatically detects it and re-routes your required supply to verified standby nodes within 10 km (e.g., Apex STP Basin, Tidel Tech Park) in seconds.",
        actions: [{ label: "View ReLoop Rescue", tab: "reloop-rescue" }]
      };
    }
    if (q.includes('price') || q.includes('cost') || q.includes('save') || q.includes('saving')) {
      return {
        text: "### Pricing & Savings 💰\n• Recycled water costs **₹180 - ₹220 / kL** vs **₹500 - ₹700 / kL** for fresh tanker water.\n• Users typically achieve **60% to 65% cost savings** while cutting deep groundwater extraction.",
        actions: [{ label: "View Impact Reports", tab: "impact-reports" }]
      };
    }
    return {
      text: `### Water Reuse Guide: "${query}"\nReLoop provides circular water distribution for commercial, industrial, and residential facilities across Chennai. You can source treated wastewater, manage demand quotas, and monitor ESG impact reports in real time.`,
      actions: [{ label: "Browse Suppliers", tab: "find-water" }]
    };
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/chatbot/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });

      if (!response.ok) {
        throw new Error('Server returned non-200');
      }

      const data = await response.json();
      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data.reply || "I am here to help you with all water reuse and quality questions!",
        actions: data.actions || [],
        suggestedQuestions: data.suggestedQuestions || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      // Graceful local fallback
      const fallback = getFallbackAnswer(text);
      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: fallback.text,
        actions: fallback.actions,
        suggestedQuestions: ["How do I request water?", "Do I need a Quality Check?"],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES);
  };

  // Helper to format basic markdown (bold, bullet points, headers)
  const formatMarkdown = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Header 3
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="msg-h4">{line.replace('### ', '')}</h4>;
      }
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        const itemText = line.replace(/^[•-]\s*/, '');
        return (
          <div key={idx} className="msg-bullet">
            <span className="bullet-dot">•</span>
            <span>{renderFormattedText(itemText)}</span>
          </div>
        );
      }
      // Numbered list
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={idx} className="msg-numbered">
            <span>{renderFormattedText(line)}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '6px' }} />;
      }
      // Normal paragraph
      return <p key={idx} className="msg-p">{renderFormattedText(line)}</p>;
    });
  };

  const renderFormattedText = (text) => {
    // Replace **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="reloop-chatbot-wrapper">
      {/* Tooltip hint on initial load */}
      {showTooltip && !isOpen && (
        <div className="chatbot-callout-hint" onClick={() => setIsOpen(true)}>
          <div className="hint-header">
            <Sparkles size={14} className="text-emerald-500" />
            <span>Have questions about water reuse?</span>
            <button
              className="hint-close-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowTooltip(false);
              }}
            >
              ×
            </button>
          </div>
          <p className="hint-body">Ask our AI Water Copilot anytime!</p>
        </div>
      )}

      {/* Floating Action Button */}
      {!isOpen && (
        <button
          className="chatbot-fab-btn"
          onClick={() => setIsOpen(true)}
          aria-label="Open ReLoop AI Chatbot"
          title="Open ReLoop Water Copilot"
        >
          <div className="fab-pulse-ring"></div>
          <div className="fab-icon-box">
            <Sparkles size={20} className="fab-sparkle" />
            <Droplet size={18} className="fab-droplet" />
          </div>
          <span className="fab-text">Ask ReLoop AI</span>
          <span className="fab-status-dot" title="Online 24/7"></span>
        </button>
      )}

      {/* Main Chatbot Panel */}
      {isOpen && (
        <div className="chatbot-dialog-panel">
          {/* Header */}
          <div className="chatbot-panel-header">
            <div className="header-bot-profile">
              <div className="bot-avatar-ring">
                <Bot size={20} />
                <span className="bot-online-indicator"></span>
              </div>
              <div>
                <div className="bot-title-row">
                  <h3 className="bot-name">ReLoop Water AI</h3>
                  <span className="bot-badge">Copilot</span>
                </div>
                <span className="bot-status-text">Online • Expert Water Assistant</span>
              </div>
            </div>

            <div className="header-control-buttons">
              <button
                className="btn-chat-tool"
                onClick={handleClearChat}
                title="Restart conversation"
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="btn-chat-tool"
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
              >
                <ChevronDown size={18} />
              </button>
              <button
                className="btn-chat-tool"
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="chatbot-messages-feed">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble-row ${msg.sender === 'user' ? 'row-user' : 'row-bot'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="bot-bubble-avatar">
                    <Droplet size={15} />
                  </div>
                )}

                <div className={`chat-bubble-content ${msg.sender === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
                  {msg.sender === 'bot' ? (
                    <div className="bot-markdown-wrap">{formatMarkdown(msg.text)}</div>
                  ) : (
                    <p className="user-text-content">{msg.text}</p>
                  )}

                  {/* Actions (if any) */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="msg-actions-row">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          className="msg-action-btn"
                          onClick={() => {
                            if (onNavigateTab && act.tab) {
                              onNavigateTab(act.tab);
                              setIsOpen(false);
                            }
                          }}
                        >
                          <span>{act.label}</span>
                          <ArrowRight size={13} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Suggested Question Chips (only on latest bot message) */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="suggested-questions-box">
                      <span className="suggested-label">Suggested:</span>
                      <div className="suggested-chips">
                        {msg.suggestedQuestions.map((qText, idx) => (
                          <button
                            key={idx}
                            className="chip-btn"
                            onClick={() => handleSendMessage(qText)}
                          >
                            {qText}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="msg-timestamp">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="chat-bubble-row row-bot">
                <div className="bot-bubble-avatar">
                  <Droplet size={15} />
                </div>
                <div className="chat-bubble-content bubble-bot typing-bubble">
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                  <span className="typing-dot"></span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="chatbot-input-bar">
            <input
              ref={inputRef}
              type="text"
              placeholder="Ask anything about water reuse, quality check..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="chat-text-input"
            />
            <button
              className={`chat-send-btn ${inputText.trim() ? 'active' : ''}`}
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
