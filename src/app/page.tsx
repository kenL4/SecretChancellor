'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GameProvider } from '@/context/GameContext';
import Game from '@/components/Game';

function GameWithParams() {
  const searchParams = useSearchParams();
  const joinGameId = searchParams?.get('join') || undefined;

  return <Game initialGameId={joinGameId} />;
}

function LoadingSpinner() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      color: '#a0a8b0'
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        border: '3px solid rgba(164, 193, 173, 0.2)',
        borderTopColor: '#c4a35a',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span>Loading Secret Chancellor...</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <Suspense fallback={<LoadingSpinner />}>
        <GameWithParams />
      </Suspense>
    </GameProvider>
  );
}
