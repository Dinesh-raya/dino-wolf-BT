import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../stores/gameStore';

// Assuming auction state is added to gameStore
// We will mock the shape based on our backend schema
export const AuctionModal = () => {
  // @ts-ignore
  const { auction, myId, placeBid } = useGameStore();
  const [bidAmount, setBidAmount] = useState(0);

  useEffect(() => {
    if (auction) {
      setBidAmount(auction.current_bid + 10);
    }
  }, [auction?.current_bid]);

  if (!auction || !auction.active) return null;

  const amIParticipating = auction.participants.includes(myId);

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          className="glass-panel p-8 rounded-2xl w-full max-w-md border-primary/50 border-2 neon-glow"
        >
          <h2 className="text-3xl font-bold text-center text-primary mb-2">AUCTION</h2>
          <p className="text-center text-slate-300 mb-6">Property ID: {auction.property_id}</p>

          <div className="flex justify-between items-center bg-surface p-4 rounded-xl mb-6 border border-slate-700">
            <div>
              <p className="text-sm text-slate-400">Highest Bid</p>
              <p className="text-2xl font-bold text-green-400">₹{auction.current_bid}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-400">Time Left</p>
              <p className="text-2xl font-bold text-accent animate-pulse">{auction.time_remaining}s</p>
            </div>
          </div>

          {amIParticipating ? (
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={bidAmount}
                  onChange={(e) => setBidAmount(Number(e.target.value))}
                  className="flex-1 bg-surface border border-slate-700 rounded p-3 text-slate-100"
                />
                <button 
                  onClick={() => placeBid && placeBid(bidAmount)}
                  className="bg-primary text-background font-bold px-6 py-3 rounded hover:bg-primary/90 transition-colors"
                >
                  BID
                </button>
              </div>
              <div className="flex justify-center gap-2">
                {[100, 500, 1000].map(amt => (
                  <button 
                    key={amt}
                    onClick={() => setBidAmount(auction.current_bid + amt)}
                    className="bg-surface border border-slate-700 text-slate-300 px-3 py-1 rounded hover:bg-slate-800 text-sm"
                  >
                    +{amt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-slate-500 italic">You are not participating in this auction.</p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
