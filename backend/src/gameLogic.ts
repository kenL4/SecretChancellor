// Game Logic for Secret Chancellor (backend)
// Uses Node built-in crypto.randomUUID() (Node 18+) to avoid ESM/CommonJS issues

import crypto from 'crypto';
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

const SU_POLICY_NAMES = ['Free Formals', 'Lower Rent', '24/7 Library', 'Student Voice', 'Free Printing', 'Exam Reform', 'Mental Health', 'Bike Lanes', 'No Supervision', 'Bar Prices ↓'];
const ADMIN_POLICY_NAMES = ['Tuition ↑', 'Library Cuts', 'CCTV', 'Ban Protests', 'Rent ↑', 'Gate Hours', 'Formal Rules', 'Supervision+', 'Budget Cuts', 'More Exams', 'Curfew'];

export function createPolicyDeck(): Policy[] {
  const deck: Policy[] = [];
  for (let i = 0; i < 6; i++) {
    deck.push({ id: crypto.randomUUID(), type: PolicyType.STUDENT_UNION, name: SU_POLICY_NAMES[i % SU_POLICY_NAMES.length] });
  }
  for (let i = 0; i < 11; i++) {
    deck.push({ id: crypto.randomUUID(), type: PolicyType.ADMIN, name: ADMIN_POLICY_NAMES[i % ADMIN_POLICY_NAMES.length] });
  }
  return shuffleArray(deck);
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function assignRoles(players: Player[]): Player[] {
  const numPlayers = players.length;
  const distribution = ROLE_DISTRIBUTION[numPlayers];
  if (!distribution) throw new Error(`Invalid number of players: ${numPlayers}`);
  const roles: Role[] = [Role.CHANCELLOR];
  for (let i = 0; i < distribution.chancellorsOffice; i++) roles.push(Role.CHANCELLORS_OFFICE);
  for (let i = 0; i < distribution.studentUnion; i++) roles.push(Role.STUDENT_UNION);
  const shuffledRoles = shuffleArray(roles);
  return players.map((player, index) => ({ ...player, role: shuffledRoles[index] }));
}

export function createGame(hostId: string, hostName: string): GameState {
  const gameId = crypto.randomUUID().replace(/-/g, '').substring(0, 6).toUpperCase();
  return {
    gameId,
    players: [{ id: hostId, name: hostName, isAlive: true, isViceChancellor: false, isPolicyChair: false, hasBeenInvestigated: false, vote: null, connected: true }],
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
    phaseDuration: 60000
  };
}

export function addPlayer(game: GameState, playerId: string, playerName: string): GameState {
  if (game.players.length >= 10) throw new Error('Game is full');
  if (game.phase !== GamePhase.LOBBY) throw new Error('Game has already started');
  if (game.players.find(p => p.id === playerId)) throw new Error('Player already in game');
  const newPlayer: Player = { id: playerId, name: playerName, isAlive: true, isViceChancellor: false, isPolicyChair: false, hasBeenInvestigated: false, vote: null, connected: true };
  return { ...game, players: [...game.players, newPlayer] };
}

export function startGame(game: GameState): GameState {
  if (game.players.length < 5) throw new Error('Need at least 5 players to start');
  const playersWithRoles = assignRoles(game.players);
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
    phaseEndTime: Date.now() + 10000
  };
}

export function startNomination(game: GameState): GameState {
  const alivePlayers = game.players.filter(p => p.isAlive);
  const playersWithResetVotes = game.players.map(p => ({ ...p, vote: null, isPolicyChair: false }));
  const vcIndex = game.currentViceChancellorIndex % alivePlayers.length;
  const vcId = alivePlayers[vcIndex].id;
  const playersWithVC = playersWithResetVotes.map(p => ({ ...p, isViceChancellor: p.id === vcId }));
  return { ...game, players: playersWithVC, phase: GamePhase.NOMINATE_CHAIR, nominatedChairId: null, phaseEndTime: Date.now() + game.phaseDuration };
}

export function nominateChair(game: GameState, vcId: string, chairId: string): GameState {
  const vc = game.players.find(p => p.id === vcId);
  const chair = game.players.find(p => p.id === chairId);
  if (!vc || !vc.isViceChancellor) throw new Error('Only Vice-Chancellor can nominate');
  if (!chair || !chair.isAlive) throw new Error('Invalid chair nomination');
  if (chairId === vcId) throw new Error('Cannot nominate yourself');
  const alivePlayers = game.players.filter(p => p.isAlive);
  if (alivePlayers.length > 5) {
    if (chairId === game.lastChairId || chairId === game.lastViceChancellorId) throw new Error('This player is term-limited');
  } else {
    if (chairId === game.lastChairId) throw new Error('This player was the last Policy Chair');
  }
  return { ...game, nominatedChairId: chairId, phase: GamePhase.VOTING, phaseEndTime: Date.now() + game.phaseDuration };
}

export function castVote(game: GameState, playerId: string, vote: boolean): GameState {
  const player = game.players.find(p => p.id === playerId);
  if (!player || !player.isAlive) throw new Error('Player cannot vote');
  const updatedPlayers = game.players.map(p => (p.id === playerId ? { ...p, vote } : p));
  return { ...game, players: updatedPlayers };
}

function processElectionSuccess(game: GameState): GameState {
  const chair = game.players.find(p => p.id === game.nominatedChairId);
  const vc = game.players.find(p => p.isViceChancellor);
  if (!chair || !vc) throw new Error('Invalid election state');
  if (game.adminPolicies.length >= 3 && chair.role === Role.CHANCELLOR) {
    return { ...game, phase: GamePhase.GAME_OVER, winner: 'ADMIN', winReason: 'The Chancellor was elected Policy Chair after 3 Admin policies were enacted!' };
  }
  const updatedPlayers = game.players.map(p => ({ ...p, isPolicyChair: p.id === game.nominatedChairId }));
  let deck = [...game.policyDeck];
  let discard = [...game.discardPile];
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

function processElectionFailure(game: GameState): GameState {
  const newFailedElections = game.failedElections + 1;
  if (newFailedElections >= 3) return enactChaosPolicy(game);
  const alivePlayers = game.players.filter(p => p.isAlive);
  const nextVCIndex = (game.currentViceChancellorIndex + 1) % alivePlayers.length;
  const nextVCId = alivePlayers[nextVCIndex].id;
  const updatedPlayers = game.players.map(p => ({ ...p, isViceChancellor: p.id === nextVCId, vote: null }));
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

function enactChaosPolicy(game: GameState): GameState {
  let deck = [...game.policyDeck];
  let discard = [...game.discardPile];
  if (deck.length < 1) {
    deck = shuffleArray([...deck, ...discard]);
    discard = [];
  }
  const policy = deck.shift()!;
  const newGame = { ...game, policyDeck: deck, discardPile: discard, failedElections: 0, lastViceChancellorId: null, lastChairId: null };
  return enactPolicy(newGame, policy, true);
}

export function tallyVotes(game: GameState): GameState {
  const alivePlayers = game.players.filter(p => p.isAlive);
  const votes = alivePlayers.filter(p => p.vote === true || p.vote === false);
  if (votes.length !== alivePlayers.length) return game;
  const yesVotes = votes.filter(p => p.vote === true).length;
  const majority = Math.floor(alivePlayers.length / 2) + 1;
  return yesVotes >= majority ? processElectionSuccess(game) : processElectionFailure(game);
}

export function vcDiscardPolicy(game: GameState, vcId: string, policyIndex: number): GameState {
  const vc = game.players.find(p => p.id === vcId);
  if (!vc || !vc.isViceChancellor) throw new Error('Only Vice-Chancellor can discard');
  if (policyIndex < 0 || policyIndex >= game.drawnPolicies.length) throw new Error('Invalid policy index');
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

function enactPolicy(game: GameState, policy: Policy, isChaos: boolean): GameState {
  let newGame = { ...game };
  if (policy.type === PolicyType.STUDENT_UNION) {
    newGame.studentUnionPolicies = [...newGame.studentUnionPolicies, policy];
    if (newGame.studentUnionPolicies.length >= 5) {
      return { ...newGame, phase: GamePhase.GAME_OVER, winner: 'STUDENT_UNION', winReason: '5 Student Union policies have been enacted!' };
    }
  } else {
    newGame.adminPolicies = [...newGame.adminPolicies, policy];
    if (newGame.adminPolicies.length >= 6) {
      return { ...newGame, phase: GamePhase.GAME_OVER, winner: 'ADMIN', winReason: '6 Admin policies have been enacted!' };
    }
    if (!isChaos) {
      const numPlayers = game.players.length;
      const actionIndex = newGame.adminPolicies.length - 1;
      const action = EXECUTIVE_ACTIONS[numPlayers]?.[actionIndex] || ExecutiveAction.NONE;
      if (action !== ExecutiveAction.NONE) {
        return { ...newGame, phase: GamePhase.EXECUTIVE_ACTION, pendingExecutiveAction: action, phaseEndTime: Date.now() + game.phaseDuration };
      }
    }
  }
  return advanceViceChancellor(newGame);
}

function advanceViceChancellor(game: GameState): GameState {
  const alivePlayers = game.players.filter(p => p.isAlive);
  const nextVCIndex = (game.currentViceChancellorIndex + 1) % alivePlayers.length;
  const nextVCId = alivePlayers[nextVCIndex].id;
  const updatedPlayers = game.players.map(p => ({
    ...p,
    isViceChancellor: p.id === nextVCId,
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

export function chairEnactPolicy(game: GameState, chairId: string, policyIndex: number): GameState {
  const chair = game.players.find(p => p.id === chairId);
  if (!chair || !chair.isPolicyChair) throw new Error('Only Policy Chair can enact');
  if (policyIndex < 0 || policyIndex >= game.policiesForChair.length) throw new Error('Invalid policy index');
  const enactedPolicy = game.policiesForChair[policyIndex];
  const discardedPolicy = game.policiesForChair.find((_, i) => i !== policyIndex);
  const newGame = {
    ...game,
    policiesForChair: [],
    discardPile: discardedPolicy ? [...game.discardPile, discardedPolicy] : game.discardPile
  };
  return enactPolicy(newGame, enactedPolicy, false);
}

export function investigatePlayer(game: GameState, vcId: string, targetId: string): GameState {
  const vc = game.players.find(p => p.id === vcId);
  const target = game.players.find(p => p.id === targetId);
  if (!vc || !vc.isViceChancellor) throw new Error('Only Vice-Chancellor can investigate');
  if (!target || !target.isAlive || target.hasBeenInvestigated) throw new Error('Invalid investigation target');
  if (targetId === vcId) throw new Error('Cannot investigate yourself');
  const updatedPlayers = game.players.map(p => (p.id === targetId ? { ...p, hasBeenInvestigated: true } : p));
  return { ...game, players: updatedPlayers, investigatedPlayerId: targetId };
}

export function completeInvestigation(game: GameState): GameState {
  return advanceViceChancellor({ ...game, investigatedPlayerId: null });
}

export function peekPolicies(game: GameState, vcId: string): GameState {
  const vc = game.players.find(p => p.id === vcId);
  if (!vc || !vc.isViceChancellor) throw new Error('Only Vice-Chancellor can peek');
  const peekedPolicies = game.policyDeck.slice(0, 3);
  return { ...game, peekedPolicies };
}

export function completePeek(game: GameState): GameState {
  return advanceViceChancellor({ ...game, peekedPolicies: [] });
}

export function specialElection(game: GameState, vcId: string, targetId: string): GameState {
  const vc = game.players.find(p => p.id === vcId);
  const target = game.players.find(p => p.id === targetId);
  if (!vc || !vc.isViceChancellor) throw new Error('Only Vice-Chancellor can call special election');
  if (!target || !target.isAlive || targetId === vcId) throw new Error('Invalid election target');
  const alivePlayers = game.players.filter(p => p.isAlive);
  const targetIndex = alivePlayers.findIndex(p => p.id === targetId);
  const updatedPlayers = game.players.map(p => ({ ...p, isViceChancellor: p.id === targetId, isPolicyChair: false, vote: null }));
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

export function executePlayer(game: GameState, vcId: string, targetId: string): GameState {
  const vc = game.players.find(p => p.id === vcId);
  const target = game.players.find(p => p.id === targetId);
  if (!vc || !vc.isViceChancellor) throw new Error('Only Vice-Chancellor can ban');
  if (!target || !target.isAlive || targetId === vcId) throw new Error('Invalid execution target');
  if (target.role === Role.CHANCELLOR) {
    return { ...game, phase: GamePhase.GAME_OVER, winner: 'STUDENT_UNION', winReason: 'The Chancellor has been banned!' };
  }
  const updatedPlayers = game.players.map(p => (p.id === targetId ? { ...p, isAlive: false } : p));
  return advanceViceChancellor({ ...game, players: updatedPlayers });
}

export function addChatMessage(game: GameState, playerId: string, message: string): GameState {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return game;
  const chatMessage: ChatMessage = { id: crypto.randomUUID(), playerId, playerName: player.name, message, timestamp: Date.now() };
  return { ...game, messages: [...game.messages, chatMessage].slice(-100) };
}

export function reconnectPlayer(game: GameState, oldPlayerId: string, newSocketId: string): GameState {
  const players = game.players.map(p =>
    p.id === oldPlayerId ? { ...p, id: newSocketId, connected: true } : p
  );
  const hostId = game.hostId === oldPlayerId ? newSocketId : game.hostId;
  return { ...game, players, hostId };
}

export function disconnectPlayer(game: GameState, playerId: string): GameState {
  return { ...game, players: game.players.map(p => (p.id === playerId ? { ...p, connected: false } : p)) };
}

export function removePlayer(game: GameState, playerId: string): GameState {
  if (game.phase !== GamePhase.LOBBY) return disconnectPlayer(game, playerId);
  return { ...game, players: game.players.filter(p => p.id !== playerId) };
}

export function getSanitizedGameState(game: GameState, playerId: string): GameState {
  const player = game.players.find(p => p.id === playerId);
  if (!player) return game;
  if (game.phase === GamePhase.GAME_OVER) return game;
  const sanitizedPlayers = game.players.map(p => {
    if (p.id === playerId) return p;
    if (player.role === Role.CHANCELLORS_OFFICE || player.role === Role.CHANCELLOR) {
      if (p.role === Role.CHANCELLORS_OFFICE || p.role === Role.CHANCELLOR) return p;
    }
    return { ...p, role: undefined };
  });
  const sanitizedDrawnPolicies = player.isViceChancellor ? game.drawnPolicies : [];
  const sanitizedChairPolicies = player.isPolicyChair ? game.policiesForChair : [];
  const sanitizedPeekedPolicies = player.isViceChancellor ? game.peekedPolicies : [];
  return {
    ...game,
    players: sanitizedPlayers,
    drawnPolicies: sanitizedDrawnPolicies,
    policiesForChair: sanitizedChairPolicies,
    peekedPolicies: sanitizedPeekedPolicies,
    policyDeck: [],
    discardPile: []
  };
}
