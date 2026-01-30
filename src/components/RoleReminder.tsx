'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Role } from '@/lib/gameTypes';
import { ROLE_INFO } from '@/lib/roleInfo';
import styles from './RoleReminder.module.css';

export default function RoleReminder() {
    const { gameState, playerId } = useGame();
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    if (!gameState) return null;

    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer?.role) return null;

    const roleInfo = ROLE_INFO[currentPlayer.role];

    return (
        <div ref={containerRef} className={styles.container}>
            <button
                type="button"
                className={styles.trigger}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="true"
                aria-label="Review your role"
            >
                <span className={styles.triggerEmoji}>{roleInfo.emoji}</span>
                <span className={styles.triggerLabel}>Your role</span>
                <span className={styles.chevron} aria-hidden>{open ? '▲' : '▼'}</span>
            </button>
            {open && (
                <div className={`${styles.dropdown} ${styles[roleInfo.color]}`} role="dialog" aria-label="Your role details">
                    <div className={styles.dropdownHeader}>
                        <span className={styles.dropdownEmoji}>{roleInfo.emoji}</span>
                        <h3 className={styles.dropdownTitle}>{roleInfo.title}</h3>
                    </div>
                    <p className={styles.dropdownDescription}>{roleInfo.description}</p>
                    <ul className={styles.objectives}>
                        {roleInfo.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
