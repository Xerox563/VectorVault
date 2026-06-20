'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  FileText, 
  Plus, 
  Database, 
  Loader2, 
  FileUp,
  History,
  Info,
  ChevronRight,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const API_BASE_URL = 'http://localhost:8001';

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  chunks_retrieved?: number;
}

export default function VectorVaultDark() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Welcome to the Vault. I have processed your request. How can I assist you with your documents today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    fetchSources();
  }, []);

  const fetchSources = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/query/sources`);
      setSources(response.data.sources);
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_BASE_URL}/ingest/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUploadStatus('success');
      fetchSources();
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/query/ask`, {
        question: userMessage,
        top_k: 5
      });

      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: response.data.answer,
        sources: response.data.sources_used,
        chunks_retrieved: response.data.chunks_retrieved
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'System Error: Authentication required or connection failed. Please verify your OpenRouter key.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0f1115] text-[#f0f0f0] font-sans">
      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className="w-80 bg-[#161920] border-r border-[#2d333b] flex flex-col z-20"
      >
        <div className="p-8 flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-900/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">VectorVault</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Core Active</span>
            </div>
          </div>
        </div>

        <div className="px-6 mb-8">
          <motion.label 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[#30363d] rounded-2xl cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all group relative overflow-hidden"
          >
            <div className="flex flex-col items-center justify-center z-10">
              {isUploading ? (
                <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-[#1c2128] flex items-center justify-center mb-3 group-hover:bg-orange-500 transition-colors">
                    <FileUp className="w-6 h-6 text-gray-400 group-hover:text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-300">Upload Intelligence</p>
                  <p className="text-[10px] text-gray-500 mt-1 font-bold uppercase tracking-tighter">PDF • TXT • DOCX</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" disabled={isUploading} />
            
            <AnimatePresence>
              {uploadStatus === 'success' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-green-500/10 flex items-center justify-center backdrop-blur-sm"
                >
                  <span className="text-green-500 font-bold text-sm">Ingestion Complete</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.label>
        </div>

        <div className="flex-1 overflow-y-auto px-6 space-y-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                <Database className="w-3 h-3" />
                Knowledge Base
              </div>
              <span className="text-[10px] bg-[#1c2128] px-2 py-0.5 rounded-full text-gray-400 font-bold">{sources.length}</span>
            </div>
            <div className="space-y-1">
              {sources.length === 0 ? (
                <div className="p-4 rounded-xl border border-[#2d333b] border-dashed text-center">
                  <p className="text-xs text-gray-500 font-medium italic">Empty Vault</p>
                </div>
              ) : (
                sources.map((source, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#1c2128] transition-all cursor-pointer group border border-transparent hover:border-[#30363d]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#1c2128] flex items-center justify-center group-hover:bg-orange-500/10 transition-colors">
                      <FileText className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-xs font-bold text-gray-400 group-hover:text-white truncate flex-1">{source}</span>
                    <ChevronRight className="w-3 h-3 text-gray-600 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all" />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#2d333b] bg-[#1c2128]/50 space-y-2">
          <button className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:text-white hover:bg-[#1c2128] transition-all text-sm font-bold">
            <LayoutDashboard className="w-4 h-4" />
            Analytics
          </button>
          <button className="flex items-center gap-3 w-full p-3 rounded-xl text-gray-400 hover:text-white hover:bg-[#1c2128] transition-all text-sm font-bold">
            <Settings className="w-4 h-4" />
            Vault Settings
          </button>
        </div>
      </motion.aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative bg-[#0f1115]">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0f1115] to-transparent z-10 pointer-events-none" />
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-8 py-12 space-y-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto w-full space-y-10">
            {messages.map((msg, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                key={i} 
                className={cn(
                  "flex flex-col w-full",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}
              >
                <div className={cn(
                  "chat-bubble group relative",
                  msg.role === 'user' ? "user-bubble" : "ai-bubble"
                )}>
                  {msg.role === 'ai' && (
                    <div className="absolute -top-3 -left-3 w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center shadow-lg">
                      <Zap className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-[#30363d]">
                      <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">
                        <Info className="w-3 h-3 text-orange-500" />
                        Verified Sources
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((s, si) => (
                          <motion.span 
                            whileHover={{ scale: 1.05 }}
                            key={si} 
                            className="px-3 py-1.5 bg-[#0f1115] text-orange-500 rounded-lg text-[10px] font-bold border border-[#30363d] shadow-sm flex items-center gap-2"
                          >
                            <FileText className="w-3 h-3" />
                            {s}
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="ai-bubble chat-bubble flex items-center gap-4 bg-[#1c2128]">
                  <div className="flex gap-1">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                  </div>
                  <span className="text-sm text-gray-400 font-bold uppercase tracking-tighter">Scanning Vector Space...</span>
                </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Container */}
        <div className="p-8 md:p-12">
          <div className="max-w-4xl mx-auto relative">
            <form 
              onSubmit={handleSendMessage}
              className="relative"
            >
              <div className="absolute inset-0 bg-orange-600/20 blur-2xl rounded-3xl -z-10 opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Query the Knowledge Vault..."
                className="w-full p-6 pr-20 rounded-3xl bg-[#1c2128] border border-[#30363d] focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/5 outline-none transition-all shadow-2xl text-[16px] text-white placeholder-gray-500 resize-none min-h-[80px]"
                rows={1}
              />
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute right-4 bottom-4 p-4 rounded-2xl transition-all shadow-lg",
                  input.trim() && !isLoading 
                    ? "bg-orange-600 text-white shadow-orange-600/20" 
                    : "bg-[#2d333b] text-gray-500 cursor-not-allowed"
                )}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </form>
            <div className="flex items-center justify-between mt-6 px-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-green-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Local-First Privacy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-orange-500" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fast Ingestion</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">VectorVault v1.0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
