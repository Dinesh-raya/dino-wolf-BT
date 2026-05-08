import { motion } from 'framer-motion';

export const DiceAnim = ({ die1, die2 }: { die1: number, die2: number }) => {
  return (
    <div className="flex gap-4">
      <motion.div 
        key={`die1-${die1}-${Date.now()}`}
        initial={{ rotateX: 180, rotateY: 180, scale: 0.5, opacity: 0 }}
        animate={{ rotateX: 0, rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-black font-bold text-2xl border-2 border-slate-300"
      >
        {die1}
      </motion.div>
      <motion.div 
        key={`die2-${die2}-${Date.now()}`}
        initial={{ rotateX: 180, rotateY: -180, scale: 0.5, opacity: 0 }}
        animate={{ rotateX: 0, rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring', delay: 0.1 }}
        className="w-12 h-12 bg-white rounded-xl shadow-xl flex items-center justify-center text-black font-bold text-2xl border-2 border-slate-300"
      >
        {die2}
      </motion.div>
    </div>
  );
};
