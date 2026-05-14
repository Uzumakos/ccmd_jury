import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, ChevronLeft, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Group, Evaluation, FinalVerdict, Profile } from '@/types';

export default function Presentation() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [verdict, setVerdict] = useState<FinalVerdict | null>(null);
  const [jurys, setJurys] = useState<Profile[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [memberPoints, setMemberPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [groupsRes, verdictRes, jurysRes, evalsRes, memberPointsRes] = await Promise.all([
        supabase.from('ccmd_groups').select('*').order('name'),
        supabase.from('ccmd_final_verdict').select('*').maybeSingle(),
        supabase.from('ccmd_profiles').select('*').in('role', ['JURY', 'ADMIN']).order('name'),
        supabase.from('ccmd_evaluations').select('*').eq('submitted', true),
        supabase.from('ccmd_member_points').select('*')
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (verdictRes.data) setVerdict(verdictRes.data);
      if (jurysRes.data) setJurys(jurysRes.data);
      if (evalsRes.data) setEvaluations(evalsRes.data);
      if (memberPointsRes.data) setMemberPoints(memberPointsRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  // Calculate scores per group
  const groupScores = groups.map(group => {
    let totalBase = 0;
    let totalBonus = 0;

    jurys.forEach(jury => {
      const evaluation = evaluations.find(e => e.group_id === group.id && e.jury_id === jury.id);
      if (!evaluation) return;

      const bonus = memberPoints
        .filter(mp => mp.evaluation_id === evaluation.id)
        .reduce((sum, mp) => sum + (mp.points || 0), 0);
      
      const total = evaluation.total_score || 0;
      const base = total - bonus;

      totalBase += base;
      totalBonus += bonus;
    });

    const finalScore = totalBase + totalBonus;

    return {
      group,
      finalScore
    };
  });

  // Sort groups by final score descending
  const rankedGroups = [...groupScores].sort((a, b) => b.finalScore - a.finalScore);
  const winner = rankedGroups.length > 0 ? rankedGroups[0] : null;

  const isPublished = verdict?.status === 'PUBLISHED';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-8 overflow-hidden relative">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/')} 
        className="absolute top-8 left-8 glass rounded-xl text-white hover:text-primary z-50 px-4 py-6 border-white/10"
      >
        <ChevronLeft className="mr-2" /> Retour
      </Button>

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

      <AnimatePresence mode="wait">
        {isPublished && winner ? (
          <motion.div 
            key="published"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: 'spring' }}
            className="text-center space-y-12 relative z-10 w-full max-w-5xl"
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
                animate={{ opacity: 0.8 }}
                transition={{ delay: 0.6 }}
                className="text-2xl font-black uppercase tracking-[0.5em] text-white italic"
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
              <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-none text-white drop-shadow-2xl uppercase break-words">
                {winner.group.name}
              </h1>
              <motion.p 
                 initial={{ scale: 0 }}
                 animate={{ scale: 1 }}
                 transition={{ delay: 2, type: 'spring' }}
                 className="text-4xl font-black text-gray-400 mt-8 tracking-widest italic"
              >
                 SCORE FINAL: <span className="text-white">{winner.finalScore.toFixed(1)}</span>
              </motion.p>
            </motion.div>

            {winner.group.project_title && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3 }}
                className="bg-white/10 glass p-8 rounded-[40px] border border-white/20 shadow-2xl backdrop-blur-2xl max-w-lg mx-auto"
              >
                <h3 className="text-xl font-bold mb-2 text-white">{winner.group.project_title}</h3>
                <p className="text-gray-300 italic text-sm">Félicitations pour cette innovation technique et cet impact majeur sur le secteur.</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center bg-white/5 glass p-16 rounded-[40px] border border-white/10 shadow-2xl backdrop-blur-2xl relative z-10"
          >
             <AlertCircle className="h-20 w-20 text-amber-500 mx-auto mb-8 opacity-80" />
             <h2 className="text-4xl font-bold text-white mb-4">Verdict en attente</h2>
             <p className="text-xl text-gray-400 italic max-w-md mx-auto">
               Les résultats seront dévoilés ici dès que le jury aura publié le verdict final.
             </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
