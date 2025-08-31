import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { ChatMessage } from '@/types/auth';
import { useToast } from '@/hooks/use-toast';

const MAX_MESSAGES = 50;

export type ChatBotHandle = {
  focusInteractions: () => void;
  showHistory: () => void;
};

export const ChatBot = forwardRef<ChatBotHandle, {}>((props, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Bonjour ! Je suis votre assistant IA en pharmacie. Que puis-je vérifier pour vous ?',
      role: 'assistant',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // État pour le vérificateur d'interactions
  const [drug1, setDrug1] = useState('');
  const [drug2, setDrug2] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [checkAnswer, setCheckAnswer] = useState<string | null>(null);
  const [checkSources, setCheckSources] = useState<string[] | null>(null);
  const drug1Ref = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useImperativeHandle(ref, () => ({
    focusInteractions: () => {
      drug1Ref.current?.focus();
    },
    showHistory: () => {
      // Scroll to the bottom of the message list (history)
      scrollToBottom();
    },
  }));

  const handleInteractionSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!drug1.trim() || !drug2.trim()) {
      setCheckError("Veuillez saisir deux médicaments.");
      return;
    }
    setCheckLoading(true);
    setCheckError(null);
    setCheckAnswer(null);
    setCheckSources(null);
    try {
      const res = await fetch('/api/check-interaction', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ drug1, drug2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erreur inconnue');
      setCheckAnswer(typeof data?.answer === 'string' ? data.answer : null);
      setCheckSources(Array.isArray(data?.sources) ? data.sources : null);
    } catch (err: any) {
      setCheckError(err?.message || "Une erreur est survenue.");
    } finally {
      setCheckLoading(false);
    }
  };

  const handleInteractionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleInteractionSubmit();
    }
  };

  const simulatePerplexityAPI = async (userMessage: string): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Mock responses based on keywords
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('médicament') || lowerMessage.includes('prescription')) {
      return 'Concernant les médicaments, je peux vous aider avec les interactions, les posologies, et les contre-indications. Pourriez-vous me donner plus de détails sur votre question ?';
    }
    
    if (lowerMessage.includes('patient') || lowerMessage.includes('conseil')) {
      return 'Pour le conseil aux patients, il est important de considérer leur historique médical, leurs allergies connues, et les autres traitements en cours. Que souhaitez-vous savoir précisément ?';
    }
    
    if (lowerMessage.includes('interaction') || lowerMessage.includes('effet')) {
      return 'Les interactions médicamenteuses sont effectivement cruciales à vérifier. Je peux vous aider à identifier les interactions potentielles. Quels médicaments souhaitez-vous analyser ?';
    }
    
    return `Je comprends votre question concernant "${userMessage}". En tant qu'assistant pharmaceutique, je peux vous fournir des informations générales, mais n'oubliez pas de toujours consulter les références officielles et votre expertise professionnelle pour les décisions cliniques.`;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: input.trim(),
      role: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      // Keep only the latest 50 messages
      return newMessages.slice(-MAX_MESSAGES);
    });
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await simulatePerplexityAPI(userMessage.content);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date(),
      };

      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        return newMessages.slice(-MAX_MESSAGES);
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de contacter l'assistant IA. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const interactionLines =
    (checkAnswer || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[-]\s*/, ''));

  return (
    <Card className="w-full h-[70vh] sm:h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Assistant DwaIA 2.0 — Interactions médicamenteuses
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-0">
        {/* Vérificateur d'associations de médicaments */}
        <div className="p-4 border-b space-y-3">
          <form onSubmit={handleInteractionSubmit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Médicament 1 (DCI)</label>
              <Input
                ref={drug1Ref}
                autoFocus
                value={drug1}
                onChange={(e) => setDrug1(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. ibuprofène (DCI)"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground">Saisissez la DCI, pas le nom commercial.</p>
            </div>
            <div className="grid gap-1">
              <label className="text-sm font-medium">Médicament 2 (DCI)</label>
              <Input
                value={drug2}
                onChange={(e) => setDrug2(e.target.value)}
                onKeyDown={handleInteractionKeyDown}
                placeholder="Ex. warfarine (DCI)"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                required
              />
            </div>
            <Button type="submit" disabled={checkLoading} aria-busy={checkLoading} className="mt-2 sm:mt-0 justify-self-end" title="Appuyez sur Entrée ↵ pour soumettre">
              {checkLoading ? 'Recherche en cours…' : 'Vérifier l’interaction'}
            </Button>
          </form>
          {checkError && (
            <p role="alert" aria-live="polite" className="text-sm text-destructive">{checkError}</p>
          )}
          {checkAnswer && (
            <div className="text-sm">
              <ul className="list-disc pl-6 space-y-1">
                {interactionLines.map((line, idx) => (
                  <li key={idx}>{line}</li>
                ))}
              </ul>
              {checkSources && checkSources.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Source :{' '}
                  {checkSources.map((s, i) => (
                    <span key={i}>
                      <a href={s} target="_blank" rel="noreferrer" className="underline">drugs.com</a>
                      {i < checkSources.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </p>
              )}
            </div>
          )}
        </div>
        <ScrollArea className="flex-1 bg-card" ref={scrollAreaRef}>
          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg p-3 overflow-y-auto max-h-[60vh] sm:max-h-none ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {formatTime(message.timestamp)}
                  </p>
                </div>
                {message.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">L'assistant réfléchit...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question pharmaceutique..."
              disabled={isLoading}
              className="flex-1 placeholder:text-transparent sm:placeholder:text-gray-500 dark:sm:placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              title="Appuyez sur Entrée ↵ pour envoyer"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Historique limité aux 50 derniers messages
          </p>
        </div>
      </CardContent>
    </Card>
  );
});
