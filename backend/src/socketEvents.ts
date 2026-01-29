// Socket.io Event Types (must match frontend)

export const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CREATE_GAME: 'create_game',
  JOIN_GAME: 'join_game',
  LEAVE_GAME: 'leave_game',
  START_GAME: 'start_game',
  READY_FOR_NOMINATION: 'ready_for_nomination',
  NOMINATE_CHAIR: 'nominate_chair',
  CAST_VOTE: 'cast_vote',
  VC_DISCARD: 'vc_discard',
  CHAIR_ENACT: 'chair_enact',
  INVESTIGATE: 'investigate',
  COMPLETE_INVESTIGATION: 'complete_investigation',
  PEEK_POLICIES: 'peek_policies',
  COMPLETE_PEEK: 'complete_peek',
  SPECIAL_ELECTION: 'special_election',
  EXECUTE: 'execute',
  SEND_MESSAGE: 'send_message',
  GAME_STATE: 'game_state',
  GAME_ERROR: 'game_error',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left'
} as const;
