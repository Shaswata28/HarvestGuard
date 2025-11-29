/**
 * AI Assistant Component
 * * Provides a voice and text-based interface for farmers to ask questions in Bangla.
 * Features:
 * - Speech-to-Text (Bangla) using Web Speech API
 * - Text-to-Speech (Bangla) for reading answers
 * - Hardcoded responses for key agricultural queries (Minimum Workable Version)
 * - Text input fallback
 * * Requirements:
 * - Support 'bn-BD' language
 * - Answer 4-5 common questions: Weather, Crop Status, Storage, Harvest time
 */

import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, Send, X, MessageSquare, Volume2, StopCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define types for Web Speech API to avoid TS errors
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
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synth = window.speechSynthesis;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize Speech Recognition on mount
  useEffect(() => {
    const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
    const SpeechRecognitionAPI = SpeechRecognition || webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = false; // Stop after one sentence
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'bn-BD'; // Set Language to Bangla (Bangladesh)

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized Voice:', transcript);
        handleUserQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setError('অনুগ্রহ করে মাইক্রোফোনের অনুমতি দিন।');
        } else {
          setError('কথা বুঝতে সমস্যা হচ্ছে। আবার চেষ্টা করুন।');
        }
      };
    } else {
      setError('আপনার ব্রাউজারে ভয়েস সাপোর্ট নেই। টেক্সট চ্যাট ব্যবহার করুন।');
    }
  }, []);

  // Text-to-Speech Function
  const speak = (text: string) => {
    // If already speaking, stop it
    if (synth.speaking) {
      synth.cancel();
      if (isSpeaking) {
        setIsSpeaking(false);
        return; 
      }
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'bn-BD';
    utterance.rate = 0.9; // Slightly slower for clarity
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  };

  // Main Logic to Handle Questions
  const handleUserQuery = async (query: string) => {
    if (!query.trim()) return;

    // 1. Add user message to UI
    setMessages(prev => [...prev, { text: query, isUser: true }]);
    setInputText('');

    // 2. Determine Response (Minimum Workable Logic)
    let responseText = '';
    const normalizedQuery = query.toLowerCase().trim();

    // Q1: Weather / আজকের আবহাওয়া?
    if (normalizedQuery.includes('আবহাওয়া') || normalizedQuery.includes('weather') || normalizedQuery.includes('বৃষ্টি')) {
      responseText = 'আজকের আকাশ পরিষ্কার। তাপমাত্রা ৩০ ডিগ্রি সেলসিয়াস। বৃষ্টির সম্ভাবনা নেই।';
    } 
    // Q2: Crop Status / আমার ধানের অবস্থা?
    else if ((normalizedQuery.includes('ধান') || normalizedQuery.includes('ফসল')) && (normalizedQuery.includes('অবস্থা') || normalizedQuery.includes('কেমন'))) {
      responseText = 'আপনার ধান এখন পাকার পর্যায়ে আছে। পোকার আক্রমণ নেই, তবে সেচ প্রয়োজন হতে পারে।';
    } 
    // Q3: Storage Advice / গুদামে কী করব?
    else if (normalizedQuery.includes('গুদাম') || normalizedQuery.includes('রাখব') || normalizedQuery.includes('storage')) {
      responseText = 'গুদামে আর্দ্রতা কম রাখুন। ধানের বস্তা সরাসরি ফ্লোরে না রেখে মাচা বা কাঠের উপর রাখুন।';
    } 
    // Q4: Harvest Time / কবে কাটব?
    else if (normalizedQuery.includes('কাটব') || normalizedQuery.includes('হারভেস্ট') || normalizedQuery.includes('সময়')) {
      responseText = 'আগামী ৭ থেকে ১০ দিনের মধ্যে ধান কাটার উপযুক্ত সময় হবে।';
    } 
    // Fallback
    else {
      responseText = 'দুঃখিত, আমি এটি বুঝতে পারিনি। আপনি আবহাওয়া, ফসল বা গুদাম সম্পর্কে জানতে চাইতে পারেন।';
    }

    // 3. Simulate AI thinking delay & Respond
    setTimeout(() => {
      setMessages(prev => [...prev, { text: responseText, isUser: false }]);
      speak(responseText);
    }, 600);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleUserQuery(inputText);
  };

  // Render Floating Button if Closed
  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-50 animate-in zoom-in duration-300 flex items-center justify-center"
        title="AI কৃষি সহকারী"
      >
        <MessageSquare className="h-7 w-7" />
      </Button>
    );
  }

  // Render Chat Interface
  return (
    <Card className="fixed bottom-24 right-4 w-[90vw] max-w-[350px] h-[500px] shadow-2xl z-50 flex flex-col border-primary/20 animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-primary text-primary-foreground flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          <h3 className="font-bold text-lg">কৃষি সহকারী</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-primary-foreground hover:bg-primary/80 rounded-full">
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 bg-slate-50">
        <div className="space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm mt-8 p-4 bg-white rounded-lg border shadow-sm">
              <p className="font-medium text-gray-700 mb-2">আমি আপনাকে কীভাবে সাহায্য করতে পারি?</p>
              <p className="text-xs text-gray-500 mb-3">মাইক্রোফোনে ট্যাপ করে বলুন:</p>
              <ul className="space-y-2 text-left list-disc list-inside text-xs">
                <li>"আজকের আবহাওয়া কেমন?"</li>
                <li>"আমার ধানের অবস্থা?"</li>
                <li>"গুদামে কী করব?"</li>
                <li>"কবে কাটব?"</li>
              </ul>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
                msg.isUser ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                  msg.isUser
                    ? "bg-primary text-primary-foreground rounded-br-none"
                    : "bg-white border text-gray-800 rounded-bl-none"
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-white">
        {error && <p className="text-xs text-red-500 mb-2 text-center font-medium animate-pulse">{error}</p>}
        
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Button
            type="button"
            // Toggle visual state based on listening/speaking
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleListening}
            className={cn(
              "shrink-0 h-10 w-10 rounded-full transition-all duration-300", 
              isListening && "animate-pulse ring-2 ring-destructive/30"
            )}
            title="ভয়েস কমান্ড দিন"
          >
            <Mic className="h-5 w-5" />
          </Button>
          
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="প্রশ্ন লিখুন..."
            className="flex-1 rounded-full px-4 border-gray-300 focus:border-primary"
          />
          
          {inputText.trim() ? (
            <Button type="submit" size="icon" className="shrink-0 h-10 w-10 rounded-full bg-primary hover:bg-primary/90">
              <Send className="h-4 w-4" />
            </Button>
          ) : (
             // Show Stop Speak button if AI is talking, otherwise hidden placeholder
             isSpeaking ? (
              <Button type="button" variant="ghost" size="icon" onClick={() => speak('')} className="shrink-0 h-10 w-10 text-gray-500">
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