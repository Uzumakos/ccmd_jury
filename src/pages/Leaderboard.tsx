import React, { useEffect, useState } from 'react';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, AlertCircle, Share2, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Group, Evaluation, FinalVerdict } from '@/types';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

export default function Leaderboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [verdict, setVerdict] = useState<FinalVerdict | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [groupsRes, verdictRes] = await Promise.all([
        supabase.from('ccmd_groups').select('*'),
        supabase.from('ccmd_final_verdict').select('*').single()
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (verdictRes.data) setVerdict(verdictRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

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
              <div className="relative glass p-10 rounded-3xl border-none shadow-2xl bg-gradient-to-br from-primary/5 via-white/70 to-emerald-50/30 overflow-hidden group">
                 <div className="absolute top-0 right-0 p-8 opacity-10 transform rotate-12 group-hover:scale-125 transition-transform duration-1000">
                    <Trophy size={200} />
                 </div>
                 
                 <div className="flex flex-col items-center text-center space-y-6 relative z-10">
                    <div className="bg-amber-100 p-4 rounded-full text-amber-600 shadow-xl ring-8 ring-amber-50 animate-bounce">
                       <Trophy className="h-10 w-10 fill-current" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 italic">Le vainqueur est</h2>
                       <h3 className="text-6xl font-black text-gray-900 tracking-tighter">GROUPE B</h3>
                    </div>
                    <div className="inline-flex items-center gap-4 bg-white/60 px-8 py-3 rounded-2xl border border-white/40 backdrop-blur-sm shadow-sm">
                       <div className="text-center">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Score Final</span>
                          <span className="text-2xl font-black text-primary tracking-tighter">257.5</span>
                       </div>
                       <div className="w-px h-8 bg-gray-200"></div>
                       <div className="text-center">
                          <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">Écart</span>
                          <span className="text-2xl font-black text-emerald-500 tracking-tighter">+2.0</span>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Detail Table */}
              <Card className="glass border-none overflow-hidden shadow-2xl">
                 <CardContent className="p-0">
                    <Table>
                       <TableHeader className="bg-gray-50/50">
                          <TableRow className="border-white/20 hover:bg-transparent">
                             <TableHead className="font-black text-xs uppercase tracking-widest py-6 px-8">Critère / Jury</TableHead>
                             <TableHead className="font-black text-xs uppercase tracking-widest text-center px-8">Groupe A</TableHead>
                             <TableHead className="font-black text-xs uppercase tracking-widest text-center px-8">Groupe B</TableHead>
                          </TableRow>
                       </TableHeader>
                       <TableBody>
                          <TableRow className="border-white/20 hover:bg-white/40 transition-colors">
                             <TableCell className="font-bold py-5 px-8">Score Jury 1 (J. Dupont)</TableCell>
                             <TableCell className="text-center font-mono font-bold text-gray-600">82.0</TableCell>
                             <TableCell className="text-center font-mono font-bold text-gray-900">85.5</TableCell>
                          </TableRow>
                          <TableRow className="border-white/20 hover:bg-white/40 transition-colors">
                             <TableCell className="font-bold py-5 px-8">Score Jury 2 (M. Pierre)</TableCell>
                             <TableCell className="text-center font-mono font-bold text-gray-600">79.5</TableCell>
                             <TableCell className="text-center font-mono font-bold text-gray-900">78.0</TableCell>
                          </TableRow>
                          <TableRow className="border-white/20 hover:bg-white/40 transition-colors">
                             <TableCell className="font-bold py-5 px-8">Score Jury 3 (Admin)</TableCell>
                             <TableCell className="text-center font-mono font-bold text-gray-600">81.0</TableCell>
                             <TableCell className="text-center font-mono font-bold text-gray-900">84.0</TableCell>
                          </TableRow>
                          <TableRow className="bg-primary/5 hover:bg-primary/10 transition-colors border-t-2 border-primary/20">
                             <TableCell className="font-black py-8 px-8 text-lg">SCORE TOTAL</TableCell>
                             <TableCell className="text-center">
                                <span className="text-3xl font-black text-gray-400 tracking-tighter">242.5</span>
                             </TableCell>
                             <TableCell className="text-center">
                                <span className="text-4xl font-black text-primary tracking-tighter shadow-primary/10">247.5</span>
                             </TableCell>
                          </TableRow>
                          <TableRow className="bg-emerald-50/50">
                             <TableCell className="font-bold py-5 px-8 text-emerald-600 uppercase tracking-widest text-xs italic">Points Bonus Membres</TableCell>
                             <TableCell className="text-center font-mono font-bold text-emerald-500">+13 pts</TableCell>
                             <TableCell className="text-center font-mono font-bold text-emerald-600">+10 pts</TableCell>
                          </TableRow>
                          <TableRow className="bg-gray-900 text-white rounded-b-3xl">
                             <TableCell className="font-black py-10 px-8 text-2xl uppercase tracking-widest italic">Score Final Consolidé</TableCell>
                             <TableCell className="text-center">
                                <span className="text-5xl font-black text-gray-400 tracking-tighter">255.5</span>
                             </TableCell>
                             <TableCell className="text-center">
                                <div className="relative inline-block">
                                   <div className="absolute -inset-4 bg-primary blur-xl opacity-20 -z-10"></div>
                                   <span className="text-6xl font-black text-white tracking-tighter ring-offset-gray-900">257.5</span>
                                </div>
                             </TableCell>
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
