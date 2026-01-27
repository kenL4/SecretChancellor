'use client';

import React from 'react';
import { PolicyType } from '@/lib/gameTypes';
import styles from './PolicyCard.module.css';

interface PolicyCardProps {
    type: PolicyType | 'hidden';
    onClick?: () => void;
    disabled?: boolean;
    selected?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export default function PolicyCard({
    type,
    onClick,
    disabled = false,
    selected = false,
    size = 'medium'
}: PolicyCardProps) {
    const isHidden = type === 'hidden';
    const isStudentUnion = type === PolicyType.STUDENT_UNION;
    const isAdmin = type === PolicyType.ADMIN;

    return (
        <div
            className={`${styles.card} ${styles[size]} ${isStudentUnion ? styles.studentUnion : ''
                } ${isAdmin ? styles.admin : ''} ${isHidden ? styles.hidden : ''} ${selected ? styles.selected : ''
                } ${disabled ? styles.disabled : ''} ${onClick && !disabled ? styles.clickable : ''}`}
            onClick={!disabled && onClick ? onClick : undefined}
        >
            <div className={styles.inner}>
                {isStudentUnion && (
                    <>
                        <span className={styles.icon}>📚</span>
                        <span className={styles.label}>Student Union</span>
                    </>
                )}
                {isAdmin && (
                    <>
                        <span className={styles.icon}>🏛️</span>
                        <span className={styles.label}>Admin</span>
                    </>
                )}
                {isHidden && (
                    <>
                        <span className={styles.icon}>❓</span>
                        <span className={styles.label}>Policy</span>
                    </>
                )}
            </div>
        </div>
    );
}

interface PolicyCardGroupProps {
    policies: PolicyType[];
    onSelect?: (index: number) => void;
    selectedIndex?: number | null;
    disabled?: boolean;
    showHidden?: boolean;
}

export function PolicyCardGroup({
    policies,
    onSelect,
    selectedIndex,
    disabled = false,
    showHidden = false
}: PolicyCardGroupProps) {
    return (
        <div className={styles.group}>
            {policies.map((policy, index) => (
                <PolicyCard
                    key={index}
                    type={showHidden ? 'hidden' : policy}
                    onClick={onSelect ? () => onSelect(index) : undefined}
                    selected={selectedIndex === index}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}
