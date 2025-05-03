"use client"
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { supabase } from '../src/utils/supabaseClient'; // Assurez-vous que le chemin est correct
import { NotificationComponent } from './NotificationComponent';
import { GoEyeClosed, GoEye } from "react-icons/go";

export const SignInComponent = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setNotification(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    });
    if (error) {
      setNotification({ type: 'error', message: error.message });
    } else {
      setNotification({ type: 'success', message: 'Connexion réussie ! Redirection...' });
      setTimeout(() => {
        router.push('/');
      }, 1200);
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
            <h2 className="text-3xl font-bold text-[#106996] mb-2">Connexion</h2>
            <p className="text-[#106996]/80 text-base">Ravi de te revoir ! Connecte-toi pour accéder à tes cours, QCM et mémo cartes.</p>
          </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Adresse e-mail"
                required
                className="w-full px-5 py-4 rounded-xl border border-[#68ccff]/30 focus:border-[#25a1e1] focus:ring-2 focus:ring-[#68ccff]/20 text-[#106996] bg-[#f8fafc] placeholder-[#68ccff]/60 shadow-sm transition"
              />
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Mot de passe"
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <div className="text-center text-[#106996]/80 text-sm">
              Pas encore de compte ?{' '}
              <Link href="/sign-up" className="underline text-[#25a1e1] hover:text-[#106996]">Créer un compte</Link>
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
}