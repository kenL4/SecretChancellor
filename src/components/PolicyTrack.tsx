'use client';

import React from 'react';
import { PolicyType, ExecutiveAction } from '@/lib/gameTypes';
import styles from './PolicyTrack.module.css';

interface PolicyTrackProps {
    type: 'student_union' | 'admin';
    count: number;
    playerCount: number;
}

const ADMIN_POWERS: { [players: number]: (ExecutiveAction | null)[] } = {
    5: [null, null, ExecutiveAction.PEEK_POLICIES, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
    6: [null, null, ExecutiveAction.PEEK_POLICIES, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
    7: [null, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
    8: [null, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
    9: [ExecutiveAction.INVESTIGATE, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION],
    10: [ExecutiveAction.INVESTIGATE, ExecutiveAction.INVESTIGATE, ExecutiveAction.SPECIAL_ELECTION, ExecutiveAction.EXECUTION, ExecutiveAction.EXECUTION]
};

const POWER_LABELS: { [key in ExecutiveAction]?: string } = {
    [ExecutiveAction.INVESTIGATE]: '🔍 Investigate',
    [ExecutiveAction.SPECIAL_ELECTION]: '🗳️ Special Election',
    [ExecutiveAction.PEEK_POLICIES]: '👁️ Peek',
    [ExecutiveAction.EXECUTION]: '☠️ Execution'
};

export default function PolicyTrack({ type, count, playerCount }: PolicyTrackProps) {
    const isAdmin = type === 'admin';
    const maxPolicies = isAdmin ? 6 : 5;
    const powers = isAdmin ? ADMIN_POWERS[playerCount] || ADMIN_POWERS[5] : [];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={`${styles.title} ${isAdmin ? styles.adminTitle : styles.suTitle}`}>
                    {isAdmin ? '🏛️ Admin Track' : '📚 Student Union Track'}
                </span>
                <span className={styles.counter}>
                    {count} / {maxPolicies}
                </span>
            </div>

            <div className={styles.track}>
                {Array.from({ length: maxPolicies }).map((_, index) => {
                    const isFilled = index < count;
                    const power = isAdmin && index < powers.length ? powers[index] : null;

                    return (
                        <div
                            key={index}
                            className={`${styles.slot} ${isFilled ? styles.filled : ''} ${isAdmin ? styles.adminSlot : styles.suSlot
                                }`}
                        >
                            {isFilled && (
                                <div className={`${styles.policy} ${isAdmin ? styles.adminPolicy : styles.suPolicy}`}>
                                    {isAdmin ? '🏛️' : '📚'}
                                </div>
                            )}
                            {power && (
                                <div className={styles.powerBadge}>
                                    {POWER_LABELS[power]}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {isAdmin && count >= 3 && (
                <div className={styles.warning}>
                    ⚠️ Chancellor election now ends the game!
                </div>
            )}
        </div>
    );
}
