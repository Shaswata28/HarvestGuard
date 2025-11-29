/**
 * AI Assistant Component (Fluid UI Version)
 * * Provides a voice and text-based interface with enhanced animations and visual polish.
 * Features:
 * - Glassmorphism UI (Blur effects)
 * - Smooth message entry animations
 * - "Thinking" state indicator
 * - Pulse effects for voice activity
 * - Native Google Voice support for Bangla
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send, X, MessageSquare, StopCircle, Sparkles, User, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IWindow extends Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isUser: boolean }[]>([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // New state for UI fluidity
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll with smooth behavior
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Load voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = synth.getVoices();
      setVoices(availableVoices);
    };
    loadVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'bn-BD';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onend = () => setIsListening(false);

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleUserQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('মাইক্রোফোন অনুমতি দিন');
        } else {
          setError('আবার চেষ্টা করুন');
        }
      };
    }
  }, []);

  const speak = (text: string) => {
    if (synth.speaking) {
      synth.cancel();
    }
    if (!text) {
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    
    // High-quality voice selection
    let selectedVoice = voices.find(v => v.lang.includes('bn') && v.name.includes('Google'));
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang === 'bn-BD');
    if (!selectedVoice) selectedVoice = voices.find(v => v.lang.includes('bn'));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = 'bn-BD';
    }

    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  };

  const handleUserQuery = async (query: string) => {
    if (!query.trim()) return;

    setMessages(prev => [...prev, { text: query, isUser: true }]);
    setInputText('');
    setIsThinking(true); // Start thinking animation

    // Logic for responses
    let responseText = '';
    const normalized = query.toLowerCase().trim();

    if (normalized.includes('আবহাওয়া') || normalized.includes('weather')) {
      responseText = 'আজকের আকাশ পরিষ্কার। তাপমাত্রা ৩০ ডিগ্রি সেলসিয়াস।';
    } else if (normalized.includes('ধান') || normalized.includes('crop')) {
      responseText = 'আপনার ধান এখন পাকার পর্যায়ে আছে। পোকার আক্রমণ নেই।';
    } else if (normalized.includes('গুদাম') || normalized.includes('storage')) {
      responseText = 'গুদামে আর্দ্রতা কম রাখুন এবং মাচা ব্যবহার করুন।';
    } else if (normalized.includes('কাটব') || normalized.includes('harvest')) {
      responseText = 'আগামী ৭-১০ দিনের মধ্যে ধান কাটার উপযুক্ত সময়।';
    } else {
      responseText = 'দুঃখিত, আমি এই প্রশ্নের উত্তর জানি না। তবে আমি শিখছি।';
    }

    // Artificial delay for "fluidity" (feels more natural)
    setTimeout(() => {
      setIsThinking(false);
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      speak(responseText);
    }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserQuery(inputText);
  };

  // Floating Button (Collapsed State)
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-110 hover:shadow-green-500/50 transition-all duration-300 z-50 animate-in zoom-in"
      >
        <MessageSquare className="h-7 w-7 fill-current" />
      </Button>
    );
  }

  // Expanded Chat Interface
  return (
    <Card className="fixed bottom-24 right-4 w-[90vw] max-w-[380px] h-[550px] shadow-2xl z-50 flex flex-col border-white/20 backdrop-blur-md bg-white/95 animate-in slide-in-from-bottom-10 fade-in duration-300 rounded-2xl overflow-hidden ring-1 ring-black/5">
      
      {/* Header with Gradient */}
      <div className="p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="h-5 w-5 text-yellow-200" />
          </div>
          <div>
            <h3 className="font-bold text-md leading-none">কৃষি সহকারী</h3>
            <p className="text-[10px] text-green-100 opacity-90 mt-1">আপনার ব্যক্তিগত এআই বিশেষজ্ঞ</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="h-8 w-8 text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 bg-slate-50/50">
        <div className="space-y-4 pb-2">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full mt-10 space-y-4 opacity-80">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <Bot className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-600 text-center px-4">
                হ্যালো! আমি আপনাকে কৃষি বিষয়ক যেকোনো তথ্য দিয়ে সাহায্য করতে পারি।
              </p>
              <div className="flex flex-wrap justify-center gap-2 px-2">
                {['আজকের আবহাওয়া?', 'ধানের অবস্থা?', 'কবে কাটব?'].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleUserQuery(q)}
                    className="text-xs bg-white border border-green-200 px-3 py-1.5 rounded-full text-green-700 hover:bg-green-50 transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Loop */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex w-full animate-in slide-in-from-bottom-2 fade-in duration-300",
                msg.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn("flex max-w-[85%] gap-2", msg.isUser ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar Icons */}
                <div className={cn(
                  "h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-1",
                  msg.isUser ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                  {msg.isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 text-sm shadow-sm leading-relaxed",
                    msg.isUser
                      ? "bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-gray-800 rounded-tl-none"
                  )}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {/* Thinking Indicator */}
          {isThinking && (
            <div className="flex w-full justify-start animate-in fade-in duration-300">
              <div className="flex max-w-[85%] gap-2">
                <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5 text-green-600" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-gray-100">
        {error && (
          <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs rounded-lg text-center animate-pulse border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()}
            className={cn(
              "shrink-0 h-11 w-11 rounded-full border-2 transition-all duration-300 shadow-sm", 
              isListening 
                ? "border-red-500 bg-red-50 text-red-600 animate-pulse scale-105" 
                : "border-gray-200 hover:border-green-500 hover:text-green-600"
            )}
          >
            <Mic className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="প্রশ্ন লিখুন..."
              className="w-full rounded-full pl-4 pr-4 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500/20 bg-gray-50/50 focus:bg-white transition-all"
            />
          </div>
          
          {inputText.trim() ? (
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0 h-11 w-11 rounded-full bg-green-600 hover:bg-green-700 shadow-md transition-all hover:scale-105"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
             isSpeaking ? (
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => speak('')} 
                className="shrink-0 h-11 w-11 rounded-full border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                <StopCircle className="h-6 w-6 text-red-500" />
              </Button>
             ) : null
          )}
        </form>
      </div>
    </Card>
  );
};

export default AIAssistant;