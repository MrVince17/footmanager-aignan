import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [clubName, setClubName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      // 1. Create a new club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({ name: clubName, primary_color: primaryColor, secondary_color: secondaryColor })
        .select()
        .single();
      if (clubError) throw clubError;
      if (!clubData) throw new Error('Club not created');

      // 2. Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User not created');


      // 3. Link user to the club
      const { error: userError } = await supabase
        .from('users')
        .insert([{ id: authData.user.id, full_name: fullName, club_id: clubData.id }]);

      if (userError) throw userError;

      navigate('/');
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">Créer un compte</h2>
        <form onSubmit={handleSignUp} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom complet</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nom du club</label>
            <input type="text" value={clubName} onChange={(e) => setClubName(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Couleur principale</label>
            <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Couleur secondaire</label>
            <input type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button type="submit" className="w-full py-2 text-white bg-primary rounded-md">Créer mon compte</button>
        </form>
      </div>
    </div>
  );
};
