'use client';

import React from 'react';
import { useGame } from '@/context/GameContext';
import { GamePhase } from '@/lib/gameTypes';
import HomeScreen from './HomeScreen';
import Lobby from './Lobby';
import RoleReveal from './RoleReveal';
import GameBoard from './GameBoard';
import GameOver from './GameOver';

interface GameProps {
    initialGameId?: string;
}

export default function Game({ initialGameId }: GameProps) {
    const { gameState } = useGame();

    // No game state - show home screen
    if (!gameState) {
        return <HomeScreen initialGameId={initialGameId} />;
    }

    // Render based on game phase
    switch (gameState.phase) {
        case GamePhase.LOBBY:
            return <Lobby />;

        case GamePhase.ROLE_REVEAL:
            return <RoleReveal />;

        case GamePhase.NOMINATE_CHAIR:
        case GamePhase.VOTING:
        case GamePhase.POLICY_DRAW:
        case GamePhase.POLICY_CHAIR:
        case GamePhase.EXECUTIVE_ACTION:
            return <GameBoard />;

        case GamePhase.GAME_OVER:
            return <GameOver />;

        default:
            return <HomeScreen initialGameId={initialGameId} />;
    }
}
