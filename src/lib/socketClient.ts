'use client';

import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Socket URL: use NEXT_PUBLIC_SOCKET_URL for EC2/standalone backend (e.g. https://api.example.com).
 * When unset, uses same origin with Next.js API path (local/dev with embedded socket).
 */
function getSocketUrl(): string {
    if (typeof window === 'undefined') return 'http://localhost:3000';
    const envUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (envUrl) return envUrl.replace(/\/$/, ''); // trim trailing slash
    return window.location.origin;
}

function getSocketPath(): string {
    // Standalone backend uses default Socket.IO path /socket.io
    if (process.env.NEXT_PUBLIC_SOCKET_URL) return '/socket.io';
    return '/api/socketio';
}

export function getSocket(): Socket {
    if (!socket) {
        const socketUrl = getSocketUrl();
        const path = getSocketPath();

        socket = io(socketUrl, {
            path,
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        // Only trigger Next.js API socket bootstrap when using same-origin (no external backend)
        if (!process.env.NEXT_PUBLIC_SOCKET_URL) {
            fetch('/api/socketio').catch(() => { });
        }
    }
    return socket;
}

export function disconnectSocket(): void {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}
