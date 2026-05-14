import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Play
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Group, Evaluation, Member } from '@/types';
import { motion } from 'motion/react';

export default function JuryDashboard() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [groupsRes, evalsRes] = await Promise.all([
        supabase.from('ccmd_groups').select('*'),
        supabase.from('ccmd_evaluations').select('*').eq('jury_id', user.id)
      ]);

      if (groupsRes.data) setGroups(groupsRes.data);
      if (evalsRes.data) setEvaluations(evalsRes.data);
      setLoading(false);
    }
    fetchData();
  }, []);

  return (
    <Shell>
      <div className="space-y-10">
        <header className="flex flex-col gap-2 max-w-2xl">
          <Badge className="w-fit bg-[#38bdf81a] text-[#38bdf8] border-none uppercase tracking-widest text-[10px] font-bold px-3 py-1">
            Espace Jury
          </Badge>
          <h1 className="text-4xl font-black tracking-tight text-[#fafafa]">Projets à évaluer</h1>
          <p className="text-[#a1a1aa] italic font-medium leading-relaxed">
            Connectez votre expertise aux innovations étudiantes. Évaluez les soutenances ci-dessous. 
            Vos notes sont protégées par le système jusqu'au verdict final.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {groups.map((group, idx) => {
            const eval_ = evaluations.find(e => e.group_id === group.id);
            const isSubmitted = eval_?.submitted;
            const isDraft = eval_ && !eval_.submitted;

            return (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-[#18181b] border-[#27272a] h-full flex flex-col hover:border-[#38bdf8]/50 transition-all duration-300 group relative overflow-hidden shadow-2xl">
                   {/* Abstract decoration */}
                   <div className="absolute -top-12 -right-12 h-48 w-48 bg-gradient-to-br from-[#38bdf80d] to-transparent rounded-full group-hover:scale-110 transition-transform duration-700"></div>
                   
                   <CardHeader className="pb-4 relative">
                      <div className="flex justify-between items-start mb-4">
                        {isSubmitted ? (
                          <div className="flex gap-1.5 items-center px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] uppercase font-bold tracking-wider border border-emerald-500/20">
                            <CheckCircle2 size={12} />
                            Évaluation transmise
                          </div>
                        ) : isDraft ? (
                           <div className="flex gap-1.5 items-center px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-[10px] uppercase font-bold tracking-wider border border-amber-500/20">
                            <Clock size={12} />
                            En cours de rédaction
                          </div>
                        ) : (
                          <div className="px-3 py-1 bg-[#27272a] text-[#a1a1aa] rounded-full text-[10px] uppercase font-bold tracking-wider border border-white/5">
                            Attente de notation
                          </div>
                        )}
                        <span className="text-[10px] font-black text-[#3f3f46] uppercase tracking-[0.3em] font-mono">
                          {group.name}
                        </span>
                      </div>
                      <CardTitle className="text-2xl font-bold group-hover:text-[#38bdf8] transition-colors leading-tight text-[#fafafa]">
                        {group.project_title}
                      </CardTitle>
                      <CardDescription className="line-clamp-2 mt-3 leading-relaxed text-[#71717a] italic">
                        {group.description}
                      </CardDescription>
                   </CardHeader>

                   <CardContent className="flex-1 space-y-8 relative">
                      <div className="grid grid-cols-2 gap-4 py-6 border-y border-[#27272a]">
                         <div className="flex flex-col items-center gap-1">
                            <Users className="h-5 w-5 text-[#3f3f46]" />
                            <span className="text-[10px] font-bold font-mono uppercase text-[#a1a1aa] tracking-widest">6 Membres</span>
                         </div>
                         <div className="flex flex-col items-center gap-1 border-l border-[#27272a]">
                            <FileText className="h-5 w-5 text-[#3f3f46]" />
                            <span className="text-[10px] font-bold font-mono uppercase text-[#a1a1aa] tracking-widest">Documentation</span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                           {[1,2,3,4].map(i => (
                             <div key={i} className="h-8 w-8 rounded-lg bg-[#27272a] border-2 border-[#18181b] flex items-center justify-center text-[10px] font-bold text-[#fafafa] shadow-lg">
                               E{i}
                             </div>
                           ))}
                        </div>
                        <span className="text-[10px] text-[#52525b] font-bold uppercase tracking-widest">Équipe assignée</span>
                      </div>
                   </CardContent>

                   <CardFooter className="pt-4 gap-4 relative">
                      {group.pdf_storage_path ? (
                        <Dialog>
                          <DialogTrigger render={
                            <Button variant="outline" className="flex-1 h-11 border-[#27272a] bg-transparent text-[#a1a1aa] hover:bg-[#27272a] hover:text-[#fafafa] font-bold uppercase text-[10px] tracking-widest transition-all" />
                          }>
                            Dossier PDF
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl sm:max-w-5xl md:max-w-6xl w-[95vw] h-[85vh] flex flex-col bg-[#18181b] border-[#27272a] p-0 overflow-hidden">
                            <DialogHeader className="p-4 border-b border-[#27272a] bg-[#09090b]">
                              <DialogTitle className="text-[#fafafa]">Document: {group.project_title}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 w-full bg-[#27272a]">
                              <iframe 
                                src={supabase.storage.from('ccmd_documents').getPublicUrl(group.pdf_storage_path).data.publicUrl} 
                                className="w-full h-full border-0"
                                title={`PDF ${group.name}`}
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="outline" disabled className="flex-1 h-11 border-[#27272a] bg-transparent text-[#52525b] font-bold uppercase text-[10px] tracking-widest">
                          Aucun PDF
                        </Button>
                      )}
                      <Button 
                        className="flex-1 h-11 bg-primary text-[#09090b] shadow-[0_0_20px_rgba(56,189,248,0.15)] hover:shadow-[0_0_25px_rgba(56,189,248,0.3)] hover:bg-[#38bdf8ee] font-bold uppercase text-[10px] tracking-widest transition-all rounded-md"
                        onClick={() => navigate(`/jury/evaluer/${group.id}`)}
                      >
                         {isSubmitted ? 'Détails' : isDraft ? 'Continuer' : 'Évaluer'}
                         <Play className="ml-2 h-3 w-3 fill-current" />
                      </Button>
                   </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
        
        {groups.length === 0 && !loading && (
           <Card className="bg-[#18181b] p-20 text-center border-[#27272a] border-dashed border-2 rounded-3xl">
              <div className="w-16 h-16 bg-[#27272a] rounded-2xl flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="h-8 w-8 text-[#3f3f46]" />
              </div>
              <h3 className="text-xl font-bold text-[#fafafa]">Aucun projet disponible</h3>
              <p className="text-[#71717a] mt-3 italic max-w-sm mx-auto leading-relaxed">
                Le calendrier des soutenances n'est pas encore programmé par l'administration.
              </p>
           </Card>
        )}
      </div>
    </Shell>
  );
}
