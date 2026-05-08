import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Board } from '../components/Board';

function App() {
  const { connected, room, game, connect, createRoom, joinRoom, error } = useGameStore();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    connect();
  }, [connect]);

  if (!connected) {
    return <div className="flex h-screen items-center justify-center">Connecting to server...</div>;
  }

  // Lobby
  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="glass-panel p-8 rounded-xl w-full max-w-md flex flex-col gap-6">
          <h1 className="text-3xl font-bold text-center text-primary neon-glow mb-4">DINO-RICHUP</h1>
          
          {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded">{error}</div>}

          <div>
            <label className="block text-sm text-slate-400 mb-2">Your Name</label>
            <input 
              className="w-full bg-surface border border-slate-700 rounded p-3 text-slate-100"
              value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name"
            />
          </div>

          <button 
            className="w-full bg-primary/20 border border-primary text-primary font-bold py-3 rounded hover:bg-primary/30 transition-colors"
            onClick={() => createRoom(name || 'Player', 'cyan')}
          >
            Create New Room
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-slate-700 flex-1"></div>
            <span className="text-slate-500 text-sm">OR</span>
            <div className="h-px bg-slate-700 flex-1"></div>
          </div>

          <div className="flex gap-2">
            <input 
              className="flex-1 bg-surface border border-slate-700 rounded p-3 text-slate-100 uppercase"
              value={roomCode} onChange={e => setRoomCode(e.target.value)} placeholder="Room Code"
            />
            <button 
              className="bg-accent/20 border border-accent text-accent font-bold px-6 rounded hover:bg-accent/30 transition-colors"
              onClick={() => joinRoom(roomCode, name || 'Player', 'cyan')}
            >
              Join
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting Room
  if (room.status === 'waiting') {
    const isHost = room.host_id === useGameStore.getState().myId;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-xl w-full max-w-lg">
          <h2 className="text-2xl mb-2">Room Code: <span className="text-primary font-bold tracking-widest">{room.room_id}</span></h2>
          <p className="text-slate-400 mb-6">Waiting for players...</p>
          
          <div className="flex flex-col gap-3 mb-8">
            {Object.values(room.players).map(p => (
              <div key={p.id} className="bg-surface p-4 rounded border border-slate-800 flex justify-between items-center">
                <span>{p.name} {p.id === room.host_id ? '(Host)' : ''}</span>
                <div className={`w-3 h-3 rounded-full ${p.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
            ))}
          </div>

          {isHost && (
            <button 
              className="w-full bg-green-500/20 border border-green-500 text-green-400 font-bold py-3 rounded"
              onClick={() => useGameStore.getState().startGame()}
            >
              Start Game
            </button>
          )}
        </div>
      </div>
    );
  }

  // Game Board
  return (
    <div className="min-h-screen flex flex-col p-4 bg-background">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-primary neon-glow">DINO-RICHUP</h1>
        <div className="flex gap-4">
          <div className="glass-panel px-4 py-2 rounded">
            Turn: <span className="text-accent font-bold">{game?.room.players[game?.turn_order[game.current_turn_index]].name}</span>
          </div>
          <div className="glass-panel px-4 py-2 rounded">
            My Money: <span className="text-green-400 font-bold">₹{game?.room.players[useGameStore.getState().myId!]?.money}</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex w-full">
        <Board />
        
        {/* Right Sidebar */}
        <div className="w-64 ml-4 flex flex-col gap-4 hidden lg:flex">
          <div className="glass-panel flex-1 rounded-xl p-4 overflow-y-auto">
            <h3 className="text-primary font-bold mb-4 border-b border-slate-700 pb-2">History Log</h3>
            <div className="flex flex-col gap-2 text-sm text-slate-300">
              {game.history_log.slice().reverse().map((log, i) => (
                <div key={i} className="bg-surface p-2 rounded border border-slate-800">{log}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
