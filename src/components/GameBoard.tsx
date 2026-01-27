'use client';

import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { GamePhase, ExecutiveAction, Player } from '@/lib/gameTypes';
import PolicyTrack from './PolicyTrack';
import PlayerList from './PlayerList';
import { PolicyCardGroup } from './PolicyCard';
import Chat from './Chat';
import styles from './GameBoard.module.css';

export default function GameBoard() {
    const {
        gameState,
        playerId,
        nominateChair,
        castVote,
        vcDiscard,
        chairEnact,
        investigate,
        completeInvestigation,
        peekPolicies,
        completePeek,
        specialElection,
        executePlayer
    } = useGame();

    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const [selectedPolicyIndex, setSelectedPolicyIndex] = useState<number | null>(null);

    if (!gameState) return null;

    const currentPlayer = gameState.players.find(p => p.id === playerId);
    if (!currentPlayer) return null;

    const isVC = currentPlayer.isViceChancellor;
    const isChair = currentPlayer.isPolicyChair;
    const alivePlayers = gameState.players.filter(p => p.isAlive);

    // Get phase-specific content
    const renderPhaseContent = () => {
        switch (gameState.phase) {
            case GamePhase.NOMINATE_CHAIR:
                return renderNominationPhase();
            case GamePhase.VOTING:
                return renderVotingPhase();
            case GamePhase.POLICY_DRAW:
                return renderPolicyDrawPhase();
            case GamePhase.POLICY_CHAIR:
                return renderPolicyChairPhase();
            case GamePhase.EXECUTIVE_ACTION:
                return renderExecutiveActionPhase();
            default:
                return null;
        }
    };

    const renderNominationPhase = () => {
        const vc = gameState.players.find(p => p.isViceChancellor);

        if (isVC) {
            const canNominate = (player: Player) => {
                if (!player.isAlive || player.id === playerId) return false;
                if (alivePlayers.length > 5) {
                    if (player.id === gameState.lastChairId || player.id === gameState.lastViceChancellorId) {
                        return false;
                    }
                } else {
                    if (player.id === gameState.lastChairId) return false;
                }
                return true;
            };

            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>👑 You are the Vice-Chancellor</h2>
                        <p className={styles.phaseDescription}>
                            Select a player to nominate as Policy Chair
                        </p>
                    </div>

                    <PlayerList
                        players={gameState.players}
                        currentPlayerId={playerId}
                        hostId={gameState.hostId}
                        onSelectPlayer={(id) => {
                            setSelectedPlayerId(id);
                            nominateChair(id);
                        }}
                        selectableFilter={canNominate}
                        isSelecting={true}
                        selectedPlayerId={selectedPlayerId}
                    />
                </div>
            );
        }

        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>🗳️ Nomination Phase</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> is selecting a Policy Chair candidate...
                    </p>
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Waiting for nomination...</span>
                </div>
            </div>
        );
    };

    const renderVotingPhase = () => {
        const vc = gameState.players.find(p => p.isViceChancellor);
        const nominee = gameState.players.find(p => p.id === gameState.nominatedChairId);
        const hasVoted = currentPlayer.vote !== null;

        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>🗳️ Vote on the Government</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> (Vice-Chancellor) has nominated{' '}
                        <strong>{nominee?.name}</strong> as Policy Chair
                    </p>
                </div>

                <div className={styles.governmentPreview}>
                    <div className={styles.governmentMember}>
                        <div className={styles.memberAvatar}>👑</div>
                        <span className={styles.memberName}>{vc?.name}</span>
                        <span className={styles.memberRole}>Vice-Chancellor</span>
                    </div>
                    <span className={styles.governmentAnd}>&</span>
                    <div className={styles.governmentMember}>
                        <div className={styles.memberAvatar}>📜</div>
                        <span className={styles.memberName}>{nominee?.name}</span>
                        <span className={styles.memberRole}>Policy Chair</span>
                    </div>
                </div>

                {!hasVoted && currentPlayer.isAlive ? (
                    <div className={styles.voteButtons}>
                        <button
                            className={`btn btn-approve ${styles.voteBtn}`}
                            onClick={() => castVote(true)}
                        >
                            ✓ Ja! (Approve)
                        </button>
                        <button
                            className={`btn btn-reject ${styles.voteBtn}`}
                            onClick={() => castVote(false)}
                        >
                            ✗ Nein! (Reject)
                        </button>
                    </div>
                ) : (
                    <div className={styles.votedMessage}>
                        {hasVoted ? '✓ Vote submitted!' : 'You cannot vote'}
                    </div>
                )}

                <div className={styles.voteProgress}>
                    <span className={styles.voteProgressLabel}>
                        Votes: {alivePlayers.filter(p => p.vote !== null).length} / {alivePlayers.length}
                    </span>
                </div>

                <PlayerList
                    players={gameState.players}
                    currentPlayerId={playerId}
                    hostId={gameState.hostId}
                    showVotes={true}
                />
            </div>
        );
    };

    const renderPolicyDrawPhase = () => {
        if (isVC) {
            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>📜 Legislative Session</h2>
                        <p className={styles.phaseDescription}>
                            You drew 3 policies. Select one to <strong>discard</strong>, then pass the remaining 2 to the Policy Chair.
                        </p>
                    </div>

                    <div className={styles.policySelection}>
                        <PolicyCardGroup
                            policies={gameState.drawnPolicies}
                            onSelect={(index) => {
                                setSelectedPolicyIndex(index);
                            }}
                            selectedIndex={selectedPolicyIndex}
                        />
                    </div>

                    <button
                        className="btn btn-gold"
                        disabled={selectedPolicyIndex === null}
                        onClick={() => {
                            if (selectedPolicyIndex !== null) {
                                vcDiscard(selectedPolicyIndex);
                                setSelectedPolicyIndex(null);
                            }
                        }}
                    >
                        Discard Selected Policy
                    </button>
                </div>
            );
        }

        const vc = gameState.players.find(p => p.isViceChancellor);
        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>📜 Legislative Session</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> is reviewing the policies...
                    </p>
                </div>

                <div className={styles.policySelection}>
                    <PolicyCardGroup policies={[]} showHidden />
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Vice-Chancellor is discarding 1 policy...</span>
                </div>
            </div>
        );
    };

    const renderPolicyChairPhase = () => {
        if (isChair) {
            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>📜 Policy Enactment</h2>
                        <p className={styles.phaseDescription}>
                            Choose one policy to <strong>enact</strong>. The other will be discarded.
                        </p>
                    </div>

                    <div className={styles.policySelection}>
                        <PolicyCardGroup
                            policies={gameState.policiesForChair}
                            onSelect={(index) => {
                                setSelectedPolicyIndex(index);
                            }}
                            selectedIndex={selectedPolicyIndex}
                        />
                    </div>

                    <button
                        className="btn btn-gold"
                        disabled={selectedPolicyIndex === null}
                        onClick={() => {
                            if (selectedPolicyIndex !== null) {
                                chairEnact(selectedPolicyIndex);
                                setSelectedPolicyIndex(null);
                            }
                        }}
                    >
                        Enact Selected Policy
                    </button>
                </div>
            );
        }

        const chair = gameState.players.find(p => p.isPolicyChair);
        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>📜 Policy Enactment</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{chair?.name}</strong> is choosing a policy to enact...
                    </p>
                </div>

                <div className={styles.policySelection}>
                    <PolicyCardGroup policies={[]} showHidden />
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Policy Chair is deciding...</span>
                </div>
            </div>
        );
    };

    const renderExecutiveActionPhase = () => {
        const action = gameState.pendingExecutiveAction;

        switch (action) {
            case ExecutiveAction.INVESTIGATE:
                return renderInvestigation();
            case ExecutiveAction.PEEK_POLICIES:
                return renderPeek();
            case ExecutiveAction.SPECIAL_ELECTION:
                return renderSpecialElection();
            case ExecutiveAction.EXECUTION:
                return renderExecution();
            default:
                return null;
        }
    };

    const renderInvestigation = () => {
        if (isVC) {
            if (gameState.investigatedPlayerId) {
                const investigated = gameState.players.find(p => p.id === gameState.investigatedPlayerId);
                const partyMembership = investigated?.role === 'STUDENT_UNION' ? 'Student Union' : "Chancellor's Office";

                return (
                    <div className={styles.phaseContent}>
                        <div className={styles.phaseHeader}>
                            <h2 className={styles.phaseTitle}>🔍 Investigation Complete</h2>
                            <p className={styles.phaseDescription}>
                                You investigated <strong>{investigated?.name}</strong>
                            </p>
                        </div>

                        <div className={styles.investigationResult}>
                            <div className={`${styles.partyCard} ${investigated?.role === 'STUDENT_UNION' ? styles.suParty : styles.adminParty}`}>
                                <span className={styles.partyEmoji}>
                                    {investigated?.role === 'STUDENT_UNION' ? '📚' : '🏛️'}
                                </span>
                                <span className={styles.partyName}>{partyMembership}</span>
                            </div>
                            <p className={styles.investigationNote}>
                                Only you know this information. Use it wisely!
                            </p>
                        </div>

                        <button className="btn btn-gold" onClick={completeInvestigation}>
                            Continue
                        </button>
                    </div>
                );
            }

            const canInvestigate = (player: Player) => {
                return player.isAlive && player.id !== playerId && !player.hasBeenInvestigated;
            };

            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>🔍 Investigation</h2>
                        <p className={styles.phaseDescription}>
                            Choose a player to investigate. You will see their party membership.
                        </p>
                    </div>

                    <PlayerList
                        players={gameState.players}
                        currentPlayerId={playerId}
                        hostId={gameState.hostId}
                        onSelectPlayer={(id) => investigate(id)}
                        selectableFilter={canInvestigate}
                        isSelecting={true}
                    />
                </div>
            );
        }

        const vc = gameState.players.find(p => p.isViceChancellor);
        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>🔍 Investigation</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> is investigating a player...
                    </p>
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Investigation in progress...</span>
                </div>
            </div>
        );
    };

    const renderPeek = () => {
        if (isVC) {
            if (gameState.peekedPolicies.length > 0) {
                return (
                    <div className={styles.phaseContent}>
                        <div className={styles.phaseHeader}>
                            <h2 className={styles.phaseTitle}>👁️ Policy Peek</h2>
                            <p className={styles.phaseDescription}>
                                These are the next 3 policies in the deck:
                            </p>
                        </div>

                        <div className={styles.policySelection}>
                            <PolicyCardGroup policies={gameState.peekedPolicies} />
                        </div>

                        <p className={styles.peekNote}>
                            Memorize these! You may share this information... or lie about it.
                        </p>

                        <button className="btn btn-gold" onClick={completePeek}>
                            Continue
                        </button>
                    </div>
                );
            }

            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>👁️ Policy Peek</h2>
                        <p className={styles.phaseDescription}>
                            You may peek at the next 3 policies in the deck.
                        </p>
                    </div>

                    <button className="btn btn-gold" onClick={peekPolicies}>
                        Peek at Policies
                    </button>
                </div>
            );
        }

        const vc = gameState.players.find(p => p.isViceChancellor);
        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>👁️ Policy Peek</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> is peeking at the next policies...
                    </p>
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Viewing policies...</span>
                </div>
            </div>
        );
    };

    const renderSpecialElection = () => {
        if (isVC) {
            const canSelect = (player: Player) => {
                return player.isAlive && player.id !== playerId;
            };

            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>🗳️ Special Election</h2>
                        <p className={styles.phaseDescription}>
                            Choose the next Vice-Chancellor. They will nominate a Policy Chair.
                        </p>
                    </div>

                    <PlayerList
                        players={gameState.players}
                        currentPlayerId={playerId}
                        hostId={gameState.hostId}
                        onSelectPlayer={(id) => specialElection(id)}
                        selectableFilter={canSelect}
                        isSelecting={true}
                    />
                </div>
            );
        }

        const vc = gameState.players.find(p => p.isViceChancellor);
        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>🗳️ Special Election</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> is choosing the next Vice-Chancellor...
                    </p>
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>Selection in progress...</span>
                </div>
            </div>
        );
    };

    const renderExecution = () => {
        if (isVC) {
            const canExecute = (player: Player) => {
                return player.isAlive && player.id !== playerId;
            };

            return (
                <div className={styles.phaseContent}>
                    <div className={styles.phaseHeader}>
                        <h2 className={styles.phaseTitle}>☠️ Execution</h2>
                        <p className={styles.phaseDescription}>
                            You must execute a player. Choose wisely - if you execute the Chancellor, the Student Union wins!
                        </p>
                    </div>

                    <PlayerList
                        players={gameState.players}
                        currentPlayerId={playerId}
                        hostId={gameState.hostId}
                        onSelectPlayer={(id) => {
                            if (confirm('Are you sure you want to execute this player?')) {
                                executePlayer(id);
                            }
                        }}
                        selectableFilter={canExecute}
                        isSelecting={true}
                    />
                </div>
            );
        }

        const vc = gameState.players.find(p => p.isViceChancellor);
        return (
            <div className={styles.phaseContent}>
                <div className={styles.phaseHeader}>
                    <h2 className={styles.phaseTitle}>☠️ Execution</h2>
                    <p className={styles.phaseDescription}>
                        <strong>{vc?.name}</strong> must execute a player...
                    </p>
                </div>

                <div className={styles.waitingIndicator}>
                    <div className={styles.spinner}></div>
                    <span>The Vice-Chancellor is deciding...</span>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>🎓 Secret Chancellor</h1>
                <div className={styles.electionTracker}>
                    <span className={styles.electionLabel}>Election Tracker:</span>
                    <div className={styles.electionMarkers}>
                        {[0, 1, 2].map(i => (
                            <div
                                key={i}
                                className={`${styles.electionMarker} ${i < gameState.failedElections ? styles.active : ''
                                    }`}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                    {gameState.failedElections === 2 && (
                        <span className={styles.electionWarning}>⚠️ Next failure = chaos!</span>
                    )}
                </div>
            </div>

            <div className={styles.main}>
                <div className={styles.leftPanel}>
                    <div className={styles.tracks}>
                        <PolicyTrack
                            type="student_union"
                            count={gameState.studentUnionPolicies}
                            playerCount={gameState.players.length}
                        />
                        <PolicyTrack
                            type="admin"
                            count={gameState.adminPolicies}
                            playerCount={gameState.players.length}
                        />
                    </div>

                    <div className={styles.phasePanel}>
                        {renderPhaseContent()}
                    </div>
                </div>

                <div className={styles.rightPanel}>
                    <Chat />
                </div>
            </div>
        </div>
    );
}
