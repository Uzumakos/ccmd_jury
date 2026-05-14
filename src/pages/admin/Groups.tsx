import React, { useEffect, useState } from 'react';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Users, FileText, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Group, Member } from '@/types';
import { toast } from 'sonner';

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [newGroupName, setNewGroupName] = useState('');
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [open, setOpen] = useState(false);

  // Members Management State
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Membre');
  const [isAddingMember, setIsAddingMember] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from('ccmd_groups').select('*').order('name');
    if (data) setGroups(data);
    setLoading(false);
  };

  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (groups.length >= 10) { // Extended limit from 2 to 10 for better flexibility if needed, user said 2 in desc but DB allows more
      toast.error('Nombre maximum de groupes atteint.');
      return;
    }

    if (!newGroupName || !newProjectTitle) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setIsAdding(true);
    try {
      let pdfPath = null;

      if (pdfFile) {
        const fileExt = pdfFile.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `groups/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('ccmd_documents')
          .upload(filePath, pdfFile);

        if (uploadError) throw uploadError;
        pdfPath = uploadData.path;
      }

      const { error } = await supabase.from('ccmd_groups').insert([
        {
          name: newGroupName,
          project_title: newProjectTitle,
          description: newProjectDesc,
          pdf_storage_path: pdfPath,
        },
      ]);

      if (error) throw error;

      toast.success('Groupe ajouté avec succès');
      setOpen(false);
      setNewGroupName('');
      setNewProjectTitle('');
      setNewProjectDesc('');
      setPdfFile(null);
      fetchGroups();
    } catch (error: any) {
      console.error('Error adding group:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout du groupe');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce groupe ?')) return;

    try {
      const groupToDelete = groups.find(g => g.id === id);
      const { error } = await supabase.from('ccmd_groups').delete().eq('id', id);
      if (error) throw error;

      // Also delete file from storage if it exists
      if (groupToDelete?.pdf_storage_path) {
        await supabase.storage.from('ccmd_documents').remove([groupToDelete.pdf_storage_path]);
      }

      toast.success('Groupe supprimé');
      fetchGroups();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  const openMembersModal = async (group: Group) => {
    setSelectedGroup(group);
    setIsMembersOpen(true);
    await fetchMembers(group.id);
  };

  const fetchMembers = async (groupId: string) => {
    const { data, error } = await supabase.from('ccmd_members').select('*').eq('group_id', groupId).order('order');
    if (data) setMembers(data);
    else if (error) toast.error('Erreur de chargement des membres');
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newMemberName || !newMemberRole) return;

    setIsAddingMember(true);
    try {
      const { error } = await supabase.from('ccmd_members').insert([
        {
          group_id: selectedGroup.id,
          name: newMemberName,
          role: newMemberRole,
        }
      ]);
      if (error) throw error;
      
      toast.success('Membre ajouté avec succès');
      setNewMemberName('');
      setNewMemberRole('Membre');
      fetchMembers(selectedGroup.id);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'ajout du membre');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!selectedGroup) return;
    if (!confirm('Voulez-vous vraiment retirer ce membre du groupe ?')) return;

    try {
      const { error } = await supabase.from('ccmd_members').delete().eq('id', memberId);
      if (error) throw error;
      toast.success('Membre retiré');
      fetchMembers(selectedGroup.id);
    } catch (error: any) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPdfUrl = (path: string) => {
    return supabase.storage.from('ccmd_documents').getPublicUrl(path).data.publicUrl;
  };

  return (
    <Shell>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gestion des Groupes</h1>
            <p className="text-gray-500 italic">Configurez les 2 groupes participant à la soutenance.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button disabled={groups.length >= 10} className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg hover:bg-primary/90" />
            }>
                <Plus className="mr-2 h-5 w-5" /> Nouveau groupe
            </DialogTrigger>
            <DialogContent className="glass border-white/40">
              <DialogHeader>
                <DialogTitle>Ajouter un groupe</DialogTitle>
                <DialogDescription>Tous les champs sont obligatoires pour la configuration de la notation.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddGroup} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Nom du groupe</label>
                  <Input 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="ex: Groupe A" 
                    className="bg-white/50" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Titre du projet</label>
                  <Input 
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    placeholder="ex: Système de Gestion Immobilière" 
                    className="bg-white/50" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Description rapide</label>
                  <Input 
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    placeholder="Brève description du projet..." 
                    className="bg-white/50" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold">Document PDF (Projet)</label>
                  <Input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                    className="bg-white/50 cursor-pointer" 
                  />
                </div>
                <DialogFooter className="pt-4">
                   <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-xl font-bold">
                     {isAdding ? 'Création en cours...' : 'Créer le groupe'}
                   </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </header>

        <Card className="glass border-none shadow-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-white/20">
                  <TableHead className="font-black text-xs uppercase tracking-widest py-6 px-8">Groupe</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest px-8">Projet</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-center px-8">PDF</TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id} className="border-white/20 hover:bg-white/40 transition-all">
                    <TableCell className="font-black py-5 px-8 text-primary uppercase italic">{group.name}</TableCell>
                    <TableCell className="py-5 px-8 font-medium">{group.project_title}</TableCell>
                    <TableCell className="text-center">
                      {group.pdf_storage_path ? (
                        <a 
                          href={getPdfUrl(group.pdf_storage_path)} 
                          target="_blank" 
                          rel="noreferrer"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors"
                        >
                          <FileText size={18} />
                        </a>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right px-8">
                       <Button 
                        onClick={() => openMembersModal(group)}
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-lg text-blue-500 hover:bg-blue-50 mr-2"
                        title="Gérer les membres"
                      >
                         <Users size={18} />
                       </Button>
                       <Button 
                        onClick={() => handleDeleteGroup(group.id)}
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50"
                        title="Supprimer le groupe"
                      >
                         <Trash2 size={18} />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {groups.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={4} className="py-20 text-center italic text-gray-400">
                        Aucun groupe configuré
                     </TableCell>
                   </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Members Management Dialog */}
      <Dialog open={isMembersOpen} onOpenChange={setIsMembersOpen}>
        <DialogContent className="glass border-white/40 max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gestion des membres: <span className="text-primary uppercase italic">{selectedGroup?.name}</span></DialogTitle>
            <DialogDescription>Ajoutez les membres de ce groupe pour permettre leur notation individuelle.</DialogDescription>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 pt-4">
            {/* List */}
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-gray-400">Membres Actuels ({members.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {members.length === 0 ? (
                  <p className="text-xs italic text-gray-500">Aucun membre dans ce groupe</p>
                ) : (
                  members.map(member => (
                    <div key={member.id} className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-lg">
                      <div>
                        <p className="font-bold text-sm text-white">{member.name}</p>
                        <p className="text-[10px] text-primary/80 uppercase tracking-widest">{member.role}</p>
                      </div>
                      <Button variant="ghost" onClick={() => handleDeleteMember(member.id)} className="h-8 w-8 p-0 text-red-500 hover:bg-red-500/10 hover:text-red-400">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Form */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-xl h-fit">
              <h3 className="font-bold text-sm mb-4">Ajouter un membre</h3>
              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Nom Complet</label>
                  <Input 
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                    placeholder="ex: Jean Dupont"
                    className="bg-black/20 border-white/10 text-white h-10"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400">Rôle (affiché au jury)</label>
                  <Input 
                    value={newMemberRole}
                    onChange={e => setNewMemberRole(e.target.value)}
                    placeholder="ex: Développeur"
                    className="bg-black/20 border-white/10 text-white h-10"
                    required
                  />
                </div>
                <Button type="submit" disabled={isAddingMember} className="w-full h-10 font-bold mt-2">
                  {isAddingMember ? 'Ajout...' : 'Ajouter au groupe'}
                </Button>
              </form>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
}
