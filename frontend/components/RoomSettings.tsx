import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';
import { animations } from '../animations';
import { THEME } from '../constants/theme';

interface RoomSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

// Define settings interface based on backend schema
interface RoomSettingsType {
  max_players: number;
  starting_cash: number;
  auction_enabled: boolean;
  double_rent_enabled: boolean;
  mortgage_enabled: boolean;
  free_parking_jackpot: boolean;
  turn_timer_seconds: number;
  random_turn_order: boolean;
  jail_strict_mode: boolean;
  board_theme: string;
}

export const RoomSettings = ({ isOpen, onClose }: RoomSettingsProps) => {
  const { room, myId } = useGameStore();
  
  // Default settings
  const defaultSettings: RoomSettingsType = {
    max_players: 6,
    starting_cash: 150000,
    auction_enabled: true,
    double_rent_enabled: true,
    mortgage_enabled: true,
    free_parking_jackpot: false,
    turn_timer_seconds: 60,
    random_turn_order: true,
    jail_strict_mode: true,
    board_theme: 'pan_india',
  };

  // Use room settings if available, otherwise use defaults
  const [settings, setSettings] = useState<RoomSettingsType>(defaultSettings);

  const isHost = room?.host_id === myId;

  const handleSettingChange = (key: keyof RoomSettingsType, value: any) => {
    if (!isHost) return;
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!isHost) return;
    // TODO: Implement socket event to update room settings
    console.log('Saving settings:', settings);
    onClose();
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  const formatCurrency = (amount: number) => {
    return `₹${(amount / 1000).toFixed(0)}k`;
  };

  const themeOptions = [
    { value: 'pan_india', label: 'Pan-India', icon: '🇮🇳' },
    { value: 'classic', label: 'Classic Monopoly', icon: '🏛️' },
    { value: 'cyber', label: 'Cyberpunk', icon: '🤖' },
    { value: 'fantasy', label: 'Fantasy', icon: '🐉' },
    { value: 'space', label: 'Space', icon: '🚀' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          variants={animations.modalBackdrop}
        >
          <motion.div 
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="glass-panel-dark p-8 rounded-3xl w-full max-w-4xl border-2 border-primary-500/30 shadow-2xl neon-glow-strong max-h-[90vh] overflow-y-auto"
            variants={animations.modalContent}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="heading-cyber text-3xl font-bold text-primary-300 mb-2">
                  <span className="text-gradient-primary">ROOM SETTINGS</span>
                </h2>
                <p className="text-text-muted font-cyber">
                  Room Code: <span className="text-accent-400 font-bold tracking-widest">{room?.room_id}</span>
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {isHost ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success-500/20 border border-success-500/30">
                    <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
                    <span className="text-success-400 text-sm font-bold">HOST</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface border border-primary-500/30">
                    <span className="text-primary-400 text-sm font-bold">PLAYER</span>
                  </div>
                )}
                
                <motion.button
                  onClick={onClose}
                  className="glass-button p-2 rounded-xl border border-danger-500/30 hover:border-danger-500 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <span className="text-danger-400 text-xl">✕</span>
                </motion.button>
              </div>
            </div>

            {!isHost && (
              <motion.div 
                className="glass-panel p-4 rounded-xl border border-warning-500/30 mb-6"
                variants={animations.fadeIn}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">🔒</div>
                  <div>
                    <p className="text-warning-400 font-bold">Settings Locked</p>
                    <p className="text-text-muted text-sm">Only the room host can modify game settings.</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Settings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Game Rules */}
              <motion.div 
                className="glass-panel p-6 rounded-2xl border border-primary-500/20"
                variants={animations.fadeIn}
              >
                <h3 className="text-xl font-bold text-primary-300 mb-4 flex items-center gap-2">
                  <span className="text-2xl">⚙️</span>
                  Game Rules
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-main">Max Players</p>
                      <p className="text-sm text-text-muted">Maximum number of players in room</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[2, 3, 4, 5, 6].map(num => (
                        <motion.button
                          key={num}
                          onClick={() => handleSettingChange('max_players', num)}
                          className={`px-3 py-1.5 rounded-lg border ${settings.max_players === num ? 'bg-primary-500/30 border-primary-500 text-primary-300' : 'bg-surface/50 border-white/10 text-text-muted hover:border-primary-500/30'}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!isHost}
                        >
                          {num}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-main">Starting Cash</p>
                      <p className="text-sm text-text-muted">Initial money for each player</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <motion.button
                        onClick={() => handleSettingChange('starting_cash', Math.max(50000, settings.starting_cash - 50000))}
                        className="glass-button p-2 rounded-lg border border-primary-500/30"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={!isHost || settings.starting_cash <= 50000}
                      >
                        <span className="text-primary-300">−</span>
                      </motion.button>
                      
                      <div className="min-w-[120px] text-center">
                        <p className="text-2xl font-bold text-success-400">{formatCurrency(settings.starting_cash)}</p>
                        <input
                          type="range"
                          min="50000"
                          max="1000000"
                          step="50000"
                          value={settings.starting_cash}
                          onChange={(e) => handleSettingChange('starting_cash', parseInt(e.target.value))}
                          className="w-full h-2 bg-surface rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
                          disabled={!isHost}
                        />
                      </div>
                      
                      <motion.button
                        onClick={() => handleSettingChange('starting_cash', Math.min(1000000, settings.starting_cash + 50000))}
                        className="glass-button p-2 rounded-lg border border-primary-500/30"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        disabled={!isHost || settings.starting_cash >= 1000000}
                      >
                        <span className="text-primary-300">+</span>
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-text-main">Turn Timer</p>
                      <p className="text-sm text-text-muted">Seconds per turn before timeout</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[30, 45, 60, 90, 120].map(seconds => (
                        <motion.button
                          key={seconds}
                          onClick={() => handleSettingChange('turn_timer_seconds', seconds)}
                          className={`px-3 py-1.5 rounded-lg border ${settings.turn_timer_seconds === seconds ? 'bg-accent-500/30 border-accent-500 text-accent-300' : 'bg-surface/50 border-white/10 text-text-muted hover:border-accent-500/30'}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={!isHost}
                        >
                          {seconds}s
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Game Features */}
              <motion.div 
                className="glass-panel p-6 rounded-2xl border border-accent-500/20"
                variants={animations.fadeIn}
              >
                <h3 className="text-xl font-bold text-accent-300 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎮</span>
                  Game Features
                </h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'auction_enabled' as const, label: 'Auctions', description: 'Enable property auctions' },
                    { key: 'double_rent_enabled' as const, label: 'Double Rent', description: 'Double rent on monopoly properties' },
                    { key: 'mortgage_enabled' as const, label: 'Mortgages', description: 'Allow property mortgaging' },
                    { key: 'free_parking_jackpot' as const, label: 'Free Parking Jackpot', description: 'Taxes go to free parking' },
                    { key: 'random_turn_order' as const, label: 'Random Turn Order', description: 'Shuffle player order at start' },
                    { key: 'jail_strict_mode' as const, label: 'Strict Jail Rules', description: 'Enforce strict jail handling' },
                  ].map(({ key, label, description }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-text-main">{label}</p>
                        <p className="text-sm text-text-muted">{description}</p>
                      </div>
                      <motion.button
                        onClick={() => handleSettingChange(key, !settings[key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings[key] ? 'bg-success-500' : 'bg-surface border border-white/20'}`}
                        whileTap={{ scale: 0.95 }}
                        disabled={!isHost}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </motion.button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Board Theme */}
              <motion.div 
                className="glass-panel p-6 rounded-2xl border border-success-500/20 md:col-span-2"
                variants={animations.fadeIn}
              >
                <h3 className="text-xl font-bold text-success-300 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎨</span>
                  Board Theme
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {themeOptions.map((theme) => (
                    <motion.button
                      key={theme.value}
                      onClick={() => handleSettingChange('board_theme', theme.value)}
                      className={`glass-button p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative ${settings.board_theme === theme.value ? 'border-primary-500 bg-primary-500/10' : 'border-white/10 hover:border-primary-500/30'}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={!isHost}
                    >
                      <span className="text-3xl">{theme.icon}</span>
                      <span className={`font-medium ${settings.board_theme === theme.value ? 'text-primary-300' : 'text-text-main'}`}>
                        {theme.label}
                      </span>
                      {settings.board_theme === theme.value && (
                        <motion.div 
                          className="absolute top-2 right-2 w-3 h-3 bg-primary-500 rounded-full"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Player Management */}
              {isHost && room?.players && (
                <motion.div 
                  className="glass-panel p-6 rounded-2xl border border-warning-500/20 md:col-span-2"
                  variants={animations.fadeIn}
                >
                  <h3 className="text-xl font-bold text-warning-300 mb-4 flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    Player Management
                  </h3>
                  
                  <div className="space-y-3">
                    {Object.values(room.players).map((player: any) => (
                      <div key={player.id} className="flex items-center justify-between bg-surface/50 p-3 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-8 h-8 rounded-full border-2"
                            style={{ backgroundColor: player.color, borderColor: player.color }}
                          ></div>
                          <div>
                            <p className="font-medium text-text-main">{player.name}</p>
                            <p className="text-xs text-text-muted">ID: {player.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {player.id === room.host_id ? (
                            <span className="px-2 py-1 bg-success-500/20 text-success-400 text-xs rounded-full">
                              Host
                            </span>
                          ) : (
                            <motion.button
                              className="px-3 py-1 bg-danger-500/20 text-danger-400 text-sm rounded-lg hover:bg-danger-500/30 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Kick
                            </motion.button>
                          )}
                          
                          <div className={`w-2 h-2 rounded-full ${player.connected ? 'bg-success-500 animate-pulse' : 'bg-danger-500'}`}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
              <div className="text-sm text-text-muted">
                <p>Settings affect all players. Changes take effect immediately.</p>
              </div>
              
              <div className="flex gap-4">
                <motion.button
                  onClick={handleReset}
                  className="btn-ghost px-6 py-3 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!isHost}
                >
                  Reset to Defaults
                </motion.button>
                
                <motion.button
                  onClick={handleSave}
                  className="btn-primary px-8 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!isHost}
                >
                  <span className="text-xl">💾</span>
                  Save Settings
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};