'use client';

import React from 'react';
import { Player } from '@/lib/gameTypes';
import styles from './FormalHallTable.module.css';

interface FormalHallTableProps {
    players: Player[];
    currentPlayerId: string | null;
    hostId: string;
    onSelectPlayer?: (playerId: string) => void;
    selectableFilter?: (player: Player) => boolean;
    showVotes?: boolean;
    isSelecting?: boolean;
    selectedPlayerId?: string | null;
}

export default function FormalHallTable({
    players,
    currentPlayerId,
    hostId,
    onSelectPlayer,
    selectableFilter,
    showVotes = false,
    isSelecting = false,
    selectedPlayerId
}: FormalHallTableProps) {
    // Split players into tables (max 6 per table)
    const table1Players = players.slice(0, 6);
    const table2Players = players.slice(6, 10);

    // Split each table's players into left and right sides
    const splitForTable = (tablePlayers: Player[]) => {
        const half = Math.ceil(tablePlayers.length / 2);
        return {
            left: tablePlayers.slice(0, half),
            right: tablePlayers.slice(half)
        };
    };

    const table1 = splitForTable(table1Players);
    const table2 = splitForTable(table2Players);

    const renderPlayerSeat = (player: Player, index: number) => {
        const isCurrentPlayer = player.id === currentPlayerId;
        const isHost = player.id === hostId;
        const isSelectable = selectableFilter ? selectableFilter(player) : false;
        const isSelected = player.id === selectedPlayerId;

        return (
            <div
                key={player.id}
                className={`${styles.seat} ${!player.isAlive ? styles.dead : ''} ${isSelectable && isSelecting ? styles.selectable : ''
                    } ${isSelected ? styles.selected : ''} ${!player.connected ? styles.disconnected : ''}`}
                onClick={() => {
                    if (isSelecting && isSelectable && onSelectPlayer) {
                        onSelectPlayer(player.id);
                    }
                }}
                style={{ animationDelay: `${index * 0.1}s` }}
            >
                <div className={styles.avatar}>
                    {player.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.nameplate}>
                    <span className={styles.name}>
                        {player.name}
                        {isCurrentPlayer && <span className={styles.youTag}> (You)</span>}
                    </span>
                    <div className={styles.badges}>
                        {isHost && <span className={`${styles.badge} ${styles.badgeMaster}`}>Master</span>}
                        {player.isViceChancellor && <span className={`${styles.badge} ${styles.badgeVC}`}>VC</span>}
                        {player.isPolicyChair && <span className={`${styles.badge} ${styles.badgeChair}`}>Chair</span>}
                        {!player.isAlive && <span className={`${styles.badge} ${styles.badgeDead}`}>☠️</span>}
                    </div>
                </div>
                {showVotes && player.isAlive && (
                    <div className={styles.voteIndicator}>
                        {player.vote === true && <span className={styles.voteApprove}>✓</span>}
                        {player.vote === false && <span className={styles.voteReject}>✗</span>}
                        {player.vote === null && <span className={styles.votePending}>?</span>}
                    </div>
                )}
            </div>
        );
    };

    const renderTable = (leftPlayers: Player[], rightPlayers: Player[], tableIndex: number) => (
        <div className={styles.tableWrapper} key={tableIndex}>
            {/* Left side seats */}
            <div className={styles.seatColumn}>
                {leftPlayers.map((p, i) => renderPlayerSeat(p, i))}
            </div>

            {/* The table itself */}
            <div className={styles.table}>
                <div className={styles.tableTop}>
                    <div className={styles.tableCenterpiece}>🕯️</div>
                </div>
            </div>

            {/* Right side seats */}
            <div className={styles.seatColumn}>
                {rightPlayers.map((p, i) => renderPlayerSeat(p, i + leftPlayers.length))}
            </div>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.hallTitle}>
                <span className={styles.hallIcon}>🎓</span>
                <span>The Great Hall</span>
            </div>

            <div className={styles.tablesArea}>
                {renderTable(table1.left, table1.right, 0)}

                {table2Players.length > 0 && (
                    <>
                        <div className={styles.tableDivider}>
                            <span>🕯️</span>
                        </div>
                        {renderTable(table2.left, table2.right, 1)}
                    </>
                )}
            </div>
        </div>
    );
}
