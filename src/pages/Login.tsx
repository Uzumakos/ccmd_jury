import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Trophy, LogIn, UserPlus, Users, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { generateJuryCredentials } from '@/lib/utils';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loginMode, setLoginMode] = useState<'JURY' | 'ADMIN'>('JURY');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering && loginMode === 'ADMIN') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: 'ADMIN',
            }
          }
        });
        if (error) throw error;
        toast.success('Compte admin créé ! Vous pouvez vous connecter.');
        setIsRegistering(false);
      } else {
        let loginEmail = email;
        let loginPassword = password;

        if (loginMode === 'JURY') {
          if (!name.trim()) throw new Error('Veuillez entrer votre nom.');
          const creds = generateJuryCredentials(name);
          loginEmail = creds.email;
          loginPassword = creds.password;
        }

        const { error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: loginPassword,
        });
        if (error) {
           if (loginMode === 'JURY') {
              throw new Error('Jury introuvable. Vérifiez l\'orthographe de votre nom.');
           }
           throw error;
        }
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
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="bg-[#18181b] border border-[#27272a] p-4 rounded-2xl text-[#38bdf8] shadow-2xl mb-4 transform -rotate-6">
            <Trophy className="h-10 w-10" />
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-[#fafafa]">JuryNote</h1>
          <p className="text-[#a1a1aa] mt-2 font-medium">Évaluation de projets académiques</p>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-6">
          <Button 
            type="button"
            variant="outline" 
            className={`h-12 font-bold ${loginMode === 'JURY' ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/50' : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:bg-[#27272a]'}`}
            onClick={() => { setLoginMode('JURY'); setIsRegistering(false); }}
          >
             <Users className="mr-2 h-4 w-4" /> Jury
          </Button>
          <Button 
            type="button"
            variant="outline" 
            className={`h-12 font-bold ${loginMode === 'ADMIN' ? 'bg-primary/10 text-primary border-primary/50' : 'bg-[#18181b] text-[#a1a1aa] border-[#27272a] hover:bg-[#27272a]'}`}
            onClick={() => setLoginMode('ADMIN')}
          >
             <ShieldAlert className="mr-2 h-4 w-4" /> Administrateur
          </Button>
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
              {loginMode === 'JURY' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#a1a1aa] ml-1">Nom complet (identifiant)</label>
                  <Input 
                    placeholder="Jean Dupont"
                    className="bg-[#09090b] border-[#27272a] text-[#fafafa] h-11 focus:ring-[#38bdf8]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <p className="text-[10px] text-[#71717a] ml-1 italic">Entrez votre nom tel qu'enregistré par l'administrateur.</p>
                </div>
              ) : (
                <>
                  {isRegistering && (
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
                </>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className={`w-full h-12 text-lg font-bold transition-all rounded-md shadow-lg ${loginMode === 'JURY' ? 'bg-[#38bdf8] text-[#09090b] hover:bg-[#38bdf8]/90 shadow-[#38bdf8]/20' : 'bg-primary text-[#09090b] hover:bg-primary/90'}`}
                disabled={loading}
              >
                {loading 
                  ? 'Chargement...' 
                  : (isRegistering ? 'Créer le compte' : 'Se connecter')}
                {isRegistering ? <UserPlus className="ml-2 h-5 w-5" /> : <LogIn className="ml-2 h-5 w-5" />}
              </Button>
              
              {loginMode === 'ADMIN' && (
                <button 
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setIsRegistering(!isRegistering)}
                >
                  {isRegistering 
                    ? 'Déjà un compte ? Se connecter' 
                    : 'Pas encore de compte ? S’inscrire'}
                </button>
              )}
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
