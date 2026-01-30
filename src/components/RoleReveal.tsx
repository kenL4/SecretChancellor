'use client';

import React from 'react';
import { useGame } from '@/context/GameContext';
import { Role } from '@/lib/gameTypes';
import { ROLE_INFO } from '@/lib/roleInfo';
import styles from './RoleReveal.module.css';

export default function RoleReveal() {
    const { gameState, playerId } = useGame();

    if (!gameState) return null;

    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer || !currentPlayer.role) return null;

    const roleInfo = ROLE_INFO[currentPlayer.role];
    const isAdmin = currentPlayer.role === Role.CHANCELLORS_OFFICE || currentPlayer.role === Role.CHANCELLOR;

    // Find teammates if admin
    const teammates = isAdmin
        ? gameState.players.filter(
            p => p.id !== playerId && (p.role === Role.CHANCELLORS_OFFICE || p.role === Role.CHANCELLOR)
        )
        : [];

    return (
        <div className={styles.container}>
            <div className={`${styles.card} ${styles[roleInfo.color]}`}>
                <div className={styles.header}>
                    <span className={styles.emoji}>{roleInfo.emoji}</span>
                    <h2 className={styles.title}>{roleInfo.title}</h2>
                </div>

                <p className={styles.description}>{roleInfo.description}</p>

                <div className={styles.objectives}>
                    <h3 className={styles.objectivesTitle}>Your Objectives:</h3>
                    <ul className={styles.objectivesList}>
                        {roleInfo.objectives.map((obj, i) => (
                            <li key={i} className={styles.objective}>
                                {obj}
                            </li>
                        ))}
                    </ul>
                </div>

                {isAdmin && teammates.length > 0 && (
                    <div className={styles.teammates}>
                        <h3 className={styles.teammatesTitle}>
                            {currentPlayer.role === Role.CHANCELLOR
                                ? 'Your Office Members:'
                                : 'Your Team:'}
                        </h3>
                        <div className={styles.teammatesList}>
                            {teammates.map(teammate => (
                                <div key={teammate.id} className={styles.teammate}>
                                    <span className={styles.teammateAvatar}>
                                        {teammate.name.charAt(0).toUpperCase()}
                                    </span>
                                    <div className={styles.teammateInfo}>
                                        <span className={styles.teammateName}>{teammate.name}</span>
                                        <span className={styles.teammateRole}>
                                            {teammate.role === Role.CHANCELLOR ? '👑 Chancellor' : '🏛️ Office'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className={styles.warning}>
                    ⏱️ The game will begin shortly...
                </div>
            </div>
        </div>
    );
}
