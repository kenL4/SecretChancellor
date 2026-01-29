'use client';

import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './Lobby.module.css';

export default function Lobby() {
    const { gameState, playerId, startGame, leaveGame } = useGame();

    if (!gameState) return null;

    const isHost = gameState.hostId === playerId;
    const canStart = gameState.players.length >= 5 && gameState.players.length <= 10;
    const playerCount = gameState.players.length;

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <h2 className={styles.title}>🎓 The Committee Awaits</h2>
                    <div className={styles.gameCode}>
                        <span className={styles.codeLabel}>Game Code:</span>
                        <span className={styles.code}>{gameState.gameId}</span>
                        <button
                            className={styles.copyBtn}
                            onClick={() => {
                                navigator.clipboard.writeText(gameState.gameId);
                            }}
                        >
                            📋 Copy
                        </button>
                    </div>
                </div>

                <div className={styles.shareSection}>
                    <p className={styles.shareText}>
                        Invite your fellow scholars to join:
                    </p>
                    <div className={styles.shareLink}>
                        <input
                            type="text"
                            readOnly
                            value={typeof window !== 'undefined' ? `${window.location.origin}?join=${gameState.gameId}` : ''}
                            className={styles.linkInput}
                        />
                        <button
                            className={styles.copyBtn}
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    navigator.clipboard.writeText(`${window.location.origin}?join=${gameState.gameId}`);
                                }
                            }}
                        >
                            📋
                        </button>
                    </div>
                </div>

                <div className={styles.playersSection}>
                    <h3 className={styles.playersTitle}>
                        Scholars Assembled ({playerCount}/10)
                        {playerCount < 5 && (
                            <span className={styles.minPlayers}>Need at least 5 to convene</span>
                        )}
                    </h3>

                    <div className={styles.playersList}>
                        {gameState.players.map((player, index) => (
                            <div
                                key={player.id}
                                className={`${styles.playerItem} ${!player.connected ? styles.disconnected : ''}`}
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <div className={styles.playerAvatar}>
                                    {player.name.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.playerName}>
                                    {player.name}
                                    {player.id === playerId && <span className={styles.youTag}> (You)</span>}
                                </span>
                                {player.id === gameState.hostId && (
                                    <span className={styles.hostBadge}>Master</span>
                                )}
                                {!player.connected && (
                                    <span className={styles.offlineBadge}>Offline</span>
                                )}
                            </div>
                        ))}

                        {Array.from({ length: Math.max(0, 5 - playerCount) }).map((_, i) => (
                            <div key={`empty-${i}`} className={styles.emptySlot}>
                                <span className={styles.emptyIcon}>+</span>
                                <span className={styles.emptyText}>Awaiting scholar...</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.rolesInfo}>
                    <h3 className={styles.rolesTitle}>📜 Role Distribution</h3>
                    <div className={styles.rolesGrid}>
                        {[5, 6, 7, 8, 9, 10].map(num => {
                            const isCurrent = num === playerCount;
                            const su = getRoleCount(num, 'su');
                            const co = getRoleCount(num, 'co');

                            return (
                                <div
                                    key={num}
                                    className={`${styles.roleRow} ${isCurrent ? styles.currentRole : ''}`}
                                >
                                    <span className={styles.rolePlayerCount}>{num}P</span>
                                    <span className={styles.roleSU}>{su} SU</span>
                                    <span className={styles.roleCO}>{co + 1} Admin</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.actions}>
                    {isHost ? (
                        <button
                            className={`btn btn-gold ${styles.startBtn}`}
                            onClick={startGame}
                            disabled={!canStart}
                        >
                            {canStart ? '🚀 Convene the Committee' : `Need ${5 - playerCount} more scholars`}
                        </button>
                    ) : (
                        <p className={styles.waitingText}>Awaiting the Master's call to convene...</p>
                    )}

                    <button className={`btn btn-secondary ${styles.leaveBtn}`} onClick={leaveGame}>
                        Leave Game
                    </button>
                </div>
            </div>
        </div>
    );
}

function getRoleCount(players: number, type: 'su' | 'co'): number {
    const distribution: { [key: number]: { su: number; co: number } } = {
        5: { su: 3, co: 1 },
        6: { su: 4, co: 1 },
        7: { su: 4, co: 2 },
        8: { su: 5, co: 2 },
        9: { su: 5, co: 3 },
        10: { su: 6, co: 3 }
    };
    return distribution[players]?.[type] || 0;
}
