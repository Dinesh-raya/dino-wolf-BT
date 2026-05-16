import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { animations } from '../animations';
import { THEME } from '../constants/theme';
import { DiceAnim } from './DiceAnim';
import { TokenVisualizer } from './TokenVisualizer';
import { CenterPanel } from './CenterPanel';
import { soundManager } from '../utils/audio';

import boardData from '../../shared/configs/board_config.json';

// Color mapping for board tiles
const BOARD_COLORS: Record<string, string> = {
  brown: '#8B4513',
  light_blue: '#87CEFA',
  pink: '#FF69B4',
  orange: '#FFA500',
  red: '#FF0000',
  yellow: '#FFD700',
  green: '#008000',
  dark_blue: '#00008B',
  utility: '#E5E7EB',
  airport: '#9CA3AF',
  tax: '#EF4444',
  card: '#F59E0B',
  jail: '#374151',
  free_parking: '#10b981',
  go: '#22c55e',
};

// Get grid position for 11x11 board
const getGridPosition = (index: number) => {
  if (index >= 0 && index <= 10) return { gridRow: 11, gridColumn: 11 - index };
  if (index > 10 && index <= 20) return { gridRow: 11 - (index - 10), gridColumn: 1 };
  if (index > 20 && index <= 30) return { gridRow: 1, gridColumn: 1 + (index - 20) };
  if (index > 30 && index < 40) return { gridRow: 1 + (index - 30), gridColumn: 11 };
  return { gridRow: 6, gridColumn: 6 };
};

// Helper function to check if a player has monopoly on a color group
const hasMonopoly = (game: any, tile: any, playerId: string) => {
  if (!tile.color || tile.type !== 'property') return false;
  
  const colorGroupIds = boardData.tiles
    .filter((t: any) => t.color === tile.color && t.type === 'property')
    .map((t: any) => t.id);
  
  return colorGroupIds.every((id: number) => {
    const prop = game.properties[id];
    return prop && prop.owner_id === playerId;
  });
};

// Helper function to get property state
const getPropertyState = (game: any, tileId: number) => {
  return game.properties[tileId] || null;
};

// Helper function to get tile color
const getTileColor = (tile: any) => {
  return BOARD_COLORS[tile.color] || tile.color || '#374151';
};

export const Board = () => {
  const { game, myId, turn } = useGameStore();
  const [isRolling, setIsRolling] = useState(false);
  const [diceValues, setDiceValues] = useState({ die1: 1, die2: 1 });
  const [isMoving, setIsMoving] = useState(false);

  // Handle dice roll
  const handleRollDice = () => {
    if (!turn?.can_roll || isRolling) return;
    
    setIsRolling(true);
    soundManager.playButtonClick();
    
    // Simulate dice rolling animation
    const rollInterval = setInterval(() => {
      setDiceValues({
        die1: Math.floor(Math.random() * 6) + 1,
        die2: Math.floor(Math.random() * 6) + 1
      });
    }, 100);
    
    // Stop rolling after 1.5 seconds and send actual roll
    setTimeout(() => {
      clearInterval(rollInterval);
      setIsRolling(false);
      useGameStore.getState().rollDice();
      
      // Play movement sound
      soundManager.playPlayerMove();
      
      // Start movement animation
      setIsMoving(true);
      setTimeout(() => setIsMoving(false), 1500);
    }, 1500);
  };

  // Handle move complete
  const handleMoveComplete = () => {
    setIsMoving(false);
  };

  if (!game) return null;

  // Use local dice values for animation
  const currentDice = diceValues;

  return (
    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden">
      <motion.div
        className="relative grid glass-panel-dark border-2 border-primary-500/30 shadow-2xl rounded-3xl overflow-hidden neon-glow"
        style={{
          gridTemplateColumns: 'repeat(11, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(11, minmax(0, 1fr))',
          aspectRatio: '1/1',
          width: '100%',
          maxWidth: '900px',
          position: 'relative',
        }}
        variants={animations.fadeIn}
        initial="hidden"
        animate="visible"
      >
        {/* Token Visualizer Overlay */}
        <TokenVisualizer
          players={Object.values(game.room.players).map((p: any) => ({
            id: p.id,
            name: p.name,
            color: p.color,
            position: p.position,
            money: p.money
          }))}
          currentPlayerId={turn?.active_player_id}
          isMoving={isMoving}
          onMoveComplete={handleMoveComplete}
          boardSize={{ width: 800, height: 800 }}
        />

        {/* Center Area */}
        <div className="absolute inset-0 z-0" style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}>
          <div className="absolute inset-0 bg-gradient-to-br from-primary-900/10 via-accent-900/5 to-primary-900/10 rounded-3xl">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-400/5 via-transparent to-transparent"></div>
          </div>
          
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-center">
            <motion.h1
              className="heading-cyber text-3xl md:text-5xl"
              variants={animations.glowPulse}
              animate="visible"
            >
              DINO-RICHUP
            </motion.h1>
            <p className="text-text-muted text-sm md:text-lg font-cyber mt-1">
              PAN-INDIA EDITION
            </p>
          </div>
          
          {/* Turn indicator with enhanced dice */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-4/5 max-w-md">
            {turn?.active_player_id === myId ? (
              <motion.div
                className="glass-panel-primary p-6 rounded-2xl border border-primary-500/30 shadow-xl"
                variants={animations.glowPulse}
                animate="visible"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                    <h3 className="text-primary-300 font-bold text-lg">YOUR TURN!</h3>
                  </div>
                  
                  {/* Enhanced Dice Display */}
                  <div className="my-2">
                    <DiceAnim
                      die1={currentDice.die1}
                      die2={currentDice.die2}
                      isRolling={isRolling}
                      onRollComplete={() => setIsRolling(false)}
                      size="md"
                      showTotal={!isRolling}
                    />
                  </div>
                  
                  {turn.can_roll && !isRolling && (
                    <motion.button
                      className="btn-primary py-3 px-8 text-lg font-bold rounded-full flex items-center gap-2"
                      onClick={handleRollDice}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      disabled={isRolling}
                    >
                      <span className="text-xl">🎲</span>
                      ROLL DICE
                    </motion.button>
                  )}
                  
                  {turn.can_end_turn && (
                    <motion.button
                      className="btn-ghost py-2 px-6 text-sm"
                      onClick={() => {
                        soundManager.playButtonClick();
                        useGameStore.getState().endTurn();
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      END TURN
                    </motion.button>
                  )}
                  
                  {turn.phase === 'buy' && (
                    <motion.div 
                      className="mt-2 text-center"
                      variants={animations.fadeIn}
                    >
                      <p className="text-text-muted text-sm mb-2">Do you want to buy this property?</p>
                      <div className="flex gap-3">
                        <motion.button
                          className="bg-success-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-success-600 transition-colors"
                          onClick={() => {
                            const me = game.room.players[myId!];
                            soundManager.playBuyProperty();
                            useGameStore.getState().buyProperty(me.position);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Buy
                        </motion.button>
                        <motion.button
                          className="bg-danger-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-danger-600 transition-colors"
                          onClick={() => {
                            const me = game.room.players[myId!];
                            soundManager.playAuctionBid();
                            useGameStore.getState().startAuction(me.position);
                          }}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Auction
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-panel p-4 rounded-xl text-text-muted text-center">
                Waiting for {game.room.players[turn?.active_player_id || '']?.name}'s move...
              </div>
            )}
          </div>
        </div>

        {/* Tiles */}
        {boardData.tiles.map((tile: any) => {
          const pos = getGridPosition(tile.id);
          const isCorner = [0, 10, 20, 30].includes(tile.id);
          const propState = getPropertyState(game, tile.id);
          const ownerId = propState?.owner_id;
          const houses = propState?.houses || 0;
          const hotels = propState?.hotels || 0;
          const isMortgaged = propState?.is_mortgaged || false;
          const hasMonopolyOnTile = ownerId ? hasMonopoly(game, tile, ownerId) : false;
          const tileColor = getTileColor(tile);
          
          return (
            <motion.div
              key={tile.id}
              className={`flex flex-col relative overflow-hidden border border-white/10 ${isCorner ? 'p-2 justify-center items-center' : ''}`}
              style={{ ...pos }}
              variants={animations.fadeIn}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              transition={{ duration: 0.2 }}
            >
              {!isCorner && tile.color && (
                <div
                  className={`h-3 w-full border-b border-white/20 ${hasMonopolyOnTile ? 'border-yellow-400 border-2' : ''}`}
                  style={{ 
                    backgroundColor: tileColor,
                    ...(hasMonopolyOnTile ? {
                      background: `linear-gradient(135deg, ${tileColor} 0%, ${tileColor}80 50%, ${tileColor} 100%)`,
                      boxShadow: 'inset 0 0 10px rgba(255, 255, 0, 0.5)'
                    } : {})
                  }}
                >
                  {hasMonopolyOnTile && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400/30 to-transparent animate-glow-pulse"></div>
                  )}
                </div>
              )}
              
              <div className={`flex-1 flex flex-col items-center text-center px-1 ${isCorner ? '' : 'justify-between py-1'} bg-surface/80`}>
                <span className={`font-bold ${isCorner ? 'text-lg md:text-2xl text-accent-300' : 'text-[9px] md:text-xs leading-tight text-text-main'}`}>
                  {tile.name}
                </span>
                
                {tile.price && (
                  <span className="text-[8px] md:text-[10px] text-text-muted mt-0.5">
                    ₹{tile.price/1000}k
                  </span>
                )}
                
                {/* House/Hotel indicators */}
                {(houses > 0 || hotels > 0) && (
                  <motion.div 
                    className="flex flex-wrap justify-center gap-0.5 mt-1"
                    variants={animations.scaleIn}
                  >
                    {hotels > 0 ? (
                      <div className="relative">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-red-500 rounded-sm border border-white/50 shadow-lg"></div>
                        <div className="absolute inset-0 bg-red-300/50 rounded-sm animate-pulse-soft"></div>
                      </div>
                    ) : (
                      Array.from({ length: Math.min(houses, 4) }).map((_, i) => (
                        <div 
                          key={i}
                          className="w-2 h-2 md:w-2.5 md:h-2.5 bg-green-500 rounded-sm border border-white/50 shadow"
                        ></div>
                      ))
                    )}
                  </motion.div>
                )}
                
                {/* Owner indicator */}
                {ownerId && (
                  <motion.div 
                    className="absolute top-1 right-1 w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white/50 shadow-lg z-20"
                    style={{ backgroundColor: game.room.players[ownerId]?.color || THEME.colors.primary[500] }}
                    title={`Owned by ${game.room.players[ownerId]?.name}`}
                    variants={animations.scaleIn}
                    whileHover={{ scale: 1.3 }}
                  ></motion.div>
                )}
                
                {/* Mortgaged indicator */}
                {isMortgaged && (
                  <motion.div 
                    className="absolute top-1 left-1 w-3 h-3 md:w-4 md:h-4 bg-gray-700 rounded-full border border-white/50 shadow-lg z-20"
                    title="Mortgaged"
                    variants={animations.scaleIn}
                  >
                    <div className="absolute inset-1 flex items-center justify-center text-white text-[6px] font-bold">
                      M
                    </div>
                  </motion.div>
                )}
                
                {/* Monopoly crown indicator */}
                {hasMonopolyOnTile && (
                  <motion.div 
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 z-30"
                    variants={animations.float}
                    animate="visible"
                  >
                    <div className="text-yellow-400 text-xs">👑</div>
                  </motion.div>
                )}
              </div>

            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
