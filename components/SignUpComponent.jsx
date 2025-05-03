"use client"
import { useState } from 'react';
import { CiSquareChevRight } from "react-icons/ci";
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '../src/utils/supabaseClient'; // Assurez-vous que le chemin est correct
import { useRouter } from 'next/router';
import { NotificationComponent } from './NotificationComponent';
import { GoEyeClosed, GoEye } from "react-icons/go";

export const SignUpComponent = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setNotification(null);
    if (password !== confirmPassword) {
      setNotification({ type: 'error', message: 'Les mots de passe ne correspondent pas.' });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { firstName, lastName }
      }
    });
    if (error) {
      setNotification({ type: 'error', message: error.message });
    } else {
      setNotification({ type: 'success', message: "Inscription réussie ! Redirection vers la page d'accueil..." });
      setTimeout(() => {
        router.push('/');
      }, 1500);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#68ccff]/10 via-[#ebebd7] to-[#68ccff]/10">
      {notification && (
        <NotificationComponent
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-[#68ccff]/30 flex flex-col md:flex-row overflow-hidden">
        {/* Colonne gauche : formulaire */}
        <div className="flex-1 p-8 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-[#106996] mb-2">Créer un compte</h2>
            <p className="text-[#106996]/80 text-base">Rejoins la communauté Fayot et commence à réviser efficacement !</p>
          </div>
          <form className="space-y-6" onSubmit={handleSignUp}>
            <div className="flex gap-3">
              <input
                type="text"
                name="firstname"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-1/2 px-5 py-4 rounded-xl border border-[#68ccff]/30 focus:border-[#25a1e1] focus:ring-2 focus:ring-[#68ccff]/20 text-[#106996] bg-[#f8fafc] placeholder-[#68ccff]/60 shadow-sm transition"
              />
              <input
                type="text"
                name="lastname"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-1/2 px-5 py-4 rounded-xl border border-[#68ccff]/30 focus:border-[#25a1e1] focus:ring-2 focus:ring-[#68ccff]/20 text-[#106996] bg-[#f8fafc] placeholder-[#68ccff]/60 shadow-sm transition"
              />
            </div>
            <div>
              <input
                type="email"
                name="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl border border-[#68ccff]/30 focus:border-[#25a1e1] focus:ring-2 focus:ring-[#68ccff]/20 text-[#106996] bg-[#f8fafc] placeholder-[#68ccff]/60 shadow-sm transition"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl border border-[#68ccff]/30 focus:border-[#25a1e1] focus:ring-2 focus:ring-[#68ccff]/20 text-[#106996] bg-[#f8fafc] placeholder-[#68ccff]/60 shadow-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68ccff] hover:text-[#25a1e1]"
                tabIndex={-1}
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? <GoEyeClosed className="w-5 h-5" /> : <GoEye className="w-5 h-5" />}
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-5 py-4 rounded-xl border border-[#68ccff]/30 focus:border-[#25a1e1] focus:ring-2 focus:ring-[#68ccff]/20 text-[#106996] bg-[#f8fafc] placeholder-[#68ccff]/60 shadow-sm transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#68ccff] hover:text-[#25a1e1]"
                tabIndex={-1}
                aria-label="Afficher ou masquer le mot de passe"
              >
                {showPassword ? <GoEyeClosed className="w-5 h-5" /> : <GoEye className="w-5 h-5" />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#106996] text-[#ebebd7] font-bold py-3 rounded-xl shadow-md hover:bg-[#0d5475] hover:scale-105 transition-all duration-300 border border-[#106996]/70 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>
            <div className="text-center text-[#106996]/80 text-sm">
              Déjà inscrit ?{' '}
              <Link href="/sign-in" className="underline text-[#25a1e1] hover:text-[#106996]">Se connecter</Link>
            </div>
          </form>
        </div>
        {/* Colonne droite : illustration/logo */}
        <div className="hidden md:flex flex-col items-center justify-center bg-[#68ccff]/10 w-1/2 p-8">
          <Image src="/fayotlogo.png" width={120} height={120} alt="Logo Fayot" className="mb-4" />
          <h3 className="text-[#106996] text-xl font-semibold text-center">Le Fayot t'accompagne dans toutes tes révisions !</h3>
        </div>
      </div>
    </div>
  );
};