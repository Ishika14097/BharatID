'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { languageManager, SupportedLanguage } from '@/lib/assistant-translations';
import { SendIcon, RotateCcwIcon, DownloadIcon, SettingsIcon, MenuIcon, XIcon } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AssistantContextData {
  userId: string;
  language: SupportedLanguage;
  documents?: Array<{
    documentId: string;
    type: string;
    status: string;
  }>;
}

export interface AIAssistantChatProps {
  userId: string;
  initialLanguage?: SupportedLanguage;
  onClose?: () => void;
  compact?: boolean;
}

/**
 * Modern AI Assistant Chat Component
 * 
 * Features:
 * - Real-time messaging
 * - Multi-language support
 * - Message history
 * - Context awareness
 * - Beautiful UI with animations
 * - Mobile responsive
 */
export function AIAssistantChat({
  userId,
  initialLanguage = 'en',
  onClose,
  compact = false
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>(initialLanguage);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showSettings, setShowSettings] = useState(false);
  const [context, setContext] = useState<AssistantContextData>({
    userId,
    language
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => languageManager.translate(key, language);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    loadHistory();
  }, [userId]);

  /**
   * Load conversation history
   */
  const loadHistory = async () => {
    try {
      const response = await fetch(`/api/assistant/history/${userId}?limit=20`);
      const data = await response.json();

      if (data.success && data.history) {
        const formattedMessages = data.history.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  /**
   * Send message to assistant
   */
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: inputValue,
          language,
          context
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          id: data.message.id,
          role: 'assistant',
          content: data.message.content,
          timestamp: new Date(data.message.timestamp)
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: t('chat.error'),
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: t('error.network'),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear conversation
   */
  const handleClearConversation = async () => {
    if (!confirm(t('form.confirmation'))) return;

    try {
      const response = await fetch(`/api/assistant/conversation/${userId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  /**
   * Export conversation
   */
  const handleExportConversation = async () => {
    try {
      const response = await fetch('/api/assistant/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, format: 'json' })
      });

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation-${userId}.json`;
      a.click();
    } catch (error) {
      console.error('Error exporting conversation:', error);
    }
  };

  /**
   * Handle language change
   */
  const handleLanguageChange = (newLanguage: string) => {
    if (languageManager.isLanguageSupported(newLanguage)) {
      setLanguage(newLanguage as SupportedLanguage);
      setContext(prev => ({ ...prev, language: newLanguage as SupportedLanguage }));
    }
  };

  /**
   * Format message timestamp
   */
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (compact && !isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center"
        title={t('chat.title')}
      >
        <MenuIcon size={24} />
      </button>
    );
  }

  const supportedLanguages = languageManager.getSupportedLanguages();

  return (
    <Card className={`flex flex-col transition-all ${
      compact ? 'fixed bottom-6 right-6 w-96 h-[600px]' : 'w-full h-screen'
    } bg-white shadow-2xl rounded-lg overflow-hidden`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-lg">{t('chat.title')}</h2>
          <p className="text-sm text-blue-100">{t('chat.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-blue-800 rounded-lg transition"
          >
            <SettingsIcon size={20} />
          </button>
          {compact && (
            <button
              onClick={() => {
                setIsExpanded(false);
                onClose?.();
              }}
              className="p-2 hover:bg-blue-800 rounded-lg transition"
            >
              <XIcon size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-50 border-b p-4 space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('chat.language')}</label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearConversation}
              className="flex-1"
            >
              {t('chat.clear')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportConversation}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <DownloadIcon size={16} />
              {t('chat.export')}
            </Button>
          </div>
        </div>
      )}

      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg font-semibold mb-2">{t('msg.welcome')}</p>
              <p className="text-sm">{t('msg.help')}</p>
            </div>
          </div>
        )}

        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
              } break-words`}
            >
              <p className="text-sm">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}
              >
                {formatTime(message.timestamp)}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg rounded-bl-none">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} />
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 bg-gray-50">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={t('chat.placeholder')}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <SendIcon size={18} />
            {!compact && t('chat.send')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default AIAssistantChat;
