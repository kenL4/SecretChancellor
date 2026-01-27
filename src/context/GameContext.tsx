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

export function GameProvider({ children }: { children: ReactNode }) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const socketInstance = getSocket();
        setSocket(socketInstance);

        socketInstance.on('connect', () => {
            console.log('Connected to server:', socketInstance.id);
            setPlayerId(socketInstance.id || null);
            setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
            console.log('Disconnected from server');
            setIsConnected(false);
        });

        socketInstance.on(SOCKET_EVENTS.GAME_STATE, (state: GameState) => {
            console.log('Received game state:', state.phase);
            setGameState(state);
        });

        socketInstance.on(SOCKET_EVENTS.GAME_ERROR, (data: { message: string }) => {
            console.error('Game error:', data.message);
            setError(data.message);
        });

        return () => {
            disconnectSocket();
        };
    }, []);

    const createGame = useCallback((playerName: string) => {
        socket?.emit(SOCKET_EVENTS.CREATE_GAME, { playerName });
    }, [socket]);

    const joinGame = useCallback((gameId: string, playerName: string) => {
        socket?.emit(SOCKET_EVENTS.JOIN_GAME, { gameId, playerName });
    }, [socket]);

    const leaveGame = useCallback(() => {
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
