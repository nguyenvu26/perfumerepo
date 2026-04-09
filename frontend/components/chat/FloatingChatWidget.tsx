'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService, Conversation, Message } from '@/services/chat.service';
import { getChatSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/use-auth';
import { MessageCircle, X, Send, Sparkles, Bot, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/i18n';

export function FloatingChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { isAuthenticated } = useAuth();

    // Quick action suggestions
    const quickActions = [
        { label: '🌸 Recommend a perfume', text: 'Recommend a perfume for me' },
        { label: '💰 Under 1M VND', text: 'Show me perfumes under 1 million VND' },
        { label: '☀️ For summer', text: 'What perfumes are good for summer?' },
    ];

    // WebSocket listener
    useEffect(() => {
        if (!conversation) return;
        const socket = getChatSocket();

        const handler = (message: Message) => {
            if (message.conversationId === conversation.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
        };
        socket.on('message', handler);
        return () => { socket.off('message', handler); };
    }, [conversation]);

    // Load messages when conversation changes
    useEffect(() => {
        if (conversation) {
            loadMessages(conversation.id);
        }
    }, [conversation?.id]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen && conversation) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, conversation]);

    const loadMessages = async (conversationId: string) => {
        try {
            const { items } = await chatService.getMessages({ conversationId, take: 50 });
            setMessages(items.reverse());
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const startChat = async () => {
        if (!isAuthenticated) return;
        setInitializing(true);
        try {
            const convs = await chatService.listConversations();
            const existing = convs.find((c) => c.type === 'CUSTOMER_AI');
            if (existing) {
                setConversation(existing);
            } else {
                const conv = await chatService.createConversation({ type: 'CUSTOMER_AI' });
                setConversation(conv);
            }
        } catch (error) {
            console.error('Failed to start chat:', error);
        } finally {
            setInitializing(false);
        }
    };

    const sendMessage = useCallback(async (text?: string) => {
        const msg = text || newMessage.trim();
        if (!conversation || !msg) return;

        setLoading(true);
        setNewMessage('');
        try {
            const { message, aiMessage } = await chatService.sendMessage({
                conversationId: conversation.id,
                type: 'TEXT',
                content: { text: msg },
            });
            setMessages((prev) => {
                let next = prev.some((m) => m.id === message.id) ? prev : [...prev, message];
                if (aiMessage && !next.some((m) => m.id === aiMessage.id)) {
                    next = [...next, aiMessage];
                }
                return next;
            });
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setLoading(false);
        }
    }, [conversation, newMessage]);

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            {/* Toggle Button */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gold shadow-lg shadow-gold/30 flex items-center justify-center text-primary-foreground hover:shadow-gold/50 transition-shadow"
                    >
                        <MessageCircle size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Chat Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] rounded-3xl overflow-hidden flex flex-col border border-border/50 shadow-2xl bg-background"
                    >
                        {/* Header */}
                        <div className="bg-luxury-black px-5 py-4 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gold/20 flex items-center justify-center">
                                    <Bot size={18} className="text-gold" />
                                </div>
                                <div>
                                    <h3 className="font-heading text-sm text-white font-medium tracking-wide">
                                        PerfumeGPT
                                    </h3>
                                    <p className="text-[10px] text-white/50 uppercase tracking-widest">
                                        AI Consultant
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>

                        {/* Body */}
                        {!isAuthenticated ? (
                            /* Not logged in */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                                <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center">
                                    <Sparkles size={28} className="text-gold" />
                                </div>
                                <h4 className="font-heading text-sm uppercase tracking-widest">
                                    Perfume Consultation
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Please log in to start chatting with our AI Consultant.
                                </p>
                            </div>
                        ) : !conversation ? (
                            /* Logged in but no conversation started */
                            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-5">
                                <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center">
                                    <Sparkles size={28} className="text-gold" />
                                </div>
                                <div>
                                    <h4 className="font-heading text-sm uppercase tracking-widest">
                                        Need help finding a fragrance?
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Our AI consultant can recommend perfumes based on your preferences.
                                    </p>
                                </div>
                                <button
                                    onClick={startChat}
                                    disabled={initializing}
                                    className="px-6 py-3 rounded-2xl gold-btn-gradient text-sm font-heading uppercase tracking-widest text-white shadow-lg shadow-gold/20 hover:shadow-gold/40 transition-shadow disabled:opacity-50"
                                >
                                    {initializing ? 'Starting...' : 'Start Chat'}
                                </button>
                            </div>
                        ) : (
                            /* Chat active */
                            <>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {messages.length === 0 && (
                                        <div className="text-center py-8 space-y-4">
                                            <p className="text-xs text-muted-foreground">
                                                Ask me anything about perfumes!
                                            </p>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {quickActions.map((qa) => (
                                                    <button
                                                        key={qa.label}
                                                        onClick={() => sendMessage(qa.text)}
                                                        disabled={loading}
                                                        className="px-3 py-1.5 rounded-full text-xs border border-gold/30 text-gold hover:bg-gold/10 transition-colors disabled:opacity-50"
                                                    >
                                                        {qa.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={cn(
                                                'flex',
                                                msg.senderType === 'USER' ? 'justify-end' : 'justify-start'
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    'max-w-[80%] px-4 py-2.5 text-sm',
                                                    msg.senderType === 'USER'
                                                        ? 'bg-gold text-white rounded-2xl rounded-tr-md'
                                                        : 'glass rounded-2xl rounded-tl-md'
                                                )}
                                            >
                                                {(msg.type === 'TEXT' || msg.type === 'AI_RECOMMENDATION') && (
                                                    <p className="whitespace-pre-wrap leading-relaxed">
                                                        {(msg.content as any)?.text}
                                                    </p>
                                                )}
                                                {msg.type === 'AI_RECOMMENDATION' &&
                                                    (msg.content as any)?.recommendations?.map(
                                                        (rec: any, idx: number) => (
                                                            <Link
                                                                key={idx}
                                                                href={`/products/${rec.productId}`}
                                                                className="mt-2 p-3 rounded-xl bg-background/60 border border-border/50 block hover:border-gold/50 hover:bg-gold/5 transition-all group cursor-pointer"
                                                            >
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-sm group-hover:text-gold transition-colors">
                                                                            {rec.name}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground mt-1">
                                                                            {rec.reason}
                                                                        </p>
                                                                        {rec.price && (
                                                                            <p className="text-xs font-semibold text-gold mt-1">
                                                                                {Number(rec.price).toLocaleString()}₫
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                    <ExternalLink size={12} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0 mt-1" />
                                                                </div>
                                                            </Link>
                                                        )
                                                    )}
                                                <p className="text-[10px] opacity-50 mt-1 text-right">
                                                    {formatTime(msg.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="glass rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input bar */}
                                <div className="p-3 border-t border-border/50 shrink-0 bg-background/60 backdrop-blur-xl">
                                    <div className="flex items-center gap-2">
                                        <input
                                            ref={inputRef}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                            placeholder="Type your message..."
                                            disabled={loading}
                                            className="flex-1 bg-secondary/50 rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-gold/50 placeholder:text-muted-foreground/50 disabled:opacity-50"
                                        />
                                        <button
                                            onClick={() => sendMessage()}
                                            disabled={loading || !newMessage.trim()}
                                            className="w-10 h-10 rounded-xl bg-gold flex items-center justify-center text-white shrink-0 disabled:opacity-30 hover:shadow-lg hover:shadow-gold/30 transition-all"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
