import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';

// Assuming we fetch board_config.json or pass it as props
// For now, we'll use a placeholder or import it directly if possible
import boardData from '../../shared/configs/board_config.json';

const getGridPosition = (index: number) => {
  if (index >= 0 && index <= 10) return { gridRow: 11, gridColumn: 11 - index };
  if (index > 10 && index <= 20) return { gridRow: 11 - (index - 10), gridColumn: 1 };
  if (index > 20 && index <= 30) return { gridRow: 1, gridColumn: 1 + (index - 20) };
  if (index > 30 && index < 40) return { gridRow: 1 + (index - 30), gridColumn: 11 };
  return { gridRow: 6, gridColumn: 6 }; // Center fallback
};

export const Board = () => {
  const { game, myId, turn } = useGameStore();

  if (!game) return null;

  return (
    <div className="flex-1 flex items-center justify-center p-2 sm:p-4 md:p-8 overflow-hidden">
      <div 
        className="relative grid bg-slate-900 border-2 border-slate-700 shadow-2xl rounded-xl overflow-hidden neon-glow"
        style={{
          gridTemplateColumns: 'repeat(11, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(11, minmax(0, 1fr))',
          aspectRatio: '1/1',
          width: '100%',
          maxWidth: '900px',
        }}
      >
        {/* Center Area */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none" style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-800 tracking-widest transform -rotate-45">DINO-RICHUP</h1>
            <p className="text-slate-800 text-sm md:text-xl transform -rotate-45 mt-2">PAN-INDIA EDITION</p>
          </div>
        </div>

        {/* Center UI Controls (Interactive) */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4" style={{ gridRow: '4 / 9', gridColumn: '4 / 9' }}>
           {turn?.active_player_id === myId ? (
             <div className="glass-panel p-6 rounded-xl flex flex-col items-center gap-4 animate-pulse">
               <h3 className="text-primary font-bold text-xl">Your Turn!</h3>
               {turn.can_roll && (
                 <button 
                   className="bg-primary text-background font-bold py-3 px-8 rounded-full hover:bg-primary/90 hover:scale-105 transition-transform"
                   onClick={() => useGameStore.getState().rollDice()}
                 >
                   ROLL DICE
                 </button>
               )}
               {turn.can_end_turn && (
                 <button 
                   className="bg-slate-700 text-white font-bold py-3 px-8 rounded-full hover:bg-slate-600 transition-colors"
                   onClick={() => useGameStore.getState().endTurn()}
                 >
                   END TURN
                 </button>
               )}
               {turn.phase === 'buy' && (
                 <div className="flex flex-col gap-2 mt-4 items-center">
                   <p className="text-sm">Do you want to buy this property?</p>
                   <div className="flex gap-4">
                     <button 
                       className="bg-green-500 text-white font-bold py-2 px-6 rounded hover:bg-green-600 transition-colors"
                       onClick={() => {
                         const me = game.room.players[myId!];
                         useGameStore.getState().buyProperty(me.position);
                       }}
                     >
                       Buy
                     </button>
                     <button 
                       className="bg-red-500 text-white font-bold py-2 px-6 rounded hover:bg-red-600 transition-colors"
                       onClick={() => useGameStore.getState().endTurn()}
                     >
                       Pass (Auction)
                     </button>
                   </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="glass-panel p-4 rounded-xl text-slate-400">
               Waiting for {game.room.players[turn?.active_player_id || '']?.name}'s move...
             </div>
           )}
        </div>

        {/* Tiles */}
        {boardData.tiles.map((tile: any) => {
          const pos = getGridPosition(tile.id);
          const isCorner = [0, 10, 20, 30].includes(tile.id);
          
          return (
            <div 
              key={tile.id}
              className={`border border-slate-700/50 flex flex-col ${isCorner ? 'p-2 justify-center items-center' : ''} relative bg-surface`}
              style={{ ...pos }}
            >
              {!isCorner && tile.color && (
                <div 
                  className="h-1/4 w-full border-b border-slate-700/50" 
                  style={{ backgroundColor: `var(--color-board-${tile.color.replace('_', '')}, ${tile.color})` }}
                ></div>
              )}
              
              <div className={`flex-1 flex flex-col items-center text-center px-1 ${isCorner ? '' : 'justify-between py-1'}`}>
                <span className={`font-bold ${isCorner ? 'text-lg md:text-2xl text-accent' : 'text-[8px] md:text-xs leading-tight text-slate-300'}`}>
                  {tile.name}
                </span>
                
                {tile.price && (
                  <span className="text-[8px] md:text-[10px] text-slate-400">
                    ₹{tile.price/1000}k
                  </span>
                )}
              </div>

              {/* Player Tokens (Overlay) */}
              <div className="absolute inset-0 pointer-events-none flex flex-wrap items-end justify-center gap-1 p-1 z-20">
                {Object.values(game.room.players)
                  .filter(p => p.position === tile.id)
                  .map(p => (
                    <motion.div 
                      layoutId={`player-${p.id}`}
                      key={p.id} 
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full border border-white shadow-lg"
                      style={{ backgroundColor: p.color || '#22d3ee' }}
                      title={p.name}
                      initial={false}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
