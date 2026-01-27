'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
    if (!socket) {
        const socketUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

        socket = io(socketUrl, {
            path: '/api/socketio',
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Trigger the socket setup by calling the API endpoint
        fetch('/api/socketio').catch(() => { });
    }
    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
