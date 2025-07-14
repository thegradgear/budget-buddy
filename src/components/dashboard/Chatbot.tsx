'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, X, Loader2, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Transaction, UserProfile, Account } from '@/types';
import { financialChatbot, FinancialChatbotInput } from '@/ai/flows/financial-chatbot';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

export default function Chatbot() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
        id: 'initial',
        text: "Hello! I'm your Budget Buddy assistant. How can I help you with your finances today? You can ask me things like 'How much did I spend on food last month?' or 'What were my largest expenses?'.",
        sender: 'bot'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchFinancialData = async (): Promise<Omit<FinancialChatbotInput, 'question'>> => {
    if (!user) throw new Error("User not authenticated");

    // Fetch user profile
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    const userProfile = userDoc.exists() ? userDoc.data() as UserProfile : null;
    const userProfileString = JSON.stringify({
        name: userProfile?.name,
        monthlyBudget: userProfile?.monthlyBudget
    });

    // Fetch all accounts to get all transactions
    const accountsSnapshot = await getDocs(collection(db, 'users', user.uid, 'accounts'));
    const transactionPromises = accountsSnapshot.docs.map(accountDoc =>
        getDocs(query(collection(db, 'users', user.uid, 'accounts', accountDoc.id, 'transactions')))
    );

    const transactionSnapshots = await Promise.all(transactionPromises);
    const allTransactions = transactionSnapshots.flatMap(snapshot =>
        snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                date: (data.date as Timestamp).toDate(),
            } as Transaction;
        })
    );
    
    const transactionHistoryString = allTransactions
        .sort((a, b) => b.date.getTime() - a.date.getTime())
        .map(t =>
            `${format(t.date, 'yyyy-MM-dd')}: ${t.type} of ${t.amount} for '${t.description}' in category '${t.category || 'Uncategorized'}'`
        ).join('\n');

    return {
        transactionHistory: transactionHistoryString,
        userProfile: userProfileString
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const financialData = await fetchFinancialData();
        const chatbotInput: FinancialChatbotInput = {
            ...financialData,
            question: input
        };

        const response = await financialChatbot(chatbotInput);
        
        const botMessage: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'bot' };
        setMessages(prev => [...prev, botMessage]);

    } catch (error: any) {
        toast({
            title: 'Error',
            description: error.message || "Could not get a response from the chatbot.",
            variant: 'destructive'
        });
        const errorMessage: Message = {
            id: 'error-' + Date.now(),
            text: "Sorry, I encountered an error. Please try again later.",
            sender: 'bot'
        };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
      <div className={cn("fixed bottom-4 right-4 z-50 transition-all duration-300", isOpen && "bottom-0 right-0 w-full h-full sm:w-[400px] sm:h-auto sm:bottom-4 sm:right-4")}>
        {isOpen ? (
          <Card className="h-full sm:h-[600px] flex flex-col shadow-2xl rounded-none sm:rounded-xl">
            <CardHeader className="flex flex-row items-center justify-between border-b p-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                        <Bot className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg">Budget Buddy AI</CardTitle>
                        <CardDescription className="text-xs">Your financial assistant</CardDescription>
                    </div>
                </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4" viewportRef={scrollAreaRef}>
                    <div className="space-y-4">
                    {messages.map((message) => (
                        <div key={message.id} className={cn('flex items-end gap-2', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {message.sender === 'bot' && (
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-primary" />
                                </div>
                            )}
                            <div
                                className={cn(
                                'max-w-[80%] rounded-2xl px-4 py-2 text-sm',
                                message.sender === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-none'
                                    : 'bg-secondary rounded-bl-none'
                                )}
                            >
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />
                                    }}
                                >
                                    {message.text}
                                </ReactMarkdown>
                            </div>
                             {message.sender === 'user' && (
                                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                    <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex items-end gap-2 justify-start">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="h-5 w-5 text-primary" />
                            </div>
                            <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-secondary rounded-bl-none">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                        </div>
                    )}
                    </div>
                </ScrollArea>
            </CardContent>
            <form onSubmit={handleSubmit} className="p-4 border-t">
              <div className="relative">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a question..."
                  className="pr-12 h-11"
                  disabled={isLoading}
                />
                <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-9 w-9" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          <Button
            size="lg"
            className="rounded-full w-16 h-16 shadow-lg flex items-center justify-center"
            onClick={() => setIsOpen(true)}
          >
            <MessageSquare className="h-8 w-8" />
          </Button>
        )}
      </div>
    </>
  );
}
