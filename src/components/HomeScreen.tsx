'use client';

import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './HomeScreen.module.css';

interface HomeScreenProps {
    initialGameId?: string;
}

export default function HomeScreen({ initialGameId }: HomeScreenProps) {
    const { createGame, joinGame, isConnected, error, clearError } = useGame();
    const [mode, setMode] = useState<'menu' | 'create' | 'join'>(initialGameId ? 'join' : 'menu');
    const [playerName, setPlayerName] = useState('');
    const [gameId, setGameId] = useState(initialGameId || '');

    useEffect(() => {
        if (initialGameId) {
            setGameId(initialGameId);
            setMode('join');
        }
    }, [initialGameId]);

    const handleCreate = () => {
        if (playerName.trim().length >= 2) {
            createGame(playerName.trim());
        }
    };

    const handleJoin = () => {
        if (playerName.trim().length >= 2 && gameId.trim().length >= 4) {
            joinGame(gameId.trim().toUpperCase(), playerName.trim());
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.background}>
                <div className={styles.crest}>🎓</div>
            </div>

            <div className={styles.content}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Secret Chancellor</h1>
                    <p className={styles.subtitle}>A Cambridge University Social Deduction Game</p>
                </div>

                {!isConnected && (
                    <div className={styles.connecting}>
                        <div className={styles.spinner}></div>
                        <span>Connecting to server...</span>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        <span>{error}</span>
                        <button onClick={clearError}>✕</button>
                    </div>
                )}

                {isConnected && mode === 'menu' && (
                    <div className={styles.menu}>
                        <button className="btn btn-gold" onClick={() => setMode('create')}>
                            🎮 Create Game
                        </button>
                        <button className="btn btn-primary" onClick={() => setMode('join')}>
                            🔗 Join Game
                        </button>

                        <div className={styles.rules}>
                            <h3 className={styles.rulesTitle}>📜 How to Play</h3>
                            <div className={styles.rulesList}>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>👥</span>
                                    <div className={styles.ruleText}>
                                        <strong>5-10 Players</strong>
                                        <span>Secret roles: Student Union, Chancellor's Office, or the Chancellor</span>
                                    </div>
                                </div>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>🗳️</span>
                                    <div className={styles.ruleText}>
                                        <strong>Elect Governments</strong>
                                        <span>Vice-Chancellor nominates, everyone votes</span>
                                    </div>
                                </div>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>📜</span>
                                    <div className={styles.ruleText}>
                                        <strong>Enact Policies</strong>
                                        <span>Draw 3 → Discard 1 → Pass 2 → Enact 1</span>
                                    </div>
                                </div>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>🏆</span>
                                    <div className={styles.ruleText}>
                                        <strong>Win Conditions</strong>
                                        <span>SU: 5 policies or execute Chancellor. Admin: 6 policies or elect Chancellor</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {isConnected && mode === 'create' && (
                    <div className={styles.form}>
                        <button className={styles.backBtn} onClick={() => setMode('menu')}>
                            ← Back
                        </button>
                        <h2 className={styles.formTitle}>Create New Game</h2>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Your Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter your name..."
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                maxLength={20}
                            />
                        </div>

                        <button
                            className="btn btn-gold"
                            onClick={handleCreate}
                            disabled={playerName.trim().length < 2}
                        >
                            Create Game
                        </button>
                    </div>
                )}

                {isConnected && mode === 'join' && (
                    <div className={styles.form}>
                        <button className={styles.backBtn} onClick={() => setMode('menu')}>
                            ← Back
                        </button>
                        <h2 className={styles.formTitle}>Join Game</h2>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Your Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                placeholder="Enter your name..."
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                maxLength={20}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.inputLabel}>Game Code</label>
                            <input
                                type="text"
                                className={`${styles.input} ${styles.codeInput}`}
                                placeholder="XXXXXX"
                                value={gameId}
                                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                                maxLength={6}
                            />
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={handleJoin}
                            disabled={playerName.trim().length < 2 || gameId.trim().length < 4}
                        >
                            Join Game
                        </button>
                    </div>
                )}

                <footer className={styles.footer}>
                    <p>Inspired by Secret Hitler • Cambridge University Theme</p>
                </footer>
            </div>
        </div>
    );
}
