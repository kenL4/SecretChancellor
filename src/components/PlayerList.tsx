'use client';

import React from 'react';
import { Player } from '@/lib/gameTypes';
import styles from './PlayerList.module.css';

interface PlayerListProps {
    players: Player[];
    currentPlayerId: string | null;
    hostId: string;
    onSelectPlayer?: (playerId: string) => void;
    selectableFilter?: (player: Player) => boolean;
    showVotes?: boolean;
    isSelecting?: boolean;
    selectedPlayerId?: string | null;
}

export default function PlayerList({
    players,
    currentPlayerId,
    hostId,
    onSelectPlayer,
    selectableFilter,
    showVotes = false,
    isSelecting = false,
    selectedPlayerId
}: PlayerListProps) {
    return (
        <div className={styles.container}>
            {players.map((player, index) => {
                const isCurrentPlayer = player.id === currentPlayerId;
                const isHost = player.id === hostId;
                const isSelectable = selectableFilter ? selectableFilter(player) : false;
                const isSelected = player.id === selectedPlayerId;

                return (
                    <div
                        key={player.id}
                        className={`${styles.playerCard} ${!player.isAlive ? styles.dead : ''} ${isSelectable && isSelecting ? styles.selectable : ''
                            } ${isSelected ? styles.selected : ''} ${!player.connected ? styles.disconnected : ''}`}
                        onClick={() => {
                            if (isSelecting && isSelectable && onSelectPlayer) {
                                onSelectPlayer(player.id);
                            }
                        }}
                        style={{ animationDelay: `${index * 0.05}s` }}
                    >
                        <div className={styles.avatar}>
                            {player.name.charAt(0).toUpperCase()}
                        </div>

                        <div className={styles.info}>
                            <div className={styles.nameRow}>
                                <span className={styles.name}>
                                    {player.name}
                                    {isCurrentPlayer && <span className={styles.youTag}>(You)</span>}
                                </span>
                                {!player.connected && (
                                    <span className={styles.disconnectedBadge}>Offline</span>
                                )}
                            </div>

                            <div className={styles.badges}>
                                {isHost && (
                                    <span className={`${styles.badge} ${styles.badgeHost}`}>Host</span>
                                )}
                                {player.isViceChancellor && (
                                    <span className={`${styles.badge} ${styles.badgeVC}`}>Vice-Chancellor</span>
                                )}
                                {player.isPolicyChair && (
                                    <span className={`${styles.badge} ${styles.badgeChair}`}>Policy Chair</span>
                                )}
                                {!player.isAlive && (
                                    <span className={`${styles.badge} ${styles.badgeDead}`}>Deceased</span>
                                )}
                            </div>
                        </div>

                        {showVotes && player.isAlive && (
                            <div className={styles.voteIndicator}>
                                {player.vote === true && (
                                    <span className={`${styles.vote} ${styles.voteApprove}`}>✓</span>
                                )}
                                {player.vote === false && (
                                    <span className={`${styles.vote} ${styles.voteReject}`}>✗</span>
                                )}
                                {player.vote === null && (
                                    <span className={`${styles.vote} ${styles.votePending}`}>?</span>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
