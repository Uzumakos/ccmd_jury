import React, { useEffect, useState } from 'react';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, AlertCircle, Share2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Group, Evaluation, FinalVerdict, Profile } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function Leaderboard() {
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

    const juryScores = jurys.map(jury => {
      const evaluation = evaluations.find(e => e.group_id === group.id && e.jury_id === jury.id);
      if (!evaluation) return { juryId: jury.id, base: 0, bonus: 0, total: 0 };

      // Sum member points for this evaluation
      const bonus = memberPoints
        .filter(mp => mp.evaluation_id === evaluation.id)
        .reduce((sum, mp) => sum + (mp.points || 0), 0);
      
      // Calculate base score by subtracting bonus from total_score
      const total = evaluation.total_score || 0;
      const base = total - bonus;

      totalBase += base;
      totalBonus += bonus;

      return { juryId: jury.id, base, bonus, total };
    });

    const finalScore = totalBase + totalBonus;

    return {
      group,
      juryScores,
      totalBase,
      totalBonus,
      finalScore
    };
  });

  // Sort groups by final score descending
  const rankedGroups = [...groupScores].filter(g => g.finalScore > 0).sort((a, b) => b.finalScore - a.finalScore);
  const expectedEvaluations = groups.length * jurys.length;
  const isAllSubmitted = expectedEvaluations > 0 && evaluations.length === expectedEvaluations;

  const winner = (isAllSubmitted && rankedGroups.length > 0) ? rankedGroups[0] : null;
  const runnerUp = (isAllSubmitted && rankedGroups.length > 1) ? rankedGroups[1] : null;
  const scoreGap = winner && runnerUp ? (winner.finalScore - runnerUp.finalScore).toFixed(1) : "0.0";

  // Mock verdict for development preview if not published
  const isPublished = verdict?.status === 'PUBLISHED';
  const showResults = isPublished || true; // Force show for dev preview

  return (
    <Shell>
      <div className="space-y-10 max-w-5xl mx-auto">
        <header className="flex justify-between items-end">
          <div className="space-y-1">
             <Badge className="bg-primary/10 text-primary border-none uppercase tracking-widest text-[10px] mb-2">Résultats</Badge>
             <h1 className="text-4xl font-black tracking-tight">Classement Final</h1>
             <p className="text-gray-500 italic">Scores consolidés des trois jurys.</p>
          </div>
          <div className="flex gap-3">
             <Button variant="outline" className="glass rounded-xl h-11 px-6 font-bold border-white/40">
                <Download className="mr-2 h-4 w-4" /> Export PDF
             </Button>
          </div>
        </header>

        <AnimatePresence>
          {showResults ? (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Winner Banner */}
              {winner && (
                <div className="relative glass p-10 rounded-3xl border-none shadow-2xl bg-gradient-to-br from-primary/5 via-white/70 to-emerald-50/30 overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-1000">
                      <Trophy size={200} />
                   </div>
                   
                   <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                      <div className="bg-amber-100 p-4 rounded-full text-amber-600 shadow-xl ring-8 ring-amber-50 animate-bounce">
                         <Trophy className="h-10 w-10 fill-current" />
                      </div>
                      <div className="space-y-2">
                         <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-600 italic">Le vainqueur est</h2>
                         <h3 className="text-6xl font-black text-gray-900 tracking-tighter uppercase">{winner.group.name}</h3>
                      </div>
                      <div className="inline-flex items-center gap-4 bg-white/60 px-8 py-3 rounded-2xl border border-white/40 backdrop-blur-sm shadow-sm">
                         <div className="text-center">
                            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score Final</span>
                            <span className="text-2xl font-black text-primary tracking-tighter">{winner.finalScore.toFixed(1)}</span>
                         </div>
                         {runnerUp && (
                           <>
                             <div className="w-px h-8 bg-gray-200"></div>
                             <div className="text-center">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Écart</span>
                                <span className="text-2xl font-black text-emerald-500 tracking-tighter">+{scoreGap}</span>
                             </div>
                           </>
                         )}
                      </div>
                   </div>
                </div>
              )}

              {/* Detail Table */}
              <Card className="glass border-none overflow-hidden shadow-2xl">
                 <CardContent className="p-0 overflow-x-auto">
                    <Table>
                       <TableHeader className="bg-gray-50/50">
                          <TableRow className="border-white/20 hover:bg-transparent">
                             <TableHead className="font-black text-xs uppercase tracking-widest py-6 px-8 min-w-[200px]">Critère / Jury</TableHead>
                             {groups.map(group => (
                               <TableHead key={group.id} className="font-black text-xs uppercase tracking-widest text-center px-8 min-w-[150px]">{group.name}</TableHead>
                             ))}
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          {jurys.map((jury, idx) => (
                            <TableRow key={jury.id} className="border-white/20 hover:bg-white/40 transition-colors">
                               <TableCell className="font-bold py-5 px-8">Score Jury {idx + 1} ({jury.name})</TableCell>
                               {groups.map(group => {
                                 const score = groupScores.find(g => g.group.id === group.id)?.juryScores.find(j => j.juryId === jury.id)?.total || 0;
                                 return (
                                   <TableCell key={group.id} className="text-center font-mono font-bold text-gray-600">{score > 0 ? score.toFixed(1) : '-'}</TableCell>
                                 );
                               })}
                            </TableRow>
                          ))}
                          <TableRow className="bg-gray-900 text-white rounded-b-3xl">
                             <TableCell className="font-black py-10 px-8 text-2xl uppercase tracking-widest italic">Score Final Consolidé</TableCell>
                             {groups.map(group => {
                               const finalScore = groupScores.find(g => g.group.id === group.id)?.finalScore || 0;
                               const isWinner = winner && winner.group.id === group.id;
                               return (
                                 <TableCell key={group.id} className="text-center">
                                    <div className="relative inline-block">
                                       {isWinner && <div className="absolute -inset-4 bg-primary blur-xl opacity-20 -z-10"></div>}
                                       <span className={`text-5xl md:text-6xl font-black tracking-tighter ${isWinner ? 'text-white' : 'text-gray-400'}`}>
                                         {finalScore.toFixed(1)}
                                       </span>
                                    </div>
                                 </TableCell>
                               );
                             })}
                          </TableRow>
                       </TableBody>
                    </Table>
                 </CardContent>
              </Card>
            </motion.div>
          ) : (
             <div className="text-center py-20 bg-white/40 rounded-3xl border border-white/20">
                <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-6 opacity-30" />
                <h2 className="text-2xl font-bold text-gray-700">Verdict en attente</h2>
                <p className="text-gray-500 mt-2 italic">Les résultats seront visibles ici dès que le verdict aura été publié par l'administrateur.</p>
             </div>
          )}
        </AnimatePresence>
      </div>
    </Shell>
  );
}
