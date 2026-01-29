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

    const handleBackToMenu = () => {
        setMode('menu');
        setGameId(''); // Clear the game code when going back to menu
    };

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
                    <p className={styles.subtitle}>Deception & Debate in the Halls of Cambridge</p>
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
                            <h3 className={styles.rulesTitle}>📜 The Cambridge Conspiracy</h3>
                            <p className={styles.rulesIntro}>
                                A committee for the future of the University gathers at a formal dinner...
                            </p>

                            <div className={styles.teamsSection}>
                                <div className={styles.team}>
                                    <span className={styles.teamIcon}>📚</span>
                                    <div className={styles.teamInfo}>
                                        <strong>The Student Union</strong>
                                        <span>Defenders of academic freedom, fighting to keep education accessible to all.</span>
                                    </div>
                                </div>
                                <div className={styles.team}>
                                    <span className={styles.teamIcon}>🏛️</span>
                                    <div className={styles.teamInfo}>
                                        <strong>The University Admin</strong>
                                        <span>University bureaucrats, prioritising their own profit over student welfare.</span>
                                    </div>
                                </div>
                            </div>

                            <div className={styles.rulesList}>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>👥</span>
                                    <div className={styles.ruleText}>
                                        <strong>5-10 Scholars Required</strong>
                                        <span>Each player is secretly assigned to the Student Union or University Admin. One player is the hidden Chancellor.</span>
                                    </div>
                                </div>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>🗳️</span>
                                    <div className={styles.ruleText}>
                                        <strong>Elect Your Committee</strong>
                                        <span>The Vice-Chancellor nominates a Policy Chair. All scholars vote "Aye" or "Nay" in true Union fashion.</span>
                                    </div>
                                </div>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>📜</span>
                                    <div className={styles.ruleText}>
                                        <strong>Debate & Legislate</strong>
                                        <span>Draw 3 policies, discard 1 secretly, pass 2 to the Chair who enacts 1. Trust no one - they may be lying about what they saw!</span>
                                    </div>
                                </div>
                                <div className={styles.rule}>
                                    <span className={styles.ruleIcon}>🏆</span>
                                    <div className={styles.ruleText}>
                                        <strong>Victory Conditions</strong>
                                        <span>Student Union wins by passing 5 SU policies or exposing the Chancellor. University Admin wins by passing 6 Admin policies or electing the Chancellor as Chair after 3 Admin policies.</span>
                                    </div>
                                </div>
                            </div>

                            <p className={styles.rulesTagline}>
                                🎓 Bluff, deduce, and persuade your way to save the University!
                            </p>
                        </div>
                    </div>
                )}

                {isConnected && mode === 'create' && (
                    <div className={styles.form}>
                        <button className={styles.backBtn} onClick={handleBackToMenu}>
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
                        <button className={styles.backBtn} onClick={handleBackToMenu}>
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
                    <p>Cambridge University</p>
                </footer>
            </div>
        </div>
    );
}
