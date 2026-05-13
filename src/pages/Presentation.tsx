import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Star, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Presentation() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mesh flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')} 
        className="absolute top-8 left-8 glass rounded-xl text-gray-500 hover:text-primary z-50 px-4 py-6"
      >
        <ChevronLeft className="mr-2" /> Retour
      </Button>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, type: 'spring' }}
        className="text-center space-y-12 relative z-10"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center gap-2"
          >
             {[1,2,3,4,5].map(i => <Star key={i} className="h-6 w-6 text-amber-500 fill-current" />)}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.6 }}
            className="text-2xl font-black uppercase tracking-[0.5em] text-gray-400 italic"
          >
            Le vainqueur de la session 2026 est
          </motion.h2>
        </div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1, duration: 1, type: 'spring' }}
          className="relative group"
        >
          <div className="absolute -inset-20 bg-primary blur-[120px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
          <h1 className="text-[12rem] font-black tracking-tighter leading-none text-gray-900 drop-shadow-2xl">
            GROUPE <span className="text-primary">B</span>
          </h1>
          <motion.p 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             transition={{ delay: 2, type: 'spring' }}
             className="text-4xl font-black text-gray-400 mt-8 tracking-widest italic"
          >
             SCORE FINAL: <span className="text-gray-900">257.5</span>
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3 }}
          className="bg-white/40 glass p-8 rounded-[40px] border-none shadow-2xl backdrop-blur-2xl max-w-lg mx-auto"
        >
          <h3 className="text-xl font-bold mb-2">Système de Gestion Immobilière</h3>
          <p className="text-gray-500 italic text-sm">Félicitations pour cette innovation technique et cet impact majeur sur le secteur.</p>
        </motion.div>
      </motion.div>

      {/* Floating trophy decorations */}
      <motion.div 
        animate={{ 
          y: [0, -20, 0],
          rotate: [0, 5, 0]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 right-[15%] h-32 w-32 bg-amber-500/5 rounded-full flex items-center justify-center blur-sm"
      >
        <Trophy className="h-16 w-16 text-amber-500 opacity-20" />
      </motion.div>

      <motion.div 
        animate={{ 
          y: [0, 20, 0],
          rotate: [0, -5, 0]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-1/4 left-[15%] h-32 w-32 bg-primary/5 rounded-full flex items-center justify-center blur-sm"
      >
        <Trophy className="h-16 w-16 text-primary opacity-20" />
      </motion.div>
    </div>
  );
}
