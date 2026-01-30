'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { getSocket, disconnectSocket } from '@/lib/socketClient';
import { GameState, GamePhase } from '@/lib/gameTypes';
import { SOCKET_EVENTS } from '@/lib/socketEvents';

interface GameContextType {
    socket: Socket | null;
    gameState: GameState | null;
    playerId: string | null;
    isConnected: boolean;
    error: string | null;

    // Actions
    createGame: (playerName: string) => void;
    joinGame: (gameId: string, playerName: string) => void;
    leaveGame: () => void;
    startGame: () => void;
    readyForNomination: () => void;
    nominateChair: (chairId: string) => void;
    castVote: (vote: boolean) => void;
    vcDiscard: (policyIndex: number) => void;
    chairEnact: (policyIndex: number) => void;
    investigate: (targetId: string) => void;
    completeInvestigation: () => void;
    peekPolicies: () => void;
    completePeek: () => void;
    specialElection: (targetId: string) => void;
    executePlayer: (targetId: string) => void;
    sendMessage: (message: string) => void;
    clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

const SESSION_STORAGE_KEY = 'secretChancellorSession';

// Use sessionStorage (per-tab) so multiple tabs can debug different players locally.
// Still reconnects after refresh in the same tab; each tab keeps its own gameId/playerName.
function getStoredSession(): { gameId: string; playerName: string } | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (!raw) return null;
        const data = JSON.parse(raw) as { gameId?: string; playerName?: string };
        if (data.gameId && data.playerName) return { gameId: data.gameId, playerName: data.playerName };
    } catch {
        // ignore
    }
    return null;
}

function saveSession(gameId: string, playerName: string): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ gameId, playerName }));
    } catch {
        // ignore
    }
}

function clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
        // ignore
    }
}

export function GameProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Track if player has explicitly left the game to prevent state updates
    const hasLeftGameRef = React.useRef(false);

    useEffect(() => {
        const socketInstance = getSocket();
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            console.log('Connected to server:', socketInstance.id);
            setPlayerId(socketInstance.id || null);
            setIsConnected(true);
            // Auto-reconnect: if we have a stored session, rejoin the game (e.g. after page reload)
            const session = getStoredSession();
            if (session && !hasLeftGameRef.current) {
                socketInstance.emit(SOCKET_EVENTS.JOIN_GAME, {
                    gameId: session.gameId,
                    playerName: session.playerName
                });
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socketInstance.on(SOCKET_EVENTS.GAME_STATE, (state: GameState) => {
            // Ignore game state updates if player has explicitly left
            if (hasLeftGameRef.current) {
                console.log('Ignoring game state update - player has left');
                return;
            }
            console.log('Received game state:', state.phase);
            setGameState(state);
            // Persist session so we can reconnect after reload
            const me = state.players.find(p => p.id === socketInstance.id);
            if (me) saveSession(state.gameId, me.name);
        });

        socketInstance.on(SOCKET_EVENTS.GAME_ERROR, (data: { message: string }) => {
            console.error('Game error:', data.message);
            setError(data.message);
            // Clear session if rejoin failed (game gone) so we don't retry on next connect
            if (data.message === 'Game not found') clearSession();
        });

        return () => {
            disconnectSocket();
        };
    }, []);

    const createGame = useCallback((playerName: string) => {
        hasLeftGameRef.current = false; // Reset flag when creating a new game
        socket?.emit(SOCKET_EVENTS.CREATE_GAME, { playerName });
    }, [socket]);

    const joinGame = useCallback((gameId: string, playerName: string) => {
        hasLeftGameRef.current = false; // Reset flag when joining a game
        socket?.emit(SOCKET_EVENTS.JOIN_GAME, { gameId, playerName });
    }, [socket]);

    const leaveGame = useCallback(() => {
        hasLeftGameRef.current = true; // Set flag to prevent future game state updates
        clearSession();
        socket?.emit(SOCKET_EVENTS.LEAVE_GAME);
        setGameState(null);
    }, [socket]);

    const startGame = useCallback(() => {
        socket?.emit(SOCKET_EVENTS.START_GAME);
    }, [socket]);

    const readyForNomination = useCallback(() => {
        socket?.emit(SOCKET_EVENTS.READY_FOR_NOMINATION);
    }, [socket]);

    const nominateChair = useCallback((chairId: string) => {
        socket?.emit(SOCKET_EVENTS.NOMINATE_CHAIR, { chairId });
    }, [socket]);

    const castVote = useCallback((vote: boolean) => {
        socket?.emit(SOCKET_EVENTS.CAST_VOTE, { vote });
    }, [socket]);

    const vcDiscard = useCallback((policyIndex: number) => {
        socket?.emit(SOCKET_EVENTS.VC_DISCARD, { policyIndex });
    }, [socket]);

    const chairEnact = useCallback((policyIndex: number) => {
        socket?.emit(SOCKET_EVENTS.CHAIR_ENACT, { policyIndex });
    }, [socket]);

    const investigate = useCallback((targetId: string) => {
        socket?.emit(SOCKET_EVENTS.INVESTIGATE, { targetId });
    }, [socket]);

    const completeInvestigation = useCallback(() => {
        socket?.emit(SOCKET_EVENTS.COMPLETE_INVESTIGATION);
    }, [socket]);

    const peekPolicies = useCallback(() => {
        socket?.emit(SOCKET_EVENTS.PEEK_POLICIES);
    }, [socket]);

    const completePeek = useCallback(() => {
        socket?.emit(SOCKET_EVENTS.COMPLETE_PEEK);
    }, [socket]);

    const specialElection = useCallback((targetId: string) => {
        socket?.emit(SOCKET_EVENTS.SPECIAL_ELECTION, { targetId });
    }, [socket]);

    const executePlayer = useCallback((targetId: string) => {
        socket?.emit(SOCKET_EVENTS.EXECUTE, { targetId });
    }, [socket]);

    const sendMessage = useCallback((message: string) => {
        socket?.emit(SOCKET_EVENTS.SEND_MESSAGE, { message });
    }, [socket]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return (
        <GameContext.Provider
            value={{
                socket,
                gameState,
                playerId,
                isConnected,
                error,
                createGame,
                joinGame,
                leaveGame,
                startGame,
                readyForNomination,
                nominateChair,
                castVote,
                vcDiscard,
                chairEnact,
                investigate,
                completeInvestigation,
                peekPolicies,
                completePeek,
                specialElection,
                executePlayer,
                sendMessage,
                clearError
            }}
        >
            {children}
        </GameContext.Provider>
    );
}

export function useGame(): GameContextType {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
}
