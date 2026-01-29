'use client';

import React from 'react';
import { Policy, PolicyType } from '@/lib/gameTypes';
import styles from './PolicyCard.module.css';

interface PolicyCardProps {
    policy: Policy | 'hidden';
    onClick?: () => void;
    disabled?: boolean;
    selected?: boolean;
    size?: 'small' | 'medium' | 'large';
}

export default function PolicyCard({
    policy,
    onClick,
    disabled = false,
    selected = false,
    size = 'medium'
}: PolicyCardProps) {
    const isHidden = policy === 'hidden';
    const isStudentUnion = !isHidden && policy.type === PolicyType.STUDENT_UNION;
    const isAdmin = !isHidden && policy.type === PolicyType.ADMIN;
    const policyName = !isHidden ? policy.name : '';

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
                        <span className={styles.label}>{policyName}</span>
                    </>
                )}
                {isAdmin && (
                    <>
                        <span className={styles.icon}>🏛️</span>
                        <span className={styles.label}>{policyName}</span>
                    </>
                )}
                {isHidden && (
                    <>
                        <span className={styles.icon}>📜</span>
                        <span className={styles.label}>Sealed</span>
                    </>
                )}
            </div>
        </div>
    );
}

interface PolicyCardGroupProps {
    policies: Policy[];
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
                    policy={showHidden ? 'hidden' : policy}
                    onClick={onSelect ? () => onSelect(index) : undefined}
                    selected={selectedIndex === index}
                    disabled={disabled}
                />
            ))}
        </div>
    );
}
