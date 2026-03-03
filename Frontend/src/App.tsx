import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { 
  Send, Paperclip, Mic, Settings, Search, Plus, Moon, Sun, 
  Database, MessageSquare, ChevronRight, User, Bot, Trash2,
  FileText, Headphones, BarChart, ChevronLeft, Loader2, Upload,
  Copy, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Lenis from 'lenis';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { chatService, ChatResponse, Source } from './services/api';

interface Message {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: Date;
  metadata?: {
    score?: number;
    source?: string;
    sources?: Source[];
  };
}

interface ChatHistory {
  id: string;
  title: string;
  date: Date;
}

const CodeBlock = ({ node, inline, className, children, theme, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match) {
    return (
      <div className="code-block-wrapper">
        <div className="code-header">
          <span className="code-lang">{match[1]}</span>
          <button onClick={handleCopy} className="copy-btn">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        <SyntaxHighlighter
          style={theme === 'dark' ? vscDarkPlus : oneLight}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      content: 'Hello, I am the Talos Enterprise Assistant. I can analyze your PDFs, CSVs, and Audio files. How can I assist you today?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [history] = useState<ChatHistory[]>([
    { id: '1', title: 'Q3 Financial Analysis', date: new Date() },
    { id: '2', title: 'HR Policy Updates', date: new Date(Date.now() - 86400000) },
    { id: '3', title: 'Board Meeting Transcript', date: new Date(Date.now() - 172800000) },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bulkFileInputRef = useRef<HTMLInputElement>(null);
  const lenisRef = useRef<Lenis | null>(null);

  useLayoutEffect(() => {
    if (scrollRef.current) {
      const lenis = new Lenis({
        wrapper: scrollRef.current,
        content: scrollRef.current.firstElementChild as HTMLElement,
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });

      lenisRef.current = lenis;

      function raf(time: number) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);

      return () => {
        lenis.destroy();
      };
    }
  }, []);

  const scrollToBottom = () => {
    if (lenisRef.current && scrollRef.current) {
      lenisRef.current.scrollTo(scrollRef.current.scrollHeight, {
        duration: 1.5,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const query = input.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const result: ChatResponse = await chatService.sendMessage(query);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: result.response,
        timestamp: new Date(),
        metadata: {
          score: result.sources[0]?.score,
          source: result.sources[0]?.metadata?.source || 'Knowledge Base',
          sources: result.sources
        }
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: "I'm sorry, I encountered an error while processing your request. Please ensure the backend server is running.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await uploadSingleFile(file);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);
    setMessages(prev => [...prev, {
      id: `bulk-upload-start-${Date.now()}`,
      role: 'bot',
      content: `Starting bulk upload of ${filesArray.length} files...`,
      timestamp: new Date(),
    }]);

    for (const file of filesArray) {
      await uploadSingleFile(file);
    }
  };

  const uploadSingleFile = async (file: File) => {
    const uploadStartedMsg: Message = {
      id: `upload-${Date.now()}`,
      role: 'bot',
      content: `Uploading and indexing "${file.name}"...`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, uploadStartedMsg]);

    try {
      await chatService.uploadFile(file);
      setMessages(prev => [...prev, {
        id: `upload-success-${Date.now()}`,
        role: 'bot',
        content: `Successfully indexed "${file.name}". You can now ask questions about its content.`,
        timestamp: new Date(),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: `upload-error-${Date.now()}`,
        role: 'bot',
        content: `Failed to upload "${file.name}". Please try again.`,
        timestamp: new Date(),
      }]);
    }
  };

  return (
    <div className="app-container">
      <div className="decorative-blob-1" />
      <div className="decorative-blob-2" />

      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.aside 
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
            className="sidebar"
          >
            <div className="sidebar-header">
              <div className="logo-box">T</div>
              <span className="brand-title">Talos</span>
            </div>

            <button className="new-chat-btn" onClick={() => setMessages([messages[0]])}>
              <Plus size={18} />
              New Conversation
            </button>

            <button className="bulk-upload-btn" onClick={() => bulkFileInputRef.current?.click()}>
              <Upload size={18} />
              Bulk Upload
            </button>
            <input 
              type="file" 
              ref={bulkFileInputRef} 
              style={{ display: 'none' }} 
              multiple 
              accept=".pdf,.csv,.wav,.mp3"
              onChange={handleBulkUpload}
            />

            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '1px', padding: '10px 24px' }}>
                Recent Activity
              </div>
              {history.map(item => (
                <div key={item.id} className="history-item">
                  <MessageSquare size={16} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-glass)' }}>
              <button className="sidebar-action" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Database size={18} />
                <span style={{ fontSize: '14px' }}>Knowledge Base</span>
              </button>
              <button className="sidebar-action" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', borderRadius: '10px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <Settings size={18} />
                <span style={{ fontSize: '14px' }}>Settings</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <main className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="icon-btn"
            >
              <motion.div animate={{ rotate: isSidebarOpen ? 0 : 180 }}>
                <ChevronLeft size={20} />
              </motion.div>
            </button>
            <div className="header-title">Enterprise Document AI</div>
          </div>

          <div className="header-right">
            <div className="status-badge">
              <div className="status-dot" />
              Gemini 2.0
            </div>
            <button onClick={toggleTheme} className="icon-btn">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </header>

        <div className="chat-container">
          <div className="chat-scroll-area" ref={scrollRef}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`message-wrapper ${msg.role}`}
                  >
                    <div className={`avatar ${msg.role}`}>
                      {msg.role === 'user' ? 'U' : 'T'}
                    </div>
                    
                    <div className="message-content">
                      <div className="bubble">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: (props) => <CodeBlock {...props} theme={theme} />,
                            ul: ({ children }) => <ul className="markdown-list">{children}</ul>,
                            ol: ({ children }) => <ol className="markdown-list">{children}</ol>,
                            table: ({ children }) => (
                              <div className="table-wrapper">
                                <table className="markdown-table">{children}</table>
                              </div>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      {msg.metadata && msg.metadata.source && (
                        <div className="metadata">
                          <div className="doc-tag">
                            {msg.metadata.source.toLowerCase().endsWith('.pdf') && <FileText size={12} />}
                            {msg.metadata.source.toLowerCase().endsWith('.csv') && <BarChart size={12} />}
                            {(msg.metadata.source.toLowerCase().endsWith('.wav') || msg.metadata.source.toLowerCase().endsWith('.mp3')) && <Headphones size={12} />}
                            <span>{msg.metadata.source}</span>
                          </div>
                          {msg.metadata.score && (
                            <>
                              <span>•</span>
                              <span>Confidence {(msg.metadata.score * 100).toFixed(1)}%</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="message-wrapper bot"
                  >
                    <div className="avatar bot">T</div>
                    <div className="message-content">
                      <div className="bubble" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Loader2 size={18} className="animate-spin text-[var(--accent)]" />
                        <span>Analysing documents...</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="input-area">
            <div className="input-container">
              <button 
                className="action-btn" 
                title="Upload PDF, CSV or Audio"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip size={20} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                style={{ display: 'none' }}
                accept=".pdf,.csv,.wav,.mp3"
                onChange={handleFileUpload}
              />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInput}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Message Talos..."
                className="textarea"
                rows={1}
                disabled={isLoading}
              />
              <button className="action-btn" title="Voice Input">
                <Mic size={20} />
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`send-btn ${input.trim() && !isLoading ? 'active' : ''}`}
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '12px' }}>
              FAISS-powered Multi-modal RAG. Verify sensitive enterprise data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
