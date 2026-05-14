import React, { useEffect, useState } from 'react';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Users, FileText, CheckCircle2, Clock, Trophy, AlertTriangle, RotateCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { Group, Evaluation, Profile } from '@/types';
import { toast } from 'sonner';

export default function Dashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [jurys, setJurys] = useState<Profile[]>([]);
  const [membersCount, setMembersCount] = useState(0);
  const [verdict, setVerdict] = useState<any>(null);
  const [memberPoints, setMemberPoints] = useState<any[]>([]);
  const [isResetting, setIsResetting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [groupsRes, evalsRes, jurysRes, membersRes, verdictRes, memberPointsRes] = await Promise.all([
      supabase.from('ccmd_groups').select('*').order('name'),
      supabase.from('ccmd_evaluations').select('*'),
      supabase.from('ccmd_profiles').select('*').in('role', ['JURY', 'ADMIN']),
      supabase.from('ccmd_members').select('id', { count: 'exact' }),
      supabase.from('ccmd_final_verdict').select('*').maybeSingle(),
      supabase.from('ccmd_member_points').select('*')
    ]);

    if (groupsRes.data) setGroups(groupsRes.data);
    if (evalsRes.data) setEvaluations(evalsRes.data);
    if (jurysRes.data) setJurys(jurysRes.data);
    if (membersRes.count !== null) setMembersCount(membersRes.count);
    if (verdictRes.data) setVerdict(verdictRes.data);
    if (memberPointsRes.data) setMemberPoints(memberPointsRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetEvaluations = async () => {
    if (!confirm('ATTENTION : Voulez-vous vraiment supprimer TOUTES les évaluations et réinitialiser le processus ? Cette action est irréversible.')) return;

    setIsResetting(true);
    try {
      // Deleting all evaluations will cascade delete criterion scores and member points
      const { error: evalError } = await supabase.from('ccmd_evaluations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (evalError) throw evalError;

      // Delete the final verdict
      const { error: verdictError } = await supabase.from('ccmd_final_verdict').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (verdictError) throw verdictError;

      toast.success('Toutes les évaluations ont été réinitialisées.');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  const handlePublishVerdict = async () => {
    setIsPublishing(true);
    try {
      const dataToSave = verdict ? { id: verdict.id, status: 'PUBLISHED' } : { status: 'PUBLISHED' };
      const { error } = await supabase.from('ccmd_final_verdict').upsert(dataToSave);
      if (error) throw error;
      toast.success('Verdict publié ! Les résultats sont désormais publics dans la section Présentation.');
      await fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la publication');
    } finally {
      setIsPublishing(false);
    }
  };

  const expectedEvaluations = groups.length * jurys.length;
  const submittedEvaluations = evaluations.filter(e => e.submitted).length;
  const progressPercent = expectedEvaluations > 0 ? (submittedEvaluations / expectedEvaluations) * 100 : 0;

  // Calculate scores per group using the same logic as Leaderboard
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

    return {
      group,
      finalScore: totalBase + totalBonus
    };
  });

  const rankedGroups = [...groupScores].sort((a, b) => b.finalScore - a.finalScore);
  const winner = rankedGroups.length > 0 ? rankedGroups[0] : null;

  let topScoreTitle = "Score Actuel";
  let topScoreValue = "0";

  if (winner) {
    topScoreTitle = `Score ${winner.group.name.substring(0, 15)}`;
    topScoreValue = winner.finalScore.toFixed(1);
  }

  const verdictStatusText = verdict?.status === 'PUBLISHED' ? 'Publié' : 'En attente';

  return (
    <Shell>
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Total Membres" 
            value={membersCount.toString()} 
            icon={Users} 
            color="bg-blue-500"
            delay={0}
          />
          <StatCard 
            title="Évaluations" 
            value={`${submittedEvaluations}/${expectedEvaluations || 0}`} 
            icon={CheckCircle2} 
            color="bg-emerald-500"
            delay={0.1}
          />
          <StatCard 
            title={topScoreTitle} 
            value={topScoreValue} 
            icon={Trophy} 
            color="bg-amber-500"
            delay={0.2}
          />
          <StatCard 
            title="Verdict" 
            value={verdictStatusText} 
            icon={Clock} 
            color="bg-purple-500"
            status
            delay={0.3}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Real-time Status */}
          <Card className="lg:col-span-2 glass border-none overflow-hidden">
            <CardHeader className="border-b border-white/20 pb-4">
              <CardTitle className="flex justify-between items-center text-xl">
                <span>Avancement des évaluations</span>
                <Badge variant="outline" className="bg-white/50 border-white/30 text-xs font-semibold uppercase tracking-wider">
                  En direct
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {groups.map((group, idx) => (
                  <div key={group.id} className="space-y-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <h3 className="font-bold text-lg">{group.name}</h3>
                        <p className="text-sm text-gray-500">{group.project_title}</p>
                      </div>
                      <span className="text-sm font-medium text-primary">
                        {evaluations.filter(e => e.group_id === group.id && e.submitted).length}/{jurys.length} Soumises
                      </span>
                    </div>
                    <Progress value={jurys.length > 0 ? (evaluations.filter(e => e.group_id === group.id && e.submitted).length / jurys.length) * 100 : 0} className="h-2" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                       {jurys.map(jury => {
                         const eval_ = evaluations.find(e => e.jury_id === jury.id && e.group_id === group.id);
                         const isSubmitted = eval_?.submitted;
                         return (
                           <div key={jury.id} className="flex items-center gap-2 bg-white/30 p-3 rounded-xl border border-white/20">
                             {isSubmitted ? (
                               <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                             ) : (
                               <Clock className="h-4 w-4 text-amber-500" />
                             )}
                             <span className="text-xs font-medium truncate">{jury.name}</span>
                           </div>
                         );
                       })}
                    </div>
                  </div>
                ))}

                {groups.length === 0 && (
                   <div className="text-center py-12">
                     <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                     <p className="text-gray-500">Aucun groupe configuré. Veuillez les ajouter dans l'onglet Groupes.</p>
                   </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions / Tips */}
          <div className="space-y-6">
            <Card className="glass border-none bg-primary/10 text-primary-foreground relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Trophy size={120} />
                </div>
                <CardContent className="p-6 flex flex-col gap-4 relative z-10">
                  <h3 className="text-xl font-bold text-primary">Verdict final</h3>
                  <p className="text-sm text-primary/80">
                    Le verdict peut être publié une fois que toutes les évaluations sont soumises.
                  </p>
                  <Button 
                    className="w-full bg-primary text-white hover:bg-primary/90 mt-4 rounded-xl shadow-lg ring-4 ring-primary/10"
                    disabled={expectedEvaluations === 0 || submittedEvaluations < expectedEvaluations || isPublishing || verdictStatusText === 'Publié'}
                    onClick={handlePublishVerdict}
                  >
                     {isPublishing ? 'Publication...' : verdictStatusText === 'Publié' ? 'Déjà publié' : 'Publier le verdict'}
                  </Button>
                </CardContent>
            </Card>

            <Card className="glass border-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-gray-500">Calendrier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-[#27272a] p-4 rounded-2xl flex gap-4 items-center border border-white/5 shadow-md">
                    <div className="flex flex-col items-center justify-center bg-[#fafafa] h-12 w-12 rounded-xl shadow-sm">
                       <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pt-1">MAI</span>
                       <span className="text-lg font-black text-[#09090b] leading-tight">13</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-[#fafafa]">Soutenances Finales</h4>
                      <p className="text-xs text-[#a1a1aa] font-medium">21:00, 13 Novembre, 2026</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-red-500/20 bg-red-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-red-500">Zone de Danger</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleResetEvaluations}
                  disabled={isResetting || evaluations.length === 0}
                  variant="destructive" 
                  className="w-full rounded-xl font-bold bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {isResetting ? 'Réinitialisation...' : 'Remettre à zéro'}
                </Button>
                <p className="text-[10px] text-red-400/70 text-center mt-3 uppercase tracking-widest">Efface tous les scores</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function StatCard({ title, value, icon: Icon, color, status, delay }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <Card className="glass border-none shadow-xl hover:shadow-2xl transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className={cn("p-3 rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110", color)}>
              <Icon className="h-6 w-6" />
            </div>
            {status && (
              <Badge className="bg-emerald-100 text-emerald-600 border-none">Actif</Badge>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-500 italic mb-1">{title}</span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
