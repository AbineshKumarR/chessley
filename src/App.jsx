import React from 'react';
import ChessGame from './components/ChessGame';

export default function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-[#81b64c]/30 selection:text-white">
      <ChessGame />
    </div>
  );
}
