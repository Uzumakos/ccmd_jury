import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trophy, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'JURY'>('JURY');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role,
            }
          }
        });
        if (error) throw error;
        toast.success('Compte créé ! Vous pouvez vous connecter.');
        setIsRegistering(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Connexion réussie');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l’authentification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-2xl text-[#38bdf8] shadow-2xl mb-4 transform -rotate-6">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[#fafafa]">JuryNote</h1>
          <p className="text-[#a1a1aa] mt-2 font-medium">Évaluation de projets académiques</p>
        </div>

        <Card className="bg-[#18181b] border-[#27272a] shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-[#fafafa]">
              {isRegistering ? 'Créer un compte' : 'Bienvenue'}
            </CardTitle>
            <CardDescription className="text-[#71717a]">
              {isRegistering 
                ? 'Rejoignez la plateforme d’évaluation.' 
                : 'Connectez-vous pour accéder à votre espace de notation.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleAuth}>
            <CardContent className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#a1a1aa] ml-1">Nom complet</label>
                    <Input 
                      placeholder="Jean Dupont"
                      className="bg-[#09090b] border-[#27272a] text-[#fafafa] h-11 focus:ring-primary"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[#a1a1aa] ml-1">Rôle</label>
                    <select 
                      className="w-full bg-[#09090b] border border-[#27272a] text-[#fafafa] h-11 rounded-md px-3 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'ADMIN' | 'JURY')}
                    >
                      <option value="JURY">Jury</option>
                      <option value="ADMIN">Administrateur</option>
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#a1a1aa] ml-1">Email</label>
                <Input 
                  type="email" 
                  placeholder="votre@email.com"
                  className="bg-[#09090b] border-[#27272a] text-[#fafafa] h-11 focus:ring-primary"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#a1a1aa] ml-1">Mot de passe</label>
                <Input 
                  type="password" 
                  className="bg-[#09090b] border-[#27272a] text-[#fafafa] h-11 focus:ring-primary"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold bg-primary text-[#09090b] hover:bg-primary/90 transition-all rounded-md shadow-[0_0_20px_rgba(56,189,248,0.2)]"
                disabled={loading}
              >
                {loading 
                  ? 'Chargement...' 
                  : (isRegistering ? 'Créer le compte' : 'Se connecter')}
                {isRegistering ? <UserPlus className="ml-2 h-5 w-5" /> : <LogIn className="ml-2 h-5 w-5" />}
              </Button>
              
              <button 
                type="button"
                className="text-sm text-[#38bdf8] hover:underline"
                onClick={() => setIsRegistering(!isRegistering)}
              >
                {isRegistering 
                  ? 'Déjà un compte ? Se connecter' 
                  : 'Pas encore de compte ? S’inscrire'}
              </button>
            </CardFooter>
          </form>
        </Card>
        
        <p className="text-center text-[10px] text-[#52525b] mt-8 uppercase tracking-[0.2em]">
          &copy; 2026 JuryNote — Plateforme d'Évaluation
        </p>
      </div>
    </div>
  );
}
