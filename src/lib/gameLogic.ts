// Game Logic for Secret Chancellor

import { v4 as uuidv4 } from 'uuid';
import {
    GameState,
    Player,
    Role,
    PolicyType,
    GamePhase,
    ExecutiveAction,
    EXECUTIVE_ACTIONS,
    ROLE_DISTRIBUTION,
    ChatMessage,
    Policy
} from './gameTypes';

// Student-relatable policy names
const SU_POLICY_NAMES = ['Free Formals', 'Lower Rent', '24/7 Library', 'Student Voice', 'Free Printing', 'Exam Reform', 'Mental Health', 'Bike Lanes', 'No Supervision', 'Bar Prices ↓'];
const ADMIN_POLICY_NAMES = ['Tuition ↑', 'Library Cuts', 'CCTV', 'Ban Protests', 'Rent ↑', 'Gate Hours', 'Formal Rules', 'Supervision+', 'Budget Cuts', 'More Exams', 'Curfew'];

// Create initial policy deck (6 SU + 11 Admin = 17 policies)
export function createPolicyDeck(): Policy[] {
    const deck: Policy[] = [];

    // Create 6 SU policies with names
    for (let i = 0; i < 6; i++) {
        deck.push({
            id: uuidv4(),
            type: PolicyType.STUDENT_UNION,
            name: SU_POLICY_NAMES[i % SU_POLICY_NAMES.length]
        });
    }

    // Create 11 Admin policies with names
    for (let i = 0; i < 11; i++) {
        deck.push({
            id: uuidv4(),
            type: PolicyType.ADMIN,
            name: ADMIN_POLICY_NAMES[i % ADMIN_POLICY_NAMES.length]
        });
    }

    return shuffleArray(deck);
}

// Shuffle array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Assign roles to players
export function assignRoles(players: Player[]): Player[] {
    const numPlayers = players.length;
    const distribution = ROLE_DISTRIBUTION[numPlayers];

    if (!distribution) {
        throw new Error(`Invalid number of players: ${numPlayers}`);
    }

    const roles: Role[] = [];

    // Add Chancellor (always 1)
    roles.push(Role.CHANCELLOR);

    // Add Chancellor's Office members
    for (let i = 0; i < distribution.chancellorsOffice; i++) {
        roles.push(Role.CHANCELLORS_OFFICE);
    }

    // Add Student Union members
    for (let i = 0; i < distribution.studentUnion; i++) {
        roles.push(Role.STUDENT_UNION);
    }

    // Shuffle roles
    const shuffledRoles = shuffleArray(roles);

    // Assign roles to players
    return players.map((player, index) => ({
        ...player,
        role: shuffledRoles[index]
    }));
}

// Create a new game
export function createGame(hostId: string, hostName: string): GameState {
    const gameId = uuidv4().substring(0, 6).toUpperCase();

    return {
        gameId,
        players: [{
            id: hostId,
            name: hostName,
            isAlive: true,
            isViceChancellor: false,
            isPolicyChair: false,
            hasBeenInvestigated: false,
            vote: null,
            connected: true
        }],
        hostId,
        phase: GamePhase.LOBBY,
        studentUnionPolicies: [],
        adminPolicies: [],
        policyDeck: [],
        discardPile: [],
        currentViceChancellorIndex: 0,
        nominatedChairId: null,
        drawnPolicies: [],
        policiesForChair: [],
        failedElections: 0,
        lastViceChancellorId: null,
        lastChairId: null,
        pendingExecutiveAction: null,
        investigatedPlayerId: null,
        peekedPolicies: [],
        winner: null,
        winReason: null,
        messages: [],
        phaseEndTime: null,
        phaseDuration: 60000 // Default 60 seconds per phase
    };
}

// Add player to game
export function addPlayer(game: GameState, playerId: string, playerName: string): GameState {
    if (game.players.length >= 10) {
        throw new Error('Game is full');
    }

    if (game.phase !== GamePhase.LOBBY) {
        throw new Error('Game has already started');
    }

    if (game.players.find(p => p.id === playerId)) {
        throw new Error('Player already in game');
    }

    const newPlayer: Player = {
        id: playerId,
        name: playerName,
        isAlive: true,
        isViceChancellor: false,
        isPolicyChair: false,
        hasBeenInvestigated: false,
        vote: null,
        connected: true
    };

    return {
        ...game,
        players: [...game.players, newPlayer]
    };
}

// Start the game
export function startGame(game: GameState): GameState {
    if (game.players.length < 5) {
        throw new Error('Need at least 5 players to start');
    }

    // Assign roles
    const playersWithRoles = assignRoles(game.players);

    // Pick random starting Vice-Chancellor
    const startingVCIndex = Math.floor(Math.random() * playersWithRoles.length);
    playersWithRoles[startingVCIndex].isViceChancellor = true;

    return {
        ...game,
        players: playersWithRoles,
        policyDeck: createPolicyDeck(),
        discardPile: [],
        studentUnionPolicies: [],
        adminPolicies: [],
        phase: GamePhase.ROLE_REVEAL,
        currentViceChancellorIndex: startingVCIndex,
        phaseEndTime: Date.now() + 10000 // 10 seconds for role reveal
    };
}

// Move to nomination phase
export function startNomination(game: GameState): GameState {
    const alivePlayers = game.players.filter(p => p.isAlive);

    // Reset votes
    const playersWithResetVotes = game.players.map(p => ({
        ...p,
        vote: null,
        isPolicyChair: false
    }));

    // Set Vice-Chancellor
    const vcIndex = game.currentViceChancellorIndex % alivePlayers.length;
    const vcId = alivePlayers[vcIndex].id;

    const playersWithVC = playersWithResetVotes.map(p => ({
        ...p,
        isViceChancellor: p.id === vcId
    }));

    return {
        ...game,
        players: playersWithVC,
        phase: GamePhase.NOMINATE_CHAIR,
        nominatedChairId: null,
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Nominate a Policy Chair
export function nominateChair(game: GameState, vcId: string, chairId: string): GameState {
    const vc = game.players.find(p => p.id === vcId);
    const chair = game.players.find(p => p.id === chairId);

    if (!vc || !vc.isViceChancellor) {
        throw new Error('Only Vice-Chancellor can nominate');
    }

    if (!chair || !chair.isAlive) {
        throw new Error('Invalid chair nomination');
    }

    if (chairId === vcId) {
        throw new Error('Cannot nominate yourself');
    }

    // Check term limits
    const alivePlayers = game.players.filter(p => p.isAlive);
    if (alivePlayers.length > 5) {
        if (chairId === game.lastChairId || chairId === game.lastViceChancellorId) {
            throw new Error('This player is term-limited');
        }
    } else {
        if (chairId === game.lastChairId) {
            throw new Error('This player was the last Policy Chair');
        }
    }

    return {
        ...game,
        nominatedChairId: chairId,
        phase: GamePhase.VOTING,
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Cast vote
export function castVote(game: GameState, playerId: string, vote: boolean): GameState {
    const player = game.players.find(p => p.id === playerId);

    if (!player || !player.isAlive) {
        throw new Error('Player cannot vote');
    }

    const updatedPlayers = game.players.map(p =>
        p.id === playerId ? { ...p, vote } : p
    );

    return {
        ...game,
        players: updatedPlayers
    };
}

// Tally votes and process result
export function tallyVotes(game: GameState): GameState {
    const alivePlayers = game.players.filter(p => p.isAlive);
    // Check for votes that are explicitly true or false (not null or undefined)
    const votes = alivePlayers.filter(p => p.vote === true || p.vote === false);

    console.log(`[tallyVotes] Alive: ${alivePlayers.length}, Voted: ${votes.length}, Votes:`, votes.map(p => ({ name: p.name, vote: p.vote })));

    // Check if all votes are in
    if (votes.length !== alivePlayers.length) {
        return game;
    }

    const yesVotes = votes.filter(p => p.vote === true).length;
    const noVotes = votes.filter(p => p.vote === false).length;
    const majority = Math.floor(alivePlayers.length / 2) + 1;

    console.log(`[tallyVotes] Yes: ${yesVotes}, No: ${noVotes}, Majority needed: ${majority}`);

    if (yesVotes >= majority) {
        // Election passed
        return processElectionSuccess(game);
    } else {
        // Election failed
        return processElectionFailure(game);
    }
}

// Process successful election
function processElectionSuccess(game: GameState): GameState {
    const chair = game.players.find(p => p.id === game.nominatedChairId);
    const vc = game.players.find(p => p.isViceChancellor);

    if (!chair || !vc) {
        throw new Error('Invalid election state');
    }

    // Check Chancellor win condition
    if (game.adminPolicies.length >= 3 && chair.role === Role.CHANCELLOR) {
        return {
            ...game,
            phase: GamePhase.GAME_OVER,
            winner: 'ADMIN',
            winReason: 'The Chancellor was elected Policy Chair after 3 Admin policies were enacted!'
        };
    }

    // Set chair
    const updatedPlayers = game.players.map(p => ({
        ...p,
        isPolicyChair: p.id === game.nominatedChairId
    }));

    // Draw 3 policies
    let deck = [...game.policyDeck];
    let discard = [...game.discardPile];

    // Reshuffle if needed
    if (deck.length < 3) {
        deck = shuffleArray([...deck, ...discard]);
        discard = [];
    }

    const drawnPolicies = deck.splice(0, 3);

    return {
        ...game,
        players: updatedPlayers,
        policyDeck: deck,
        discardPile: discard,
        drawnPolicies,
        failedElections: 0,
        lastViceChancellorId: vc.id,
        lastChairId: chair.id,
        phase: GamePhase.POLICY_DRAW,
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Process failed election
function processElectionFailure(game: GameState): GameState {
    const newFailedElections = game.failedElections + 1;

    if (newFailedElections >= 3) {
        // Chaos - enact top policy
        return enactChaosPolicy(game);
    }

    // Move to next Vice-Chancellor
    const alivePlayers = game.players.filter(p => p.isAlive);
    const nextVCIndex = (game.currentViceChancellorIndex + 1) % alivePlayers.length;
    const nextVCId = alivePlayers[nextVCIndex].id;

    console.log(`[processElectionFailure] Election failed (${newFailedElections}/3), Next VC: ${alivePlayers[nextVCIndex].name}`);

    // Update players to set new VC and reset votes
    const updatedPlayers = game.players.map(p => ({
        ...p,
        isViceChancellor: p.id === nextVCId,
        vote: null
    }));

    return {
        ...game,
        players: updatedPlayers,
        failedElections: newFailedElections,
        currentViceChancellorIndex: nextVCIndex,
        nominatedChairId: null,
        phase: GamePhase.NOMINATE_CHAIR,
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Enact chaos policy (3 failed elections)
function enactChaosPolicy(game: GameState): GameState {
    let deck = [...game.policyDeck];
    let discard = [...game.discardPile];

    if (deck.length < 1) {
        deck = shuffleArray([...deck, ...discard]);
        discard = [];
    }

    const policy = deck.shift()!;

    let newGame = {
        ...game,
        policyDeck: deck,
        discardPile: discard,
        failedElections: 0,
        lastViceChancellorId: null,
        lastChairId: null // Term limits reset
    };

    return enactPolicy(newGame, policy, true);
}

// Vice-Chancellor discards policy
export function vcDiscardPolicy(game: GameState, vcId: string, policyIndex: number): GameState {
    const vc = game.players.find(p => p.id === vcId);

    if (!vc || !vc.isViceChancellor) {
        throw new Error('Only Vice-Chancellor can discard');
    }

    if (policyIndex < 0 || policyIndex >= game.drawnPolicies.length) {
        throw new Error('Invalid policy index');
    }

    const discardedPolicy = game.drawnPolicies[policyIndex];
    const policiesForChair = game.drawnPolicies.filter((_, i) => i !== policyIndex);

    return {
        ...game,
        drawnPolicies: [],
        policiesForChair,
        discardPile: [...game.discardPile, discardedPolicy],
        phase: GamePhase.POLICY_CHAIR,
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Chair enacts policy
export function chairEnactPolicy(game: GameState, chairId: string, policyIndex: number): GameState {
    const chair = game.players.find(p => p.id === chairId);

    if (!chair || !chair.isPolicyChair) {
        throw new Error('Only Policy Chair can enact');
    }

    if (policyIndex < 0 || policyIndex >= game.policiesForChair.length) {
        throw new Error('Invalid policy index');
    }

    const enactedPolicy = game.policiesForChair[policyIndex];
    const discardedPolicy = game.policiesForChair.find((_, i) => i !== policyIndex);

    let newGame = {
        ...game,
        policiesForChair: [],
        discardPile: discardedPolicy ? [...game.discardPile, discardedPolicy] : game.discardPile
    };

    return enactPolicy(newGame, enactedPolicy, false);
}

// Enact a policy and check win conditions
function enactPolicy(game: GameState, policy: Policy, isChaos: boolean): GameState {
    let newGame = { ...game };

    if (policy.type === PolicyType.STUDENT_UNION) {
        newGame.studentUnionPolicies = [...newGame.studentUnionPolicies, policy];

        // Check SU win
        if (newGame.studentUnionPolicies.length >= 5) {
            return {
                ...newGame,
                phase: GamePhase.GAME_OVER,
                winner: 'STUDENT_UNION',
                winReason: '5 Student Union policies have been enacted!'
            };
        }
    } else {
        newGame.adminPolicies = [...newGame.adminPolicies, policy];

        // Check Admin win
        if (newGame.adminPolicies.length >= 6) {
            return {
                ...newGame,
                phase: GamePhase.GAME_OVER,
                winner: 'ADMIN',
                winReason: '6 Admin policies have been enacted!'
            };
        }

        // Check for executive action (no action on chaos)
        if (!isChaos) {
            const numPlayers = game.players.length;
            // policy 1 => index 0
            const actionIndex = newGame.adminPolicies.length - 1;
            const action = EXECUTIVE_ACTIONS[numPlayers]?.[actionIndex] || ExecutiveAction.NONE;

            if (action !== ExecutiveAction.NONE) {
                return {
                    ...newGame,
                    phase: GamePhase.EXECUTIVE_ACTION,
                    pendingExecutiveAction: action,
                    phaseEndTime: Date.now() + game.phaseDuration
                };
            }
        }
    }

    // Move to next round
    return advanceViceChancellor(newGame);
}

// Advance to next Vice-Chancellor
function advanceViceChancellor(game: GameState): GameState {
    const alivePlayers = game.players.filter(p => p.isAlive);
    const nextVCIndex = (game.currentViceChancellorIndex + 1) % alivePlayers.length;

    // Get the ID of the next Vice-Chancellor from alive players
    const nextVCId = alivePlayers[nextVCIndex].id;

    console.log(`[advanceViceChancellor] Next VC index: ${nextVCIndex}, Next VC: ${alivePlayers[nextVCIndex].name}`);

    const updatedPlayers = game.players.map(p => ({
        ...p,
        isViceChancellor: p.id === nextVCId, // Set to true ONLY for the new VC
        isPolicyChair: false,
        vote: null
    }));

    return {
        ...game,
        players: updatedPlayers,
        currentViceChancellorIndex: nextVCIndex,
        phase: GamePhase.NOMINATE_CHAIR,
        nominatedChairId: null,
        drawnPolicies: [],
        policiesForChair: [],
        pendingExecutiveAction: null,
        peekedPolicies: [],
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Executive Actions

// Investigate a player
export function investigatePlayer(game: GameState, vcId: string, targetId: string): GameState {
    const vc = game.players.find(p => p.id === vcId);
    const target = game.players.find(p => p.id === targetId);

    if (!vc || !vc.isViceChancellor) {
        throw new Error('Only Vice-Chancellor can investigate');
    }

    if (!target || !target.isAlive || target.hasBeenInvestigated) {
        throw new Error('Invalid investigation target');
    }

    if (targetId === vcId) {
        throw new Error('Cannot investigate yourself');
    }

    const updatedPlayers = game.players.map(p =>
        p.id === targetId ? { ...p, hasBeenInvestigated: true } : p
    );

    return {
        ...game,
        players: updatedPlayers,
        investigatedPlayerId: targetId
    };
}

// Complete investigation and advance
export function completeInvestigation(game: GameState): GameState {
    return advanceViceChancellor({
        ...game,
        investigatedPlayerId: null
    });
}

// Peek at top 3 policies
export function peekPolicies(game: GameState, vcId: string): GameState {
    const vc = game.players.find(p => p.id === vcId);

    if (!vc || !vc.isViceChancellor) {
        throw new Error('Only Vice-Chancellor can peek');
    }

    const peekedPolicies = game.policyDeck.slice(0, 3);

    return {
        ...game,
        peekedPolicies
    };
}

// Complete peek and advance
export function completePeek(game: GameState): GameState {
    return advanceViceChancellor({
        ...game,
        peekedPolicies: []
    });
}

// Special election - choose next Vice-Chancellor
export function specialElection(game: GameState, vcId: string, targetId: string): GameState {
    const vc = game.players.find(p => p.id === vcId);
    const target = game.players.find(p => p.id === targetId);

    if (!vc || !vc.isViceChancellor) {
        throw new Error('Only Vice-Chancellor can call special election');
    }

    if (!target || !target.isAlive || targetId === vcId) {
        throw new Error('Invalid election target');
    }

    const alivePlayers = game.players.filter(p => p.isAlive);
    const targetIndex = alivePlayers.findIndex(p => p.id === targetId);

    const updatedPlayers = game.players.map(p => ({
        ...p,
        isViceChancellor: p.id === targetId,
        isPolicyChair: false,
        vote: null
    }));

    return {
        ...game,
        players: updatedPlayers,
        currentViceChancellorIndex: targetIndex,
        phase: GamePhase.NOMINATE_CHAIR,
        nominatedChairId: null,
        pendingExecutiveAction: null,
        phaseEndTime: Date.now() + game.phaseDuration
    };
}

// Ban a player
export function executePlayer(game: GameState, vcId: string, targetId: string): GameState {
    const vc = game.players.find(p => p.id === vcId);
    const target = game.players.find(p => p.id === targetId);

    if (!vc || !vc.isViceChancellor) {
        throw new Error('Only Vice-Chancellor can ban');
    }

    if (!target || !target.isAlive || targetId === vcId) {
        throw new Error('Invalid execution target');
    }

    // Check if Chancellor was banned - SU wins!
    if (target.role === Role.CHANCELLOR) {
        return {
            ...game,
            phase: GamePhase.GAME_OVER,
            winner: 'STUDENT_UNION',
            winReason: 'The Chancellor has been banned!'
        };
    }

    const updatedPlayers = game.players.map(p =>
        p.id === targetId ? { ...p, isAlive: false } : p
    );

    return advanceViceChancellor({
        ...game,
        players: updatedPlayers
    });
}

// Add chat message
export function addChatMessage(game: GameState, playerId: string, message: string): GameState {
    const player = game.players.find(p => p.id === playerId);

    if (!player) {
        return game;
    }

    const chatMessage: ChatMessage = {
        id: uuidv4(),
        playerId,
        playerName: player.name,
        message,
        timestamp: Date.now()
    };

    return {
        ...game,
        messages: [...game.messages, chatMessage].slice(-100) // Keep last 100 messages
    };
}

// Reconnect player
export function reconnectPlayer(game: GameState, playerId: string): GameState {
    return {
        ...game,
        players: game.players.map(p =>
            p.id === playerId ? { ...p, connected: true } : p
        )
    };
}

// Disconnect player
export function disconnectPlayer(game: GameState, playerId: string): GameState {
    return {
        ...game,
        players: game.players.map(p =>
            p.id === playerId ? { ...p, connected: false } : p
        )
    };
}

// Remove player (only in lobby)
export function removePlayer(game: GameState, playerId: string): GameState {
    if (game.phase !== GamePhase.LOBBY) {
        return disconnectPlayer(game, playerId);
    }

    return {
        ...game,
        players: game.players.filter(p => p.id !== playerId)
    };
}

// Get sanitized game state for a specific player (hides other players' roles)
export function getSanitizedGameState(game: GameState, playerId: string): GameState {
    const player = game.players.find(p => p.id === playerId);

    if (!player) {
        return game;
    }

    // During game over, reveal all roles
    if (game.phase === GamePhase.GAME_OVER) {
        return game;
    }

    // Sanitize player roles
    const sanitizedPlayers = game.players.map(p => {
        if (p.id === playerId) {
            return p; // Keep own role
        }

        // Chancellor's Office and Chancellor can see each other
        if (player.role === Role.CHANCELLORS_OFFICE || player.role === Role.CHANCELLOR) {
            if (p.role === Role.CHANCELLORS_OFFICE || p.role === Role.CHANCELLOR) {
                return p; // Show role
            }
        }

        // Hide role from Student Union
        return { ...p, role: undefined };
    });

    // Hide drawn policies from non-VC
    const sanitizedDrawnPolicies = player.isViceChancellor ? game.drawnPolicies : [];

    // Hide chair policies from non-chair
    const sanitizedChairPolicies = player.isPolicyChair ? game.policiesForChair : [];

    // Hide peeked policies from non-VC
    const sanitizedPeekedPolicies = player.isViceChancellor ? game.peekedPolicies : [];

    // Hide investigated player's party from non-VC
    let sanitizedInvestigatedId = game.investigatedPlayerId;
    let investigatedPlayerRole: Role | undefined;

    if (game.investigatedPlayerId && player.isViceChancellor) {
        const investigated = game.players.find(p => p.id === game.investigatedPlayerId);
        if (investigated) {
            investigatedPlayerRole = investigated.role === Role.CHANCELLOR
                ? Role.CHANCELLORS_OFFICE // Chancellor shows as Chancellor's Office
                : investigated.role;
        }
    }

    return {
        ...game,
        players: sanitizedPlayers,
        drawnPolicies: sanitizedDrawnPolicies,
        policiesForChair: sanitizedChairPolicies,
        peekedPolicies: sanitizedPeekedPolicies,
        policyDeck: [], // Never expose deck
        discardPile: [] // Never expose discard
    };
}
