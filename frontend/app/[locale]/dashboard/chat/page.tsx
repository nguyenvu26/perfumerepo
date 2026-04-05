'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { chatService, Conversation, Message, ChatContact } from '@/services/chat.service';
import { getChatSocket } from '@/lib/socket';
import { useAuth } from '@/hooks/use-auth';
import {
    MessageCircle, Send, Bot, Sparkles, Users, Plus,
    Search, BrainCircuit, BarChart3, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@/lib/i18n';

import { useTranslations, useLocale, useFormatter } from 'next-intl';

type Tab = 'conversations' | 'contacts';

export default function DashboardChatPage() {
    const t = useTranslations('dashboard.profile.chat');
    const tFeatured = useTranslations('featured');
    const format = useFormatter();
    const { user } = useAuth();
    const [tab, setTab] = useState<Tab>('conversations');
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [contacts, setContacts] = useState<ChatContact[]>([]);
    const [selected, setSelected] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // ── Init ──
    useEffect(() => {
        loadConversations();
        loadContacts();
    }, []);

    // ── WebSocket ──
    useEffect(() => {
        if (!selected) return;
        const socket = getChatSocket();
        const handler = (message: Message) => {
            if (message.conversationId === selected.id) {
                setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
        };
        socket.on('message', handler);
        socket.emit('joinConversation', selected.id);
        return () => {
            socket.off('message', handler);
            socket.emit('leaveConversation', selected.id);
        };
    }, [selected]);

    // ── Load messages ──
    useEffect(() => {
        if (selected) {
            loadMessages(selected.id);
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [selected?.id]);

    // ── Scroll ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // ── API calls ──
    const loadConversations = async () => {
        try {
            const data = await chatService.listConversations();
            setConversations(data);
        } catch (e) { console.error(e); }
    };

    const loadContacts = async () => {
        try {
            const data = await chatService.listContacts();
            setContacts(data);
        } catch (e) { console.error(e); }
    };

    const loadMessages = async (conversationId: string) => {
        try {
            const { items } = await chatService.getMessages({ conversationId, take: 50 });
            setMessages(items.reverse());
        } catch (e) { console.error(e); }
    };

    const createAiConversation = async (type: 'CUSTOMER_AI' | 'ADMIN_AI') => {
        try {
            const conv = await chatService.createConversation({ type });
            setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
            setSelected(conv);
        } catch (e) { console.error(e); }
    };

    const startHumanChat = async (contact: ChatContact) => {
        try {
            const type = contact.role === 'STAFF' ? 'ADMIN_STAFF' : 'CUSTOMER_ADMIN';
            const conv = await chatService.createConversation({
                type: type as any,
                otherUserId: contact.id,
            });
            setConversations((prev) => [conv, ...prev.filter((c) => c.id !== conv.id)]);
            setSelected(conv);
            setTab('conversations');
        } catch (e) { console.error(e); }
    };

    const sendMessage = useCallback(async () => {
        if (!selected || !newMessage.trim()) return;
        setLoading(true);
        const text = newMessage.trim();
        setNewMessage('');
        try {
            const { message, aiMessage } = await chatService.sendMessage({
                conversationId: selected.id,
                type: 'TEXT',
                content: { text },
            });
            setMessages((prev) => {
                let next = prev.some((m) => m.id === message.id) ? prev : [...prev, message];
                if (aiMessage && !next.some((m) => m.id === aiMessage.id)) {
                    next = [...next, aiMessage];
                }
                return next;
            });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, [selected, newMessage]);

    // ── Helpers ──
    const getConversationLabel = (conv: Conversation) => {
        if (conv.type === 'CUSTOMER_AI') return t('ai_labels.perfume');
        if (conv.type === 'ADMIN_AI') return t('ai_labels.marketing');
        const other = conv.participants?.find((p) => p.userId !== user?.id);
        return other?.user?.fullName || other?.user?.email || conv.type;
    };

    const getConversationIcon = (type: string) => {
        if (type === 'CUSTOMER_AI') return <BrainCircuit size={16} className="text-gold" />;
        if (type === 'ADMIN_AI') return <BarChart3 size={16} className="text-gold" />;
        return <Users size={16} className="text-gold" />;
    };

    const getLastMessage = (conv: Conversation) => {
        const msg = conv.messages?.[0];
        if (!msg) return t('ai_labels.no_messages');
        return (msg.content as any)?.text?.slice(0, 60) || t('ai_labels.message_placeholder');
    };

    const formatTime = (d: string) =>
        new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const filteredConversations = conversations.filter((c) => {
        if (!searchTerm) return true;
        const label = getConversationLabel(c).toLowerCase();
        return label.includes(searchTerm.toLowerCase());
    });

    const filteredContacts = contacts.filter((c) => {
        if (!searchTerm) return true;
        return (
            (c.fullName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            c.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
            {/* ──────── Left Panel ──────── */}
            <div className="w-80 border-r border-border/50 flex flex-col shrink-0">
                {/* Header + new AI buttons */}
                <div className="p-4 border-b border-border/50 space-y-3">
                    <h2 className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">
                        {t('title')}
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={() => createAiConversation('CUSTOMER_AI')}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl gold-btn-gradient text-[10px] font-heading uppercase tracking-widest text-white shadow shadow-gold/20 hover:shadow-gold/40 transition-all"
                        >
                            <BrainCircuit size={14} />
                            {t('buttons.perfume_ai')}
                        </button>
                        {user?.role === 'ADMIN' && (
                            <button
                                onClick={() => createAiConversation('ADMIN_AI')}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gold/30 text-gold text-[10px] font-heading uppercase tracking-widest hover:bg-gold/10 transition-colors"
                            >
                                <BarChart3 size={14} />
                                {t('buttons.marketing_ai')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 py-2">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/50">
                        <Search size={14} className="text-muted-foreground" />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder={t('placeholders.search')}
                            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border/50">
                    {(['conversations', 'contacts'] as Tab[]).map((tTab) => (
                        <button
                            key={tTab}
                            onClick={() => setTab(tTab)}
                            className={cn(
                                'flex-1 py-2.5 text-[10px] font-heading uppercase tracking-widest transition-colors',
                                tab === tTab
                                    ? 'text-gold border-b-2 border-gold'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {tTab === 'conversations' ? t('tabs.history') : t('tabs.contacts')}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {tab === 'conversations' ? (
                        filteredConversations.length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-8">
                                {t('fallbacks.no_conversations')}
                            </p>
                        ) : (
                            filteredConversations.map((conv) => (
                                <button
                                    key={conv.id}
                                    onClick={() => setSelected(conv)}
                                    className={cn(
                                        'w-full text-left px-4 py-3 border-b border-border/30 transition-colors hover:bg-secondary/30',
                                        selected?.id === conv.id && 'bg-gold/10 border-l-2 border-l-gold'
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                                            {getConversationIcon(conv.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium truncate">
                                                {getConversationLabel(conv)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                                {getLastMessage(conv)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )
                    ) : (
                        filteredContacts.length === 0 ? (
                            <p className="text-center text-xs text-muted-foreground py-8">
                                {t('fallbacks.no_contacts')}
                            </p>
                        ) : (
                            filteredContacts.map((contact) => (
                                <button
                                    key={contact.id}
                                    onClick={() => startHumanChat(contact)}
                                    className="w-full text-left px-4 py-3 border-b border-border/30 flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-[10px] font-heading uppercase shrink-0">
                                        {(contact.fullName || contact.email).slice(0, 2)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">
                                            {contact.fullName || contact.email}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                            {contact.role}
                                        </p>
                                    </div>
                                    <MessageCircle size={14} className="text-gold shrink-0" />
                                </button>
                            ))
                        )
                    )}
                </div>
            </div>

            {/* ──────── Right Panel (Chat) ──────── */}
            <div className="flex-1 flex flex-col min-w-0">
                {selected ? (
                    <>
                        {/* Chat header */}
                        <div className="h-16 px-6 border-b border-border/50 flex items-center gap-3 shrink-0 bg-background/60 backdrop-blur-xl">
                            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
                                {getConversationIcon(selected.type)}
                            </div>
                            <div>
                                <p className="text-sm font-medium">{getConversationLabel(selected)}</p>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                    {selected.type.replace('_', ' · ')}
                                </p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg) => (
                                <motion.div
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={cn(
                                        'flex',
                                        msg.senderType === 'USER' ? 'justify-end' : 'justify-start'
                                    )}
                                >
                                    <div
                                        className={cn(
                                            'max-w-[65%] px-4 py-3 text-sm',
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
                                                                        {format.number(Number(rec.price), { style: 'currency', currency: tFeatured('currency_code') || 'VND', maximumFractionDigits: 0 })}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <ExternalLink size={12} className="text-muted-foreground group-hover:text-gold transition-colors shrink-0 mt-1" />
                                                        </div>
                                                    </Link>
                                                )
                                            )}
                                        <p className="text-[10px] opacity-50 mt-1.5 text-right">
                                            {formatTime(msg.createdAt)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}

                            {loading && (
                                <div className="flex justify-start">
                                    <div className="glass rounded-2xl rounded-tl-md px-5 py-3 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 border-t border-border/50 shrink-0 bg-background/60 backdrop-blur-xl">
                            <div className="flex items-center gap-3">
                                <input
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder={t('placeholders.type_message')}
                                    disabled={loading}
                                    className="flex-1 bg-secondary/50 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-1 focus:ring-gold/50 placeholder:text-muted-foreground/50 disabled:opacity-50"
                                />
                                <button
                                    onClick={sendMessage}
                                    disabled={loading || !newMessage.trim()}
                                    className="w-11 h-11 rounded-xl bg-gold flex items-center justify-center text-white shrink-0 disabled:opacity-30 hover:shadow-lg hover:shadow-gold/30 transition-all"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    /* No conversation selected */
                    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                        <div className="w-20 h-20 rounded-3xl bg-gold/10 flex items-center justify-center">
                            <Bot size={36} className="text-gold/60" />
                        </div>
                        <h3 className="font-heading text-sm uppercase tracking-[0.2em] text-muted-foreground">
                            {t('fallbacks.no_selection_title')}
                        </h3>
                        <p className="text-xs text-muted-foreground/60 max-w-xs">
                            {t('fallbacks.no_selection_subtitle')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
