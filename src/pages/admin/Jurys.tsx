import React, { useEffect, useState, useMemo } from 'react';
import Shell from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Plus, UserPlus, Trash2, Mail, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { toast } from 'sonner';
import { generateJuryCredentials } from '@/lib/utils';

export default function Jurys() {
  const [jurys, setJurys] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'email' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchJurys();
  }, []);

  const fetchJurys = async () => {
    const { data } = await supabase.from('ccmd_profiles').select('*').in('role', ['JURY', 'ADMIN']);
    if (data) setJurys(data);
    setLoading(false);
  };

  const handleAddJury = async (e: React.FormEvent) => {
    e.preventDefault();
    if (jurys.length >= 10) {
      toast.error('Nombre maximum de jurys atteint.');
      return;
    }

    if (!newName.trim()) {
      toast.error('Veuillez renseigner le nom du jury.');
      return;
    }
    
    const { email, password } = generateJuryCredentials(newName);

    setIsAdding(true);
    try {
      const response = await fetch('/api/admin/jurys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email, password })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du jury');
      }

      toast.success('Jury ajouté avec succès');
      setOpen(false);
      setNewName('');
      fetchJurys();
    } catch (error: any) {
      console.error('Error adding jury:', error);
      toast.error(error.message);
    } finally {
      setIsAdding(false);
    }
  };

  const sortedJurys = useMemo(() => {
    return [...jurys].sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'name') {
        valA = a.name || '';
        valB = b.name || '';
      } else if (sortField === 'email') {
        valA = a.email || '';
        valB = b.email || '';
      } else if (sortField === 'status') {
        // For now status is hardcoded as 'Actif', but we can prepare for it
        valA = 'Actif';
        valB = 'Actif';
      }

      const comparison = valA.localeCompare(valB);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [jurys, sortField, sortOrder]);

  const toggleSort = (field: 'name' | 'email' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: 'name' | 'email' | 'status') => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  const handleDeleteJury = async (id: string) => {
    if (!confirm('Voulez-vous vraiment supprimer ce jury ?')) return;

    try {
      const { error } = await supabase.from('ccmd_profiles').delete().eq('id', id);
      if (error) throw error;

      toast.success('Jury supprimé');
      fetchJurys();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Gestion des Jurys</h1>
            <p className="text-gray-500 italic">Consultez et gérez les membres du jury.</p>
          </div>
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={
              <Button disabled={jurys.length >= 10} className="rounded-xl h-11 px-6 font-bold bg-primary shadow-lg hover:bg-primary/90" />
            }>
              <Plus className="mr-2 h-5 w-5" /> Nouveau jury
            </DialogTrigger>
            <DialogContent className="glass border-white/40">
              <DialogHeader>
                <DialogTitle>Ajouter un jury</DialogTitle>
                <DialogDescription>Renseignez les informations pour créer un compte membre du jury.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddJury} className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold">Nom du jury</label>
                  <Input 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="ex: Jean Dupont" 
                    className="bg-white/50" 
                    required
                  />
                  <p className="text-[10px] text-gray-500 italic mt-1">Le jury utilisera uniquement ce nom pour se connecter.</p>
                </div>
                <DialogFooter className="pt-4">
                   <Button type="submit" disabled={isAdding} className="w-full h-12 rounded-xl font-bold">
                     {isAdding ? 'Création en cours...' : 'Créer le compte'}
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
                  <TableHead 
                    onClick={() => toggleSort('name')}
                    className="font-black text-xs uppercase tracking-widest py-6 px-8 cursor-pointer hover:text-primary transition-colors group"
                  >
                    <div className="flex items-center">
                      Nom {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => toggleSort('email')}
                    className="font-black text-xs uppercase tracking-widest px-8 cursor-pointer hover:text-primary transition-colors group"
                  >
                    <div className="flex items-center">
                      Email {getSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead 
                    onClick={() => toggleSort('status')}
                    className="font-black text-xs uppercase tracking-widest text-center px-8 cursor-pointer hover:text-primary transition-colors group"
                  >
                    <div className="flex items-center justify-center">
                      Statut {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead className="font-black text-xs uppercase tracking-widest text-right px-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedJurys.map((jury) => (
                  <TableRow key={jury.id} className="border-white/20 hover:bg-white/40 transition-all">
                    <TableCell className="font-bold py-5 px-8 flex items-center gap-3">
                       <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {jury.name?.charAt(0) || '?'}
                       </div>
                       {jury.name}
                    </TableCell>
                    <TableCell className="py-5 px-8 font-mono text-xs text-gray-500 italic">
                       {jury.email || 'Non renseigné'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-[10px] uppercase tracking-widest">
                         <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                         Actif
                      </div>
                    </TableCell>
                    <TableCell className="text-right px-8">
                       {jury.role !== 'ADMIN' && (
                         <Button 
                          onClick={() => handleDeleteJury(jury.id)}
                          variant="ghost" 
                          className="h-8 w-8 p-0 rounded-lg text-red-500 hover:bg-red-50"
                        >
                           <Trash2 size={18} />
                         </Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
                {jurys.length === 0 && (
                   <TableRow>
                     <TableCell colSpan={4} className="py-20 text-center italic text-gray-400">
                        Aucun jury supplémentaire configuré
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
