import React, { useEffect, useState } from 'react';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Plus, Users, FileText, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Group } from '@/types';
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
            <DialogTrigger asChild>
              <Button disabled={groups.length >= 10} className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg hover:bg-primary/90">
                <Plus className="mr-2 h-5 w-5" /> Nouveau groupe
              </Button>
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
                        onClick={() => handleDeleteGroup(group.id)}
                        variant="ghost" 
                        className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50"
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
    </Shell>
  );
}
