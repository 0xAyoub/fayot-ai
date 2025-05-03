import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../utils/supabaseClient';

/**
 * Hook personnalisé pour vérifier l'authentification sur toutes les pages protégées
 * Redirige automatiquement vers /sign-in si non connecté
 * @returns {Object} L'objet utilisateur courant et un booléen indiquant si le chargement est en cours
 */
export const useAuthRedirect = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pages qui ne nécessitent pas d'authentification
    const publicPages = ['/sign-in', '/sign-up'];
    const isPublicPage = publicPages.includes(router.pathname);

    const checkUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        
        if (error || !data.user) {
          // Si on n'est pas sur une page publique, rediriger vers signin
          if (!isPublicPage) {
            router.push('/sign-in');
          }
          setUser(null);
        } else {
          setUser(data.user);
          // Si on est sur une page d'auth mais déjà connecté, rediriger vers l'accueil
          if (isPublicPage) {
            router.push('/');
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'authentification:', error);
        if (!isPublicPage) {
          router.push('/sign-in');
        }
      } finally {
        setLoading(false);
      }
    };

    // Écouter les changements d'état d'authentification
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && isPublicPage) {
          router.push('/');
        }
        if (event === 'SIGNED_OUT' && !isPublicPage) {
          router.push('/sign-in');
        }
        setUser(session?.user || null);
      }
    );

    checkUser();

    // Nettoyer le listener lors du démontage
    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [router]);

  return { user, loading };
}; 