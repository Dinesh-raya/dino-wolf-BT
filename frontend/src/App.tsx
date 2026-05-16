import { useEffect, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { Board } from '../components/Board';
import { AuctionModal } from '../components/AuctionModal';
import { PlayerSidebar } from '../components/PlayerSidebar';
import { RoomSettings } from '../components/RoomSettings';
import { AudioSettings } from '../components/AudioSettings';
import { motion } from 'framer-motion';
import { soundManager } from '../utils/audio';

function App() {
  const { connected, room, game, connect, createRoom, joinRoom, error, myId } = useGameStore();
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAudioSettings, setShowAudioSettings] = useState(false);

  useEffect(() => {
    connect();
  }, [connect]);

  if (!connected) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-pulse">🌐</div>
          <h1 className="text-2xl font-bold text-primary-300 mb-2">Connecting to Server</h1>
          <p className="text-text-muted">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  // Lobby
  if (!room) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <motion.div 
          className="glass-panel-dark p-8 rounded-3xl w-full max-w-md border-2 border-primary-500/30 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="heading-cyber text-4xl font-bold text-center text-primary-300 mb-6 neon-glow">
            DINO-RICHUP
          </h1>
          <p className="text-center text-text-muted mb-8 font-cyber">PAN-INDIA EDITION</p>
          
          {error && (
            <motion.div 
              className="bg-danger-500/20 border border-danger-500 text-danger-300 p-4 rounded-xl mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.div>
          )}

          <div className="space-y-6">
            <div>
              <label className="block text-sm text-text-muted mb-2 font-cyber">YOUR NAME</label>
              <input 
                className="w-full bg-surface/50 border-2 border-primary-500/30 rounded-xl p-4 text-white placeholder:text-text-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="Enter your name"
              />
            </div>

            <motion.button
              className="w-full btn-primary py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-3"
              onClick={() => {
                soundManager.playButtonClick();
                soundManager.playGameStart();
                createRoom(name || 'Player', 'cyan');
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-2xl">🚀</span>
              CREATE NEW ROOM
            </motion.button>

            <div className="flex items-center gap-3 my-4">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-text-muted text-sm font-cyber">OR</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-text-muted mb-2 font-cyber">ROOM CODE</label>
                <input 
                  className="w-full bg-surface/50 border-2 border-accent-500/30 rounded-xl p-4 text-white placeholder:text-text-muted uppercase tracking-widest focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-500/50"
                  value={roomCode} 
                  onChange={e => setRoomCode(e.target.value.toUpperCase())} 
                  placeholder="ABCDEF"
                  maxLength={6}
                />
              </div>
              
              <motion.button
                className="w-full btn-accent py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-3"
                onClick={() => {
                  soundManager.playButtonClick();
                  joinRoom(roomCode, name || 'Player', 'cyan');
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="text-2xl">🔗</span>
                JOIN ROOM
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Waiting Room
  if (room.status === 'waiting') {
    const isHost = room.host_id === myId;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        <motion.div 
          className="glass-panel-dark p-8 rounded-3xl w-full max-w-2xl border-2 border-primary-500/30 shadow-2xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-8">
            <h2 className="heading-cyber text-3xl font-bold text-primary-300 mb-2">WAITING ROOM</h2>
            <p className="text-text-muted font-cyber">Share this code with friends:</p>
            <div className="inline-block mt-4">
              <div className="text-5xl font-bold tracking-widest text-accent-400 bg-surface/50 px-8 py-4 rounded-2xl border-2 border-accent-500/30 neon-glow">
                {room.room_id}
              </div>
              <p className="text-sm text-text-muted mt-2">Room will start automatically when all players join</p>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-xl font-bold text-primary-300 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              PLAYERS ({Object.values(room.players).length}/6)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(room.players).map(p => (
                <motion.div 
                  key={p.id} 
                  className="glass-panel p-4 rounded-xl border border-primary-500/20 flex items-center justify-between"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full border-2"
                      style={{ backgroundColor: p.color, borderColor: p.color }}
                    ></div>
                    <div>
                      <p className="font-bold text-text-main">{p.name}</p>
                      <p className="text-xs text-text-muted">{p.id === room.host_id ? 'Host' : 'Player'}</p>
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${p.connected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`}></div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              onClick={() => {
                soundManager.playButtonClick();
                setShowRoomSettings(true);
              }}
              className="btn-ghost flex-1 py-4 rounded-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              ⚙️ Room Settings
            </motion.button>
            
            {isHost && (
              <motion.button
                className="btn-primary flex-1 py-4 text-lg font-bold rounded-xl"
                onClick={() => {
                  soundManager.playButtonClick();
                  soundManager.playGameStart();
                  useGameStore.getState().startGame();
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🚀 START GAME
              </motion.button>
            )}
          </div>
        </motion.div>

        <RoomSettings 
          isOpen={showRoomSettings} 
          onClose={() => setShowRoomSettings(false)} 
        />
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin">🎲</div>
          <h1 className="text-2xl font-bold text-primary-300 mb-2">Loading Game</h1>
          <p className="text-text-muted">Initializing board and players...</p>
        </div>
      </div>
    );
  }

  // Game Board
  const activePlayerId = game.turn_order[game.current_turn_index];
  const activePlayerName = activePlayerId ? game.room.players?.[activePlayerId]?.name : 'Unknown';
  const myMoney = myId ? game.room.players?.[myId]?.money : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Top Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/10 bg-surface/50">
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="glass-button p-2 rounded-xl"
        >
          <span className="text-2xl">☰</span>
        </button>
        
        <h1 className="heading-cyber text-xl font-bold text-primary-300">DINO-RICHUP</h1>
        
        <div className="flex items-center gap-2">
          <div className="text-sm">
            <span className="text-text-muted">Turn:</span>
            <span className="text-accent-400 font-bold ml-1">{activePlayerName}</span>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex justify-between items-center p-6 border-b border-white/10 bg-surface/50">
        <div className="flex items-center gap-6">
          <h1 className="heading-cyber text-3xl font-bold text-primary-300 neon-glow">DINO-RICHUP</h1>
          <span className="text-text-muted font-cyber">PAN-INDIA EDITION</span>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="glass-panel px-6 py-3 rounded-xl">
            <span className="text-text-muted">Turn:</span>
            <span className="text-accent-400 font-bold ml-2">{activePlayerName}</span>
          </div>
          
          <div className="glass-panel px-6 py-3 rounded-xl">
            <span className="text-text-muted">My Money:</span>
            <span className="text-success-400 font-bold ml-2">₹{myMoney ?? 0}</span>
          </div>
          
          <motion.button
            onClick={() => {
              soundManager.playButtonClick();
              setShowAudioSettings(true);
            }}
            className="glass-button px-4 py-3 rounded-xl border border-primary-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🔊 Audio
          </motion.button>
          
          <motion.button
            onClick={() => {
              soundManager.playButtonClick();
              setShowRoomSettings(true);
            }}
            className="glass-button px-4 py-3 rounded-xl border border-primary-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚙️ Settings
          </motion.button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-2 lg:p-6 gap-4 lg:gap-6">
        {/* Mobile Sidebar (Drawer) */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div 
              className="absolute top-0 left-0 h-full w-80 bg-surface border-r border-white/10 shadow-2xl"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              transition={{ type: "spring", damping: 25 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary-300">Game Menu</h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="text-2xl text-text-muted"
                  >
                    ✕
                  </button>
                </div>
                
                {/* Mobile Menu Options */}
                <div className="space-y-3 mb-6">
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      setShowAudioSettings(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full glass-button p-4 rounded-xl flex items-center gap-3"
                  >
                    <span className="text-xl">🔊</span>
                    <span className="font-medium">Audio Settings</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      soundManager.playButtonClick();
                      setShowRoomSettings(true);
                      setShowMobileMenu(false);
                    }}
                    className="w-full glass-button p-4 rounded-xl flex items-center gap-3"
                  >
                    <span className="text-xl">⚙️</span>
                    <span className="font-medium">Room Settings</span>
                  </button>
                </div>
                
                <PlayerSidebar
                  players={Object.values(room.players).map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    color: p.color,
                    money: p.money,
                    position: p.position,
                    connected: p.connected,
                    isHost: p.id === room.host_id,
                    isCurrentTurn: p.id === activePlayerId
                  }))}
                  currentPlayerId={myId || undefined}
                  activePlayerId={activePlayerId}
                  compact
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* Left Sidebar - Player List (Desktop) */}
        <div className="hidden lg:block w-80">
          <PlayerSidebar
            players={Object.values(room.players).map((p: any) => ({
              id: p.id,
              name: p.name,
              color: p.color,
              money: p.money,
              position: p.position,
              connected: p.connected,
              isHost: p.id === room.host_id,
              isCurrentTurn: p.id === activePlayerId
            }))}
            currentPlayerId={myId || undefined}
            activePlayerId={activePlayerId}
          />
        </div>

        {/* Center Board */}
        <div className="flex-1 flex items-center justify-center p-2 lg:p-4">
          <Board />
        </div>

        {/* Right Sidebar - History Log (Desktop) */}
        <div className="hidden lg:block w-80">
          <div className="glass-panel-dark h-full rounded-3xl p-6 border-2 border-primary-500/30 overflow-hidden">
            <h3 className="text-xl font-bold text-primary-300 mb-6 flex items-center gap-2">
              <span className="text-2xl">📜</span>
              GAME HISTORY
            </h3>
            
            <div className="space-y-3 overflow-y-auto h-[calc(100%-4rem)] pr-2">
              {game.history_log.slice().reverse().map((log, i) => (
                <motion.div 
                  key={i} 
                  className="glass-panel p-4 rounded-xl border border-white/10"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <p className="text-sm text-text-main">{log}</p>
                  <p className="text-xs text-text-muted mt-1">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </motion.div>
              ))}
              
              {game.history_log.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-text-muted">No game events yet</p>
                  <p className="text-sm text-text-muted mt-1">Game history will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-white/10 p-4 z-30">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <p className="text-xs text-text-muted">My Money</p>
              <p className="text-lg font-bold text-success-400">₹{myMoney ?? 0}</p>
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => setShowMobileMenu(true)}
                className="glass-button p-3 rounded-xl"
              >
                <span className="text-xl">👥</span>
              </button>
              
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setShowAudioSettings(true);
                }}
                className="glass-button p-3 rounded-xl"
              >
                <span className="text-xl">🔊</span>
              </button>
              
              <button
                onClick={() => {
                  soundManager.playButtonClick();
                  setShowRoomSettings(true);
                }}
                className="glass-button p-3 rounded-xl"
              >
                <span className="text-xl">⚙️</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AuctionModal />
      <RoomSettings
        isOpen={showRoomSettings}
        onClose={() => setShowRoomSettings(false)}
      />
      <AudioSettings
        isOpen={showAudioSettings}
        onClose={() => setShowAudioSettings(false)}
      />
    </div>
  );
}

export default App;
