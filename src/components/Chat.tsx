'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { useGame } from '@/context/GameContext';
import styles from './Chat.module.css';

export default function Chat() {
    const { gameState, sendMessage, playerId } = useGame();
    const [message, setMessage] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState?.messages]);

    const handleSend = () => {
        if (message.trim()) {
            sendMessage(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    if (!gameState) return null;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <span className={styles.title}>💬 Discussion</span>
            </div>
            <div className={styles.messages}>
                {gameState.messages.length === 0 ? (
                    <div className={styles.emptyMessage}>
                        No messages yet. Start the discussion!
                    </div>
                ) : (
                    gameState.messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`${styles.message} ${msg.playerId === playerId ? styles.ownMessage : ''}`}
                        >
                            <span className={styles.sender}>{msg.playerName}:</span>
                            <span className={styles.content}>{msg.message}</span>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputContainer}>
                <input
                    type="text"
                    className={styles.input}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    maxLength={200}
                />
                <button className={styles.sendBtn} onClick={handleSend}>
                    Send
                </button>
            </div>
        </div>
    );
}
