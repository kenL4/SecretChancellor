import { Server as SocketIOServer, Socket } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import { SOCKET_EVENTS } from '@/lib/socketEvents';
import { gameStore } from '@/lib/gameStore';
import { GamePhase, ExecutiveAction, GameState } from '@/lib/gameTypes';
import * as gameLogic from '@/lib/gameLogic';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SocketHandler = (req: NextApiRequest, res: NextApiResponse) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const socket = res.socket as any;
    if (!socket?.server) {
        res.status(500).end();
        return;
    }

    const server = socket.server;

    if (server.io) {
        console.log('Socket.io already running');
        res.end();
        return;
    }

    console.log('Initializing Socket.io server...');

    const io = new SocketIOServer(server, {
        path: '/api/socketio',
        addTrailingSlash: false,
    });

    server.io = io;

    io.on('connection', (clientSocket: Socket) => {
        console.log(`Client connected: ${clientSocket.id}`);

        // Create Game
        clientSocket.on(SOCKET_EVENTS.CREATE_GAME, (data: { playerName: string }) => {
            try {
                const game = gameLogic.createGame(clientSocket.id, data.playerName);
                gameStore.setGame(game);
                gameStore.setPlayerGame(clientSocket.id, game.gameId);

                clientSocket.join(game.gameId);
                clientSocket.emit(SOCKET_EVENTS.GAME_STATE, gameLogic.getSanitizedGameState(game, clientSocket.id));
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Join Game
        clientSocket.on(SOCKET_EVENTS.JOIN_GAME, (data: { gameId: string; playerName: string }) => {
            try {
                let game = gameStore.getGame(data.gameId);

                if (!game) {
                    throw new Error('Game not found');
                }

                // Check if player is reconnecting
                const existingPlayer = game.players.find(p => p.name === data.playerName);
                if (existingPlayer) {
                    game = gameLogic.reconnectPlayer(game, existingPlayer.id);
                    gameStore.setGame(game);
                    gameStore.setPlayerGame(clientSocket.id, game.gameId);
                    clientSocket.join(game.gameId);
                    broadcastGameState(io, game);
                    return;
                }

                game = gameLogic.addPlayer(game, clientSocket.id, data.playerName);
                gameStore.setGame(game);
                gameStore.setPlayerGame(clientSocket.id, game.gameId);

                clientSocket.join(game.gameId);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Leave Game
        clientSocket.on(SOCKET_EVENTS.LEAVE_GAME, () => {
            handlePlayerLeave(io, clientSocket);
        });

        // Start Game
        clientSocket.on(SOCKET_EVENTS.START_GAME, () => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');
                if (game.hostId !== clientSocket.id) throw new Error('Only host can start');

                game = gameLogic.startGame(game);
                gameStore.setGame(game);
                broadcastGameState(io, game);

                // Auto-transition to nomination phase after role reveal
                setTimeout(() => {
                    const currentGame = gameStore.getGame(gameId);
                    if (currentGame && currentGame.phase === GamePhase.ROLE_REVEAL) {
                        const updatedGame = gameLogic.startNomination(currentGame);
                        gameStore.setGame(updatedGame);
                        broadcastGameState(io, updatedGame);
                    }
                }, 10000);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Ready for Nomination
        clientSocket.on(SOCKET_EVENTS.READY_FOR_NOMINATION, () => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');
                if (game.phase !== GamePhase.ROLE_REVEAL) throw new Error('Not in role reveal phase');

                game = gameLogic.startNomination(game);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Nominate Chair
        clientSocket.on(SOCKET_EVENTS.NOMINATE_CHAIR, (data: { chairId: string }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                game = gameLogic.nominateChair(game, clientSocket.id, data.chairId);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Cast Vote
        clientSocket.on(SOCKET_EVENTS.CAST_VOTE, (data: { vote: boolean }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                console.log(`[CAST_VOTE] Player ${clientSocket.id} voted ${data.vote}, Phase before: ${game.phase}`);

                game = gameLogic.castVote(game, clientSocket.id, data.vote);
                gameStore.setGame(game);

                const phaseBefore = game.phase;
                game = gameLogic.tallyVotes(game);
                gameStore.setGame(game);

                console.log(`[CAST_VOTE] Phase after tallyVotes: ${game.phase} (was ${phaseBefore})`);
                console.log(`[CAST_VOTE] DrawnPolicies: ${game.drawnPolicies.length}, VC: ${game.players.find(p => p.isViceChancellor)?.name}`);

                broadcastGameState(io, game);
            } catch (error) {
                console.error('[CAST_VOTE] Error:', (error as Error).message);
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Vice-Chancellor Discard Policy
        clientSocket.on(SOCKET_EVENTS.VC_DISCARD, (data: { policyIndex: number }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                game = gameLogic.vcDiscardPolicy(game, clientSocket.id, data.policyIndex);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Chair Enact Policy
        clientSocket.on(SOCKET_EVENTS.CHAIR_ENACT, (data: { policyIndex: number }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                game = gameLogic.chairEnactPolicy(game, clientSocket.id, data.policyIndex);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Investigate Player
        clientSocket.on(SOCKET_EVENTS.INVESTIGATE, (data: { targetId: string }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');
                if (game.pendingExecutiveAction !== ExecutiveAction.INVESTIGATE) {
                    throw new Error('No investigation pending');
                }

                game = gameLogic.investigatePlayer(game, clientSocket.id, data.targetId);
                gameStore.setGame(game);

                clientSocket.emit(SOCKET_EVENTS.GAME_STATE, gameLogic.getSanitizedGameState(game, clientSocket.id));
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Complete Investigation
        clientSocket.on(SOCKET_EVENTS.COMPLETE_INVESTIGATION, () => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                game = gameLogic.completeInvestigation(game);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Peek Policies
        clientSocket.on(SOCKET_EVENTS.PEEK_POLICIES, () => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');
                if (game.pendingExecutiveAction !== ExecutiveAction.PEEK_POLICIES) {
                    throw new Error('No peek pending');
                }

                game = gameLogic.peekPolicies(game, clientSocket.id);
                gameStore.setGame(game);

                clientSocket.emit(SOCKET_EVENTS.GAME_STATE, gameLogic.getSanitizedGameState(game, clientSocket.id));
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Complete Peek
        clientSocket.on(SOCKET_EVENTS.COMPLETE_PEEK, () => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                game = gameLogic.completePeek(game);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Special Election
        clientSocket.on(SOCKET_EVENTS.SPECIAL_ELECTION, (data: { targetId: string }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');
                if (game.pendingExecutiveAction !== ExecutiveAction.SPECIAL_ELECTION) {
                    throw new Error('No special election pending');
                }

                game = gameLogic.specialElection(game, clientSocket.id, data.targetId);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Execute Player
        clientSocket.on(SOCKET_EVENTS.EXECUTE, (data: { targetId: string }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');
                if (game.pendingExecutiveAction !== ExecutiveAction.EXECUTION) {
                    throw new Error('No execution pending');
                }

                game = gameLogic.executePlayer(game, clientSocket.id, data.targetId);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Send Chat Message
        clientSocket.on(SOCKET_EVENTS.SEND_MESSAGE, (data: { message: string }) => {
            try {
                const gameId = gameStore.getPlayerGame(clientSocket.id);
                if (!gameId) throw new Error('Not in a game');

                let game = gameStore.getGame(gameId);
                if (!game) throw new Error('Game not found');

                game = gameLogic.addChatMessage(game, clientSocket.id, data.message);
                gameStore.setGame(game);
                broadcastGameState(io, game);
            } catch (error) {
                clientSocket.emit(SOCKET_EVENTS.GAME_ERROR, { message: (error as Error).message });
            }
        });

        // Handle disconnect
        clientSocket.on('disconnect', () => {
            console.log(`Client disconnected: ${clientSocket.id}`);
            handlePlayerLeave(io, clientSocket);
        });
    });

    console.log('Socket.io server initialized');
    res.end();
};

function handlePlayerLeave(io: SocketIOServer, socket: Socket) {
    const gameId = gameStore.getPlayerGame(socket.id);
    if (!gameId) return;

    // IMPORTANT: Remove player from room and mappings FIRST, before any broadcast
    // This prevents the leaving player from receiving the game state update
    socket.leave(gameId);
    gameStore.removePlayerFromGame(socket.id);

    let game = gameStore.getGame(gameId);
    if (!game) return;

    game = gameLogic.removePlayer(game, socket.id);

    if (game.players.length === 0) {
        gameStore.deleteGame(gameId);
    } else {
        if (game.hostId === socket.id) {
            const newHost = game.players.find(p => p.connected);
            if (newHost) {
                game = { ...game, hostId: newHost.id };
            }
        }
        gameStore.setGame(game);
        broadcastGameState(io, game);
    }
}

function broadcastGameState(io: SocketIOServer, game: GameState) {
    game.players.forEach(player => {
        const sanitizedState = gameLogic.getSanitizedGameState(game, player.id);
        io.to(player.id).emit(SOCKET_EVENTS.GAME_STATE, sanitizedState);
    });
}

export default SocketHandler;
