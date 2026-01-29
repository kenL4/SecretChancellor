'use client';

import React from 'react';
import { useGame } from '@/context/GameContext';
import { Role } from '@/lib/gameTypes';
import styles from './GameOver.module.css';

export default function GameOver() {
    const { gameState, playerId, leaveGame } = useGame();

    if (!gameState) return null;

    const isStudentUnionWin = gameState.winner === 'STUDENT_UNION';
    const currentPlayer = gameState.players.find(p => p.id === playerId);
    const isWinner = currentPlayer?.role === Role.STUDENT_UNION
        ? isStudentUnionWin
        : !isStudentUnionWin;

    return (
        <div className={styles.container}>
            <div className={`${styles.card} ${isStudentUnionWin ? styles.suWin : styles.adminWin}`}>
                <div className={styles.header}>
                    <span className={styles.emoji}>
                        {isStudentUnionWin ? '📚' : '🏛️'}
                    </span>
                    <h1 className={styles.title}>
                        {isStudentUnionWin ? 'Student Union Wins!' : 'Admin Wins!'}
                    </h1>
                    <p className={styles.reason}>{gameState.winReason}</p>
                </div>

                <div className={`${styles.resultBadge} ${isWinner ? styles.victory : styles.defeat}`}>
                    {isWinner ? '🎉 Victory!' : '💀 Defeat!'}
                </div>

                <div className={styles.rolesSection}>
                    <h2 className={styles.rolesTitle}>Role Reveal</h2>
                    <div className={styles.rolesList}>
                        {gameState.players.map((player) => {
                            const roleInfo = getRoleInfo(player.role);
                            return (
                                <div
                                    key={player.id}
                                    className={`${styles.playerRole} ${styles[roleInfo.className]}`}
                                >
                                    <div className={styles.playerAvatar}>
                                        {player.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.playerInfo}>
                                        <span className={styles.playerName}>
                                            {player.name}
                                            {player.id === playerId && <span className={styles.youTag}> (You)</span>}
                                        </span>
                                        <span className={styles.roleName}>
                                            {roleInfo.emoji} {roleInfo.name}
                                        </span>
                                    </div>
                                    {!player.isAlive && (
                                        <span className={styles.deadBadge}>☠️</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.stats}>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{gameState.studentUnionPolicies.length}</span>
                        <span className={styles.statLabel}>SU Policies</span>
                    </div>
                    <div className={styles.stat}>
                        <span className={styles.statValue}>{gameState.adminPolicies.length}</span>
                        <span className={styles.statLabel}>Admin Policies</span>
                    </div>
                </div>

                <button className="btn btn-gold" onClick={leaveGame}>
                    Return to Lobby
                </button>
            </div>
        </div>
    );
}

function getRoleInfo(role?: Role) {
    switch (role) {
        case Role.STUDENT_UNION:
            return { name: 'Student Union', emoji: '📚', className: 'suRole' };
        case Role.CHANCELLORS_OFFICE:
            return { name: "University Admin", emoji: '🏛️', className: 'coRole' };
        case Role.CHANCELLOR:
            return { name: 'Chancellor', emoji: '👑', className: 'chancellorRole' };
        default:
            return { name: 'Unknown', emoji: '❓', className: '' };
    }
}
