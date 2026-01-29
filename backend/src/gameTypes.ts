// Game Types and Interfaces for Secret Chancellor (backend)

export enum Role {
  STUDENT_UNION = 'STUDENT_UNION',
  CHANCELLORS_OFFICE = 'CHANCELLORS_OFFICE',
  CHANCELLOR = 'CHANCELLOR'
}

export enum PolicyType {
  STUDENT_UNION = 'STUDENT_UNION',
  ADMIN = 'ADMIN'
}

export enum GamePhase {
  LOBBY = 'LOBBY',
  ROLE_REVEAL = 'ROLE_REVEAL',
  NOMINATE_CHAIR = 'NOMINATE_CHAIR',
  VOTING = 'VOTING',
  POLICY_DRAW = 'POLICY_DRAW',
  POLICY_CHAIR = 'POLICY_CHAIR',
  EXECUTIVE_ACTION = 'EXECUTIVE_ACTION',
  GAME_OVER = 'GAME_OVER'
}

export enum ExecutiveAction {
  INVESTIGATE = 'INVESTIGATE',
  SPECIAL_ELECTION = 'SPECIAL_ELECTION',
  PEEK_POLICIES = 'PEEK_POLICIES',
  EXECUTION = 'EXECUTION',
  NONE = 'NONE'
}

export interface Player {
  id: string;
  name: string;
  role?: Role;
  isAlive: boolean;
  isViceChancellor: boolean;
  isPolicyChair: boolean;
  hasBeenInvestigated: boolean;
  vote?: boolean | null;
  connected: boolean;
}

export interface Policy {
  id: string;
  type: PolicyType;
  name: string;
}

export interface GameState {
  gameId: string;
  players: Player[];
  hostId: string;
  phase: GamePhase;
  studentUnionPolicies: Policy[];
  adminPolicies: Policy[];
  policyDeck: Policy[];
  discardPile: Policy[];
  currentViceChancellorIndex: number;
  nominatedChairId: string | null;
  drawnPolicies: Policy[];
  policiesForChair: Policy[];
  failedElections: number;
  lastViceChancellorId: string | null;
  lastChairId: string | null;
  pendingExecutiveAction: ExecutiveAction | null;
  investigatedPlayerId: string | null;
  peekedPolicies: Policy[];
  winner: 'STUDENT_UNION' | 'ADMIN' | null;
  winReason: string | null;
  messages: ChatMessage[];
  phaseEndTime: number | null;
  phaseDuration: number;
}

export interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: number;
}

export interface VoteResult {
  playerId: string;
  playerName: string;
  vote: boolean;
}

export const EXECUTIVE_ACTIONS: { [players: number]: ExecutiveAction[] } = {
  5: [ExecutiveAction.NONE, ExecutiveAction.NONE, ExecutiveAction.PEEK_POLICIES, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
  6: [ExecutiveAction.NONE, ExecutiveAction.NONE, ExecutiveAction.PEEK_POLICIES, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
  7: [ExecutiveAction.NONE, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
  8: [ExecutiveAction.NONE, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
  9: [ExecutiveAction.INVESTIGATE, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
  10: [ExecutiveAction.INVESTIGATE, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION]
};

export const ROLE_DISTRIBUTION: { [players: number]: { studentUnion: number; chancellorsOffice: number } } = {
  5: { studentUnion: 3, chancellorsOffice: 1 },
  6: { studentUnion: 4, chancellorsOffice: 1 },
  7: { studentUnion: 4, chancellorsOffice: 2 },
  8: { studentUnion: 5, chancellorsOffice: 2 },
  9: { studentUnion: 5, chancellorsOffice: 3 },
  10: { studentUnion: 6, chancellorsOffice: 3 }
};
