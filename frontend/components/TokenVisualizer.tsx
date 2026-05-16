import { motion } from 'framer-motion';
import { animations } from '../animations';
import { THEME } from '../constants/theme';
import { useTokenMovement, createMovementParticles } from '../utils/tokenMovement';
import { useState, useEffect } from 'react';

interface Player {
  id: string;
  name: string;
  color: string;
  position: number;
  money: number;
}

interface TokenVisualizerProps {
  players: Player[];
  currentPlayerId?: string;
  isMoving?: boolean;
  onMoveComplete?: () => void;
  boardSize?: { width: number; height: number };
}

export const TokenVisualizer = ({
  players,
  currentPlayerId,
  isMoving = false,
  onMoveComplete,
  boardSize = { width: 800, height: 800 }
}: TokenVisualizerProps) => {
  const { bounceAnimation, jailBounceAnimation, moneyChangeAnimation } = useTokenMovement();
  const [particles, setParticles] = useState<any[]>([]);
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);
  const [moneyChanges, setMoneyChanges] = useState<Array<{ playerId: string; amount: number; id: string }>>([]);

  // Calculate grid positions for all players
  const getPlayerGridPosition = (tileId: number) => {
    if (tileId >= 0 && tileId <= 10) return { gridRow: 11, gridColumn: 11 - tileId };
    if (tileId > 10 && tileId <= 20) return { gridRow: 11 - (tileId - 10), gridColumn: 1 };
    if (tileId > 20 && tileId <= 30) return { gridRow: 1, gridColumn: 1 + (tileId - 20) };
    if (tileId > 30 && tileId < 40) return { gridRow: 1 + (tileId - 30), gridColumn: 11 };
    return { gridRow: 6, gridColumn: 6 };
  };

  // Convert grid position to pixel coordinates
  const gridToPixel = (gridPos: { gridRow: number; gridColumn: number }) => {
    const cellWidth = boardSize.width / 11;
    const cellHeight = boardSize.height / 11;
    
    return {
      x: (gridPos.gridColumn - 1) * cellWidth + cellWidth / 2,
      y: (gridPos.gridRow - 1) * cellHeight + cellHeight / 2
    };
  };

  // Create particle effect for player movement
  const createPlayerParticles = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return;

    const gridPos = getPlayerGridPosition(player.position);
    const pixelPos = gridToPixel(gridPos);
    
    const newParticles = createMovementParticles(pixelPos, pixelPos, 12);
    setParticles(prev => [...prev, ...newParticles.map(p => ({ ...p, playerId }))]);
    
    // Remove particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
    }, 1000);
  };

  // Show money change animation
  const showMoneyChange = (playerId: string, amount: number) => {
    const id = `money-${Date.now()}-${Math.random()}`;
    setMoneyChanges(prev => [...prev, { playerId, amount, id }]);
    
    setTimeout(() => {
      setMoneyChanges(prev => prev.filter(m => m.id !== id));
    }, 2000);
  };

  // Highlight current player
  useEffect(() => {
    if (currentPlayerId) {
      setHighlightedPlayer(currentPlayerId);
      createPlayerParticles(currentPlayerId);
    }
  }, [currentPlayerId]);

  // Handle movement animation
  useEffect(() => {
    if (isMoving && currentPlayerId) {
      const timer = setTimeout(() => {
        if (onMoveComplete) onMoveComplete();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isMoving, currentPlayerId, onMoveComplete]);

  // Get player offset for multiple players on same tile
  const getPlayerOffset = (playerIndex: number, totalOnTile: number) => {
    if (totalOnTile <= 1) return { x: 0, y: 0 };
    
    const radius = 15;
    const angle = (playerIndex / totalOnTile) * Math.PI * 2;
    
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius
    };
  };

  // Group players by position
  const playersByPosition = players.reduce((acc, player) => {
    if (!acc[player.position]) {
      acc[player.position] = [];
    }
    acc[player.position].push(player);
    return acc;
  }, {} as Record<number, Player[]>);

  return (
    <>
      {/* Particle effects */}
      {particles.map(particle => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full z-50 pointer-events-none"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            boxShadow: `0 0 8px ${particle.color}`
          }}
          initial={{ opacity: 1, scale: 1 }}
          animate={{
            opacity: 0,
            scale: 0,
            x: particle.x + (Math.random() - 0.5) * 40,
            y: particle.y + (Math.random() - 0.5) * 40
          }}
          transition={{ duration: particle.duration }}
        />
      ))}

      {/* Money change animations */}
      {moneyChanges.map(moneyChange => {
        const player = players.find(p => p.id === moneyChange.playerId);
        if (!player) return null;
        
        const gridPos = getPlayerGridPosition(player.position);
        const pixelPos = gridToPixel(gridPos);
        
        return (
          <motion.div
            key={moneyChange.id}
            className="absolute z-50 pointer-events-none font-bold text-lg"
            style={{
              left: `${pixelPos.x}px`,
              top: `${pixelPos.y - 40}px`,
              color: moneyChange.amount > 0 ? THEME.colors.success[400] : THEME.colors.danger[400],
              textShadow: '0 0 10px currentColor'
            }}
            initial={{ y: 0, opacity: 1, scale: 0.5 }}
            animate={{ y: -60, opacity: 0, scale: 1.2 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {moneyChange.amount > 0 ? '+' : ''}{moneyChange.amount / 1000}k
          </motion.div>
        );
      })}

      {/* Player tokens */}
      {Object.entries(playersByPosition).map(([position, playersOnTile]) => {
        const gridPos = getPlayerGridPosition(parseInt(position));
        const pixelPos = gridToPixel(gridPos);
        
        return (
          <div key={position} className="absolute z-40" style={{ left: `${pixelPos.x}px`, top: `${pixelPos.y}px` }}>
            {playersOnTile.map((player, index) => {
              const offset = getPlayerOffset(index, playersOnTile.length);
              const isCurrent = player.id === currentPlayerId;
              const isHighlighted = player.id === highlightedPlayer;
              
              return (
                <motion.div
                  key={player.id}
                  className="absolute rounded-full border-2 border-white shadow-xl group cursor-pointer"
                  style={{
                    left: `${offset.x}px`,
                    top: `${offset.y}px`,
                    width: isCurrent ? '28px' : '24px',
                    height: isCurrent ? '28px' : '24px',
                    backgroundColor: player.color,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isCurrent ? 50 : 40
                  }}
                  layoutId={`player-${player.id}`}
                  initial={false}
                  animate={isMoving && isCurrent ? bounceAnimation() : {}}
                  whileHover={{ scale: 1.3, zIndex: 60 }}
                  whileTap={{ scale: 0.9 }}
                  onHoverStart={() => setHighlightedPlayer(player.id)}
                  onHoverEnd={() => setHighlightedPlayer(null)}
                >
                  {/* Player indicator dot */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-white/90 rounded-full"></div>
                  </div>
                  
                  {/* Glow effect for current/highlighted player */}
                  {(isCurrent || isHighlighted) && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/50"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Player info tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <motion.div
                      className="glass-panel px-3 py-2 rounded-lg whitespace-nowrap text-sm"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="font-bold text-text-main">{player.name}</div>
                      <div className="text-text-muted text-xs">₹{player.money / 1000}k</div>
                      <div className="text-text-muted text-xs">Tile {player.position}</div>
                    </motion.div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-surface/90"></div>
                  </div>
                  
                  {/* Jail animation */}
                  {player.position === 10 && ( // Jail position
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-danger-500 rounded-full border border-white"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  {/* Go animation (when passing or landing on Go) */}
                  {player.position === 0 && (
                    <motion.div
                      className="absolute -top-1 -right-1 w-3 h-3 bg-success-500 rounded-full border border-white"
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        );
      })}

      {/* Movement trail effect for current player */}
      {currentPlayerId && isMoving && (
        <motion.div
          className="absolute w-2 h-2 bg-primary-400 rounded-full z-30"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 20px 10px rgba(0, 200, 255, 0.3)'
          }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.8, 0, 0.8]
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}

      {/* Dice roll visualization */}
      <div className="absolute bottom-4 right-4 z-50">
        {isMoving && (
          <motion.div
            className="glass-panel p-3 rounded-xl"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-text-muted text-sm">Moving...</span>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
};

// Export helper functions
export { useTokenMovement, createMovementParticles };