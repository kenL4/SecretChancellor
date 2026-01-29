'use client';

import React from 'react';
import { useGame } from '@/context/GameContext';
import { Role } from '@/lib/gameTypes';
import styles from './RoleReveal.module.css';

const ROLE_INFO = {
    [Role.STUDENT_UNION]: {
        title: 'Student Union',
        emoji: '📚',
        description: 'You are a member of the Student Union. Work together to enact 5 Student Union policies or identify and remove the Chancellor.',
        color: 'studentUnion',
        objectives: [
            'Enact 5 Student Union policies',
            'Identify and ban the Chancellor',
            'Prevent Admin policies from being enacted'
        ]
    },
    [Role.CHANCELLORS_OFFICE]: {
        title: "University Admin",
        emoji: '🏛️',
        description: "You are part of the University Admin. Help the Chancellor gain power by enacting Admin policies or getting them elected as Policy Chair.",
        color: 'chancellorsOffice',
        objectives: [
            'Enact 6 Admin policies',
            'Get the Chancellor elected as Policy Chair after 3 Admin policies',
            'Deceive the Student Union'
        ]
    },
    [Role.CHANCELLOR]: {
        title: 'The Chancellor',
        emoji: '👑',
        description: 'You are the secret Chancellor! Stay hidden while your office works to install you in power. If elected Policy Chair after 3 Admin policies, you win!',
        color: 'chancellor',
        objectives: [
            'Stay hidden from the Student Union',
            'Get elected as Policy Chair after 3 Admin policies are enacted',
            'Work with your office to enact 6 Admin policies'
        ]
    }
};

export default function RoleReveal() {
    const { gameState, playerId, readyForNomination } = useGame();

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
                    ⏱️ Memorize your role! The game will begin shortly...
                </div>

                <button className="btn btn-gold" onClick={readyForNomination}>
                    I'm Ready - Start the Game
                </button>
            </div>
        </div>
    );
}
