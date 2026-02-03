/**
 * Socket.IO Configuration
 * Real-time communication setup
 * @author Redemption Jonathan
 * @version 1.0.0
 * @license MIT
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { CONFIGS } from '@/constants/configs.constant';
import chatService from '@/services/chat.service';
import { EMESSAGE_TYPE } from '@/constants/enums.constant';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    role?: string;
}

let io: SocketServer;

/**
 * Initialize Socket.IO server
 */
export function initSocketIO(httpServer: HttpServer): SocketServer {
    io = new SocketServer(httpServer, {
        cors: {
            origin: [...CONFIGS.CORS],
            methods: ['GET', 'POST'],
            credentials: true
        },
        transports: ['websocket', 'polling']
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, CONFIGS.JWT.SECRET) as any;
            socket.userId = decoded.id;
            socket.role = decoded.role;

            next();
        } catch (error) {
            next(new Error('Invalid authentication token'));
        }
    });

    io.on('connection', handleConnection);

    console.log('Socket.IO initialized');
    return io;
}

/**
 * Handle new socket connection
 */
function handleConnection(socket: AuthenticatedSocket) {
    const userId = socket.userId!;

    console.log(`User connected: ${userId}`);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Join conversation rooms
    socket.on('join:conversation', async (conversationId: string) => {
        try {
            // Verify user has access to conversation
            const conversation = await chatService.getConversationById(conversationId);
            const isParticipant = conversation.participants.some(
                (p: any) => p._id?.toString() === userId || p.toString() === userId
            );

            if (isParticipant) {
                socket.join(`conversation:${conversationId}`);
                socket.emit('joined:conversation', { conversationId });
            }
        } catch (error) {
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    // Leave conversation room
    socket.on('leave:conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
    });

    // Send message
    socket.on('message:send', async (data: {
        conversationId: string;
        content: string;
        type?: EMESSAGE_TYPE;
        replyTo?: string;
    }) => {
        try {
            const message = await chatService.sendMessage({
                conversationId: data.conversationId,
                senderId: userId,
                content: data.content,
                type: data.type,
                replyTo: data.replyTo
            });

            // Emit to all participants in conversation
            io.to(`conversation:${data.conversationId}`).emit('message:received', message);

            // Also notify users who aren't in the conversation room
            const conversation = await chatService.getConversationById(data.conversationId);
            conversation.participants.forEach((participant: any) => {
                const participantId = participant._id?.toString() || participant.toString();
                if (participantId !== userId) {
                    io.to(`user:${participantId}`).emit('message:new', {
                        conversationId: data.conversationId,
                        message
                    });
                }
            });
        } catch (error: any) {
            socket.emit('error', { message: error.message || 'Failed to send message' });
        }
    });

    // Typing indicators
    socket.on('typing:start', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('typing:started', { userId });
    });

    socket.on('typing:stop', (conversationId: string) => {
        socket.to(`conversation:${conversationId}`).emit('typing:stopped', { userId });
    });

    // Mark messages as read
    socket.on('messages:read', async (data: { conversationId: string }) => {
        try {
            await chatService.getMessages(data.conversationId, userId, 1, 1); // This marks messages as read
            socket.to(`conversation:${data.conversationId}`).emit('messages:marked-read', {
                userId,
                conversationId: data.conversationId
            });
        } catch (error) {
            console.error('Failed to mark messages as read:', error);
        }
    });

    // Disconnect
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
    });
}

/**
 * Get Socket.IO instance
 */
export function getIO(): SocketServer {
    if (!io) {
        throw new Error('Socket.IO not initialized');
    }
    return io;
}

/**
 * Emit event to specific user
 */
export function emitToUser(userId: string, event: string, data: any): void {
    if (io) {
        io.to(`user:${userId}`).emit(event, data);
    }
}

/**
 * Emit event to conversation participants
 */
export function emitToConversation(conversationId: string, event: string, data: any): void {
    if (io) {
        io.to(`conversation:${conversationId}`).emit(event, data);
    }
}

export default {
    initSocketIO,
    getIO,
    emitToUser,
    emitToConversation
};
