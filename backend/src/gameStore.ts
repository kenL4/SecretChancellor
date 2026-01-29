// In-memory game store for Secret Chancellor backend

import { GameState } from './gameTypes';

class GameStore {
  private games: Map<string, GameState> = new Map();
  private playerToGame: Map<string, string> = new Map();

  getGame(gameId: string): GameState | undefined {
    return this.games.get(gameId.toUpperCase());
  }

  setGame(game: GameState): void {
    this.games.set(game.gameId.toUpperCase(), game);
  }

  deleteGame(gameId: string): void {
    const game = this.games.get(gameId.toUpperCase());
    if (game) {
      game.players.forEach(p => this.playerToGame.delete(p.id));
      this.games.delete(gameId.toUpperCase());
    }
  }

  getPlayerGame(playerId: string): string | undefined {
    return this.playerToGame.get(playerId);
  }

  setPlayerGame(playerId: string, gameId: string): void {
    this.playerToGame.set(playerId, gameId.toUpperCase());
  }

  removePlayerFromGame(playerId: string): void {
    this.playerToGame.delete(playerId);
  }

  getAllGames(): GameState[] {
    return Array.from(this.games.values());
  }

  getGameCount(): number {
    return this.games.size;
  }
}

export const gameStore = new GameStore();
