/**
 * AI Assistant Component (Responsive Desktop & Mobile Version)
 * * Updates:
 * - Added md: and lg: breakpoints for container width/height.
 * - refined typography for larger screens.
 * - improved backdrop blur and shadow handling for desktop contexts.
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
  const [isThinking, setIsThinking] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

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
    setIsThinking(true); 

    let responseText = '';
    const normalized = query.toLowerCase().trim();

    if (normalized.includes('আবহাওয়া') || normalized.includes('weather')) {
      responseText = 'আজকের আকাশ পরিষ্কার। তাপমাত্রা ৩০ ডিগ্রি সেলসিয়াস।';
    } else if (normalized.includes('ধান') || normalized.includes('crop')) {
      responseText = 'আপনার ধান এখন পাকার পর্যায়ে আছে। পোকার আক্রমণ নেই।';
    } else if (normalized.includes('গুদাম') || normalized.includes('storage')) {
      responseText = 'গুদামে আর্দ্রতা কম রাখুন এবং মাচা ব্যবহার করুন।';
    } else if (normalized.includes('কাটব') || normalized.includes('harvest')) {
      responseText = 'আগামী ৭-১০ দিনের মধ্যে ধান কাটার উপযুক্ত সময়।';
    } else {
      responseText = 'দুঃখিত, আমি এই প্রশ্নের উত্তর জানি না। তবে আমি শিখছি।';
    }

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
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 h-14 w-14 md:h-16 md:w-16 rounded-full shadow-2xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:scale-110 hover:shadow-green-500/50 transition-all duration-300 z-50 animate-in zoom-in"
      >
        <MessageSquare className="h-7 w-7 md:h-8 md:w-8 fill-current" />
      </Button>
    );
  }

  // Expanded Chat Interface
  return (
    <Card className={cn(
      "fixed z-50 flex flex-col border-white/20 backdrop-blur-xl bg-white/95 shadow-2xl overflow-hidden ring-1 ring-black/5 rounded-2xl animate-in slide-in-from-bottom-10 fade-in duration-300",
      // Mobile positioning & Sizing
      "bottom-4 right-4 w-[calc(100vw-32px)] max-w-[380px] h-[550px]", 
      // Tablet positioning & Sizing
      "md:bottom-8 md:right-8 md:w-[450px] md:h-[650px]",
      // Desktop positioning & Sizing (Large screens)
      "lg:w-[480px] lg:h-[700px] lg:bottom-10 lg:right-10"
    )}>
      
      {/* Header */}
      <div className="p-4 md:p-5 bg-gradient-to-r from-green-600 to-emerald-600 text-white flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-yellow-200" />
          </div>
          <div>
            <h3 className="font-bold text-base md:text-lg leading-none">কৃষি সহকারী</h3>
            <p className="text-[10px] md:text-xs text-green-100 opacity-90 mt-1">আপনার ব্যক্তিগত এআই বিশেষজ্ঞ</p>
          </div>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="h-8 w-8 md:h-10 md:w-10 text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors flex items-center justify-center"
        >
          <X className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 md:p-5 bg-slate-50/50">
        <div className="space-y-4 md:space-y-6 pb-2">
          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[350px] md:h-[450px] space-y-4 md:space-y-6 opacity-80">
              <div className="h-16 w-16 md:h-20 md:w-20 bg-green-100 rounded-full flex items-center justify-center mb-2 animate-bounce [animation-duration:3s]">
                <Bot className="h-8 w-8 md:h-10 md:w-10 text-green-600" />
              </div>
              <p className="text-sm md:text-base font-medium text-gray-600 text-center px-4 max-w-[80%]">
                হ্যালো! আমি আপনাকে কৃষি বিষয়ক যেকোনো তথ্য দিয়ে সাহায্য করতে পারি।
              </p>
              <div className="flex flex-wrap justify-center gap-2 md:gap-3 px-2">
                {['আজকের আবহাওয়া?', 'ধানের অবস্থা?', 'কবে কাটব?', 'সার প্রয়োগ'].map((q) => (
                  <button
                    key={q}
                    onClick={() => handleUserQuery(q)}
                    className="text-xs md:text-sm bg-white border border-green-200 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-green-700 hover:bg-green-50 transition-colors shadow-sm hover:shadow-md"
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
              <div className={cn("flex max-w-[85%] md:max-w-[80%] gap-2 md:gap-3", msg.isUser ? "flex-row-reverse" : "flex-row")}>
                {/* Avatar Icons */}
                <div className={cn(
                  "h-6 w-6 md:h-8 md:w-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm",
                  msg.isUser ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                )}>
                  {msg.isUser ? <User className="h-3.5 w-3.5 md:h-4 md:w-4" /> : <Bot className="h-3.5 w-3.5 md:h-4 md:w-4" />}
                </div>

                {/* Message Bubble */}
                <div
                  className={cn(
                    "rounded-2xl px-4 py-2.5 md:px-5 md:py-3 text-sm md:text-[15px] shadow-sm leading-relaxed",
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
              <div className="flex max-w-[85%] gap-2 md:gap-3">
                <div className="h-6 w-6 md:h-8 md:w-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-1">
                  <Bot className="h-3.5 w-3.5 md:h-4 md:w-4 text-green-600" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none px-4 py-3 md:px-5 md:py-4 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
        {error && (
          <div className="mb-2 p-2 bg-red-50 text-red-600 text-xs md:text-sm rounded-lg text-center animate-pulse border border-red-100">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2 md:gap-3 relative">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start()}
            className={cn(
              "shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full border-2 transition-all duration-300 shadow-sm", 
              isListening 
                ? "border-red-500 bg-red-50 text-red-600 animate-pulse scale-105" 
                : "border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50"
            )}
          >
            <Mic className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="প্রশ্ন লিখুন..."
              className="w-full rounded-full pl-5 pr-5 h-11 md:h-12 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-gray-50/50 focus:bg-white transition-all text-sm md:text-base"
            />
          </div>
          
          {inputText.trim() ? (
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full bg-green-600 hover:bg-green-700 shadow-md transition-all hover:scale-105"
            >
              <Send className="h-5 w-5 md:h-5 md:w-5" />
            </Button>
          ) : (
             isSpeaking ? (
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                onClick={() => speak('')} 
                className="shrink-0 h-11 w-11 md:h-12 md:w-12 rounded-full border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
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