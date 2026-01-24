// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// useAICompanion Hook
// Easy integration with the AI chat service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
    id: string;
    elderId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        mood?: string;
        routineRelated?: boolean;
        isProactive?: boolean;
    };
}

interface Routine {
    id: string;
    type: string;
    title: string;
    time: string;
    importance: string;
}

interface UseAICompanionOptions {
    elderId: string;
    elderName?: string;
    serverUrl?: string;
    autoConnect?: boolean;
}

interface UseAICompanionReturn {
    // Connection
    isConnected: boolean;
    connect: () => void;
    disconnect: () => void;

    // Messages
    messages: ChatMessage[];
    sendMessage: (content: string) => void;
    clearMessages: () => void;

    // State
    isTyping: boolean;
    currentMood: string | null;

    // Routines
    upcomingRoutines: Routine[];
    acknowledgeRoutine: (routineId: string) => void;

    // Proactive
    lastProactiveMessage: ChatMessage | null;
}

export function useAICompanion(options: UseAICompanionOptions): UseAICompanionReturn {
    const {
        elderId,
        elderName = 'Friend',
        serverUrl = 'http://localhost:5001',
        autoConnect = true
    } = options;

    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [currentMood, setCurrentMood] = useState<string | null>(null);
    const [upcomingRoutines, setUpcomingRoutines] = useState<Routine[]>([]);
    const [lastProactiveMessage, setLastProactiveMessage] = useState<ChatMessage | null>(null);

    const socketRef = useRef<Socket | null>(null);

    // Connect to server
    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;

        const socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('elder:join', {
                elderId,
                profile: { fullName: elderName, preferredName: elderName }
            });
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('chat:history', (history: ChatMessage[]) => {
            setMessages(history.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
            })));
        });

        socket.on('chat:response', (message: ChatMessage) => {
            const newMsg = { ...message, timestamp: new Date(message.timestamp) };
            setMessages(prev => [...prev, newMsg]);
            setIsTyping(false);

            if (message.metadata?.mood) {
                setCurrentMood(message.metadata.mood);
            }
        });

        socket.on('companion:proactive', (message: ChatMessage) => {
            const newMsg = { ...message, timestamp: new Date(message.timestamp) };
            setMessages(prev => [...prev, newMsg]);
            setLastProactiveMessage(newMsg);
        });

        socket.on('chat:typing', (data: { isTyping: boolean }) => {
            setIsTyping(data.isTyping);
        });

        socket.on('routines:upcoming', (routines: Routine[]) => {
            setUpcomingRoutines(routines);
        });
    }, [serverUrl, elderId, elderName]);

    // Disconnect
    const disconnect = useCallback(() => {
        socketRef.current?.disconnect();
        socketRef.current = null;
        setIsConnected(false);
    }, []);

    // Send message
    const sendMessage = useCallback((content: string) => {
        if (!socketRef.current || !content.trim()) return;

        const userMessage: ChatMessage = {
            id: `temp-${Date.now()}`,
            elderId,
            role: 'user',
            content: content.trim(),
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        socketRef.current.emit('chat:message', { content: content.trim(), elderId });
        setIsTyping(true);
    }, [elderId]);

    // Clear messages
    const clearMessages = useCallback(() => {
        setMessages([]);
        setCurrentMood(null);
    }, []);

    // Acknowledge routine
    const acknowledgeRoutine = useCallback((routineId: string) => {
        socketRef.current?.emit('routine:acknowledge', { routineId, elderId });
        setUpcomingRoutines(prev => prev.filter(r => r.id !== routineId));
    }, [elderId]);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect) {
            connect();
        }

        return () => {
            disconnect();
        };
    }, [autoConnect, connect, disconnect]);

    return {
        isConnected,
        connect,
        disconnect,
        messages,
        sendMessage,
        clearMessages,
        isTyping,
        currentMood,
        upcomingRoutines,
        acknowledgeRoutine,
        lastProactiveMessage,
    };
}

export default useAICompanion;
