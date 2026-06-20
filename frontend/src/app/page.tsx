'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, 
  Upload, 
  FileText, 
  Plus, 
  MessageSquare, 
  Database, 
  Loader2, 
  AlertCircle,
  FileUp,
  History,
  Info
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for Tailwind class merging
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8001';

interface Message {
  role: 'user' | 'ai';
  content: string;
  sources?: string[];
  chunks_retrieved?: number;
}

interface Source {
  filename: string;
}

export default function VectorVaultUI() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: 'Hello! I am VectorVault. Upload your documents and ask me anything about them.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sources, setSources] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch ingested sources on mount
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
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
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
      console.error('Query error:', error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: error.response?.data?.detail || 'Sorry, I encountered an error while processing your request. Please make sure your API keys are configured.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#fdfcfb] text-[#1a1a1a]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-gray-200 bg-white flex flex-col hidden md:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
          <h1 className="text-xl font-bold tracking-tight">VectorVault</h1>
        </div>

        <div className="px-4 mb-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all group">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              ) : (
                <>
                  <FileUp className="w-8 h-8 text-gray-400 group-hover:text-orange-600 mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Upload Document</p>
                  <p className="text-xs text-gray-400 mt-1">PDF or TXT</p>
                </>
              )}
            </div>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" disabled={isUploading} />
          </label>
          {uploadStatus === 'success' && <p className="text-xs text-green-600 mt-2 text-center font-medium">Upload successful!</p>}
          {uploadStatus === 'error' && <p className="text-xs text-red-600 mt-2 text-center font-medium">Upload failed.</p>}
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            <Database className="w-3 h-3" />
            Ingested Sources
          </div>
          <div className="space-y-2">
            {sources.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-2">No documents yet</p>
            ) : (
              sources.map((source, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium truncate flex-1">{source}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 text-gray-500 hover:text-[#1a1a1a] cursor-pointer transition-colors">
            <History className="w-5 h-5" />
            <span className="text-sm font-medium">History</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative bg-white md:bg-transparent">
        {/* Header (Mobile) */}
        <header className="md:hidden p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-orange-600 rounded flex items-center justify-center text-white font-bold text-xs">V</div>
            <h1 className="font-bold">VectorVault</h1>
          </div>
          <label className="p-2 text-orange-600">
            <Plus className="w-6 h-6" />
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.txt" />
          </label>
        </header>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          <div className="max-w-3xl mx-auto space-y-8">
            {messages.map((msg, i) => (
              <div key={i} className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}>
                <div className={cn(
                  "chat-bubble shadow-sm",
                  msg.role === 'user' ? "user-bubble" : "ai-bubble"
                )}>
                  <div className="text-[15px] whitespace-pre-wrap">{msg.content}</div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tight mb-2">
                        <Info className="w-3 h-3" />
                        Sources used
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {msg.sources.map((s, si) => (
                          <span key={si} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-[10px] font-bold border border-orange-100">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="ai-bubble chat-bubble flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-orange-600 animate-spin" />
                  <span className="text-sm text-gray-500 italic">Vault is thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-8 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleSendMessage}
              className="relative group"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Ask VectorVault anything..."
                className="w-full p-4 pr-14 rounded-2xl border border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all shadow-lg shadow-black/5 resize-none min-h-[60px] max-h-48 text-[15px]"
                rows={1}
              />
              <button 
                type="submit"
                disabled={!input.trim() || isLoading}
                className={cn(
                  "absolute right-3 bottom-3 p-2 rounded-xl transition-all",
                  input.trim() && !isLoading 
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20 hover:bg-orange-700" 
                    : "bg-gray-100 text-gray-400"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-center text-[10px] text-gray-400 mt-4 font-medium uppercase tracking-widest">
              Powered by VectorVault RAG Engine
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
