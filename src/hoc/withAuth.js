import { useState, useEffect } from 'react';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import { LoadingSpinner } from '../../components/LoadingSpinner';

/**
 * HOC pour protéger les pages qui nécessitent une authentification
 * @param {React.Component} Component - Le composant à protéger
 * @param {Object} options - Options de configuration
 * @returns {React.Component} - Composant protégé
 */
export const withAuth = (Component, options = {}) => {
  const AuthProtected = (props) => {
    const { user, loading } = useAuthRedirect();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      setIsClient(true);
    }, []);

    // Afficher le loader pendant la vérification de l'authentification
    if (loading || !isClient) {
      return <LoadingSpinner />;
    }

    // Passer l'utilisateur au composant enfant
    return <Component {...props} user={user} />;
  };

  // Ne copier que getInitialProps pour éviter les conflits
  if (Component.getInitialProps) {
    AuthProtected.getInitialProps = Component.getInitialProps;
  }
  
  // Ne pas copier getStaticProps et getServerSideProps pour éviter les conflits

  return AuthProtected;
}; 