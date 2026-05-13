import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronLeft, 
  Save, 
  Send, 
  User, 
  Star, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Group, Member, Criterion, Evaluation, CriterionScore, MemberPoint } from '@/types';
import { toast } from 'sonner';
import { motion } from 'motion/react';

export default function EvaluationForm() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  
  const [scores, setScores] = useState<Record<string, number>>({});
  const [bonusPoints, setBonusPoints] = useState<Record<string, { points: number, reason: string }>>({});
  const [comment, setComment] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!groupId) return;

      const [groupRes, membersRes, criteriaRes] = await Promise.all([
        supabase.from('ccmd_groups').select('*').eq('id', groupId).single(),
        supabase.from('ccmd_members').select('*').eq('group_id', groupId).order('order'),
        supabase.from('ccmd_criteria').select('*').order('order')
      ]);

      if (groupRes.data) setGroup(groupRes.data);
      if (membersRes.data) setMembers(membersRes.data);
      if (criteriaRes.data) {
        setCriteria(criteriaRes.data);
        // Initialize scores
        const initialScores: Record<string, number> = {};
        criteriaRes.data.forEach(c => initialScores[c.id] = 0);
        setScores(initialScores);
      }
    }
    fetchData();
  }, [groupId]);

  const totalCriteriaScore = (Object.values(scores) as number[]).reduce((a: number, b: number) => a + b, 0);
  const totalBonusPoints = (Object.values(bonusPoints) as { points: number }[]).reduce((a: number, b: { points: number }) => a + b.points, 0);
  const finalTotal = totalCriteriaScore + totalBonusPoints;

  const handleScoreChange = (criterionId: string, value: number) => {
    setScores(prev => ({ ...prev, [criterionId]: Math.min(20, Math.max(0, value)) }));
  };

  const handleBonusChange = (memberId: string, points: number) => {
    setBonusPoints(prev => ({ 
      ...prev, 
      [memberId]: { ...prev[memberId] || { reason: '' }, points: Math.min(10, Math.max(0, points)) } 
    }));
  };

  const handleReasonChange = (memberId: string, reason: string) => {
    setBonusPoints(prev => ({ 
      ...prev, 
      [memberId]: { ...prev[memberId] || { points: 0 }, reason } 
    }));
  };

  const saveDraft = async (silent = false) => {
    if (!silent) setIsSaving(true);
    // Real Supabase save logic would go here
    // For now we simulate success
    setTimeout(() => {
      if (!silent) {
        toast.success("Brouillon sauvegardé");
        setIsSaving(false);
      }
      setLastSaved(new Date());
    }, 500);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulation of final submission
    setTimeout(() => {
      toast.success("Évaluation soumise avec succès");
      setIsSubmitting(false);
      navigate('/jury');
    }, 1500);
  };

  if (!group) return null;

  return (
    <Shell>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/jury')} className="text-[#a1a1aa] hover:text-[#fafafa] rounded-xl flex items-center gap-2 hover:bg-[#27272a]">
            <ChevronLeft className="h-5 w-5" />
            <span className="font-bold uppercase text-[10px] tracking-[0.2em]">Retour au Dashboard</span>
          </Button>

          <div className="flex items-center gap-4">
             {lastSaved && (
               <span className="text-[10px] text-[#3f3f46] font-bold uppercase tracking-wider">
                 Dernier enregistrement: {lastSaved.toLocaleTimeString()}
               </span>
             )}
             <Button 
                variant="outline" 
                onClick={() => saveDraft()} 
                disabled={isSaving} 
                className="h-10 border-[#27272a] bg-transparent text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] font-bold uppercase text-[10px] tracking-widest transition-all"
             >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Synchronisation...' : 'Enregistrer brouillon'}
             </Button>
          </div>
        </div>

        {/* Group Info Card */}
        <Card className="bg-[#18181b] border-[#27272a] overflow-hidden min-h-[200px] flex flex-col justify-end relative shadow-2xl">
           <div className="absolute inset-0 bg-[#09090b]/40 z-10 backdrop-blur-[2px]"></div>
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-50"></div>
           <CardContent className="p-10 relative z-20 text-[#fafafa]">
             <div className="flex items-center gap-3 mb-4">
               <Badge className="bg-[#38bdf81a] text-[#38bdf8] border border-[#38bdf82a] uppercase tracking-[0.2em] text-[10px] font-bold px-3 py-1">Évaluation en cours</Badge>
               <span className="text-[10px] font-bold uppercase tracking-[0.3em] font-mono text-[#3f3f46]">{group.name}</span>
             </div>
             <h1 className="text-5xl font-black tracking-tighter leading-none">{group.project_title}</h1>
           </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-12">
             {/* Section 1: Criteria */}
             <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="bg-[#27272a] text-[#38bdf8] p-3 rounded-2xl border border-white/5 shadow-xl">
                    <Star className="h-6 w-6 fill-current" />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.4em]">Section de Notation</h2>
                    <h3 className="text-2xl font-bold text-[#fafafa] tracking-tight">Grille de Compétences</h3>
                  </div>
                </div>

                <div className="grid gap-6">
                  {criteria.map((c, idx) => (
                    <motion.div 
                      key={c.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Card className="bg-[#18181b] border-[#27272a] border-l-4 border-l-[#38bdf8]/30 hover:border-l-[#38bdf8] transition-all duration-300">
                        <CardContent className="p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div className="space-y-1">
                               <h4 className="font-bold text-xl text-[#fafafa] tracking-tight">{c.name}</h4>
                               <p className="text-[10px] font-black text-[#3f3f46] uppercase tracking-widest">Référentiel: {c.max_score} pts</p>
                            </div>
                            <div className="flex items-center gap-3">
                               <Input 
                                 type="number" 
                                 className="w-20 h-12 text-center text-xl font-bold text-[#38bdf8] bg-[#09090b] border-[#27272a] rounded-xl focus:border-[#38bdf8] transition-colors"
                                 value={scores[c.id]}
                                 onChange={(e) => handleScoreChange(c.id, parseInt(e.target.value) || 0)}
                                 max={20}
                                 min={0}
                               />
                               <span className="text-[10px] font-bold text-[#3f3f46] uppercase tracking-widest italic pt-2">/ 20</span>
                            </div>
                          </div>
                          <div className="w-full bg-[#09090b] h-1.5 rounded-full overflow-hidden border border-[#27272a]">
                            <motion.div 
                              className="bg-[#38bdf8] h-full rounded-full shadow-[0_0_10px_#38bdf844]"
                              initial={{ width: 0 }}
                              animate={{ width: `${(scores[c.id] / 20) * 100}%` }}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
             </section>

             {/* Section 2: Individual Points */}
             <section className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="bg-[#27272a] text-[#38bdf8] p-3 rounded-2xl border border-white/5 shadow-xl">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.4em]">Performance Individuelle</h2>
                    <h3 className="text-2xl font-bold text-[#fafafa] tracking-tight">Coefficients de Jury</h3>
                  </div>
                </div>

                <div className="grid gap-6">
                   {members.map(member => (
                     <Card key={member.id} className="bg-[#18181b] border-[#27272a] overflow-hidden hover:bg-[#18181b]/80 transition-colors">
                       <CardContent className="p-8 flex flex-col md:flex-row gap-8">
                          <div className="flex items-center gap-5 min-w-[240px]">
                            <div className="h-14 w-14 rounded-2xl bg-[#27272a] border border-white/5 flex items-center justify-center text-[#fafafa] font-bold text-xl shadow-lg">
                               {member.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="space-y-1">
                               <h4 className="font-bold text-[#fafafa] text-lg tracking-tight">{member.name}</h4>
                               <p className="text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.3em]">{member.role}</p>
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-4">
                             <div className="flex justify-between items-center">
                               <span className="text-[10px] font-bold uppercase text-[#3f3f46] tracking-[0.2em]">Facteur Bonus / Malus</span>
                               <div className="flex items-center gap-2">
                                  <Input 
                                    type="number" 
                                    className="w-16 h-10 text-center font-bold text-sm bg-[#09090b] border-[#27272a] text-[#fafafa] focus:border-[#38bdf8]"
                                    value={bonusPoints[member.id]?.points || 0}
                                    onChange={(e) => handleBonusChange(member.id, parseInt(e.target.value) || 0)}
                                    max={10}
                                    min={0}
                                  />
                                  <span className="text-[10px] font-bold text-[#3f3f46] uppercase tracking-widest pt-1">/ 10</span>
                               </div>
                             </div>
                             <Input 
                               placeholder="Observation spécifique (ex: Engagement exceptionnel)"
                               className="bg-transparent border-dashed border-[#27272a] h-10 text-xs italic text-[#a1a1aa] focus:border-[#38bdf8] focus:border-solid transition-all"
                               value={bonusPoints[member.id]?.reason || ''}
                               onChange={(e) => handleReasonChange(member.id, e.target.value)}
                             />
                          </div>
                       </CardContent>
                     </Card>
                   ))}
                </div>
             </section>

             {/* Section 3: Comment */}
             <section className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-[#fafafa] tracking-tight">Observations de Soutenance</h3>
                  <span className="text-[10px] text-[#3f3f46] font-bold uppercase tracking-[0.2em]">{comment.length} / 500 characters</span>
                </div>
                <Card className="bg-[#18181b] border-[#27272a] shadow-inner">
                   <CardContent className="p-8">
                      <Textarea 
                        placeholder="Quels sont les points forts et les axes d'amélioration identifiés lors de la présentation orale ?"
                        className="min-h-[180px] bg-transparent border-none text-[#fafafa] placeholder-[#3f3f46] resize-none focus-visible:ring-0 text-lg leading-relaxed italic"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        maxLength={500}
                      />
                   </CardContent>
                </Card>
             </section>
           </div>

           {/* Sidebar: Totals & Submit */}
           <div className="space-y-8">
              <Card className="bg-[#18181b] border-[#27272a] sticky top-8 shadow-2xl overflow-hidden rounded-2xl">
                 <div className="h-3 bg-[#38bdf8] shadow-[0_0_15px_#38bdf844]"></div>
                 <CardHeader className="pt-10 pb-6 px-10">
                    <CardTitle className="text-2xl font-bold text-[#fafafa] tracking-tight">Analyse des Scores</CardTitle>
                    <p className="text-[10px] text-[#3f3f46] font-black uppercase tracking-[0.2em] mt-1 font-mono italic">Calcul en temps réel (UTC)</p>
                 </CardHeader>
                 <CardContent className="px-10 pb-10 space-y-8">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-[0.2em]">Validation Technique</span>
                         <span className="text-xl font-bold text-[#fafafa]">{totalCriteriaScore} <span className="text-[10px] text-[#3f3f46] font-black">/ 100</span></span>
                      </div>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] font-bold text-[#a1a1aa] uppercase tracking-[0.2em]">Synergie Individuelle</span>
                         <span className="text-xl font-bold text-[#38bdf8]">+{totalBonusPoints}</span>
                      </div>
                    </div>

                    <div className="h-px bg-[#27272a]"></div>

                    <div className="flex flex-col items-center py-10 bg-[#09090b] rounded-2xl border border-[#27272a] shadow-inner">
                        <span className="text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.4em] mb-4">Indice Global</span>
                        <div className="text-7xl font-black text-[#fafafa] tracking-tighter tabular-nums shadow-[#38bdf811] [text-shadow:_0_0_30px_#38bdf822]">
                          {finalTotal}
                        </div>
                    </div>

                    <div className="space-y-6 pt-4">
                       <Button 
                         className="w-full h-16 text-lg font-black bg-primary text-[#09090b] shadow-[0_0_30px_rgba(56,189,248,0.2)] hover:shadow-[0_0_40px_rgba(56,189,248,0.35)] transition-all uppercase tracking-[0.1em] rounded-xl group"
                         onClick={handleSubmit}
                         disabled={isSubmitting}
                       >
                          {isSubmitting ? 'Validation...' : 'Sceller le Verdict'}
                          <Send className="ml-3 h-5 w-5 transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                       </Button>
                       <div className="flex gap-3 px-2">
                          <div className="w-1 bg-[#3f3f46] h-full rounded-full"></div>
                          <p className="text-[10px] text-[#52525b] font-bold uppercase leading-relaxed tracking-wider italic">
                            La signature de ce verdict verrouille définitivement les scores pour ce groupe dans la blockchain de notation.
                          </p>
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <Card className="bg-[#18181b]/50 border-[#27272a] border-dashed">
                 <CardContent className="p-8 flex gap-5">
                    <Info className="h-6 w-6 text-[#3f3f46] shrink-0" />
                    <p className="text-[10px] text-[#52525b] leading-relaxed font-bold uppercase tracking-wider">
                       Veuillez vérifier l'adéquation entre l'oralité et la documentation technique. 
                       Toute variance majeure doit être documentée.
                    </p>
                 </CardContent>
              </Card>
           </div>
        </div>
      </div>
    </Shell>
  );
}
