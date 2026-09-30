import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import { Home, ArrowLeft, Layers } from 'lucide-react';

export const NotFoundPage = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-brand-600 dark:bg-brand-500 text-white dark:text-zinc-950 flex items-center justify-center shadow-lg shadow-brand-500/25 mb-6">
        <Layers className="w-6 h-6" />
      </div>

      <span className="text-6xl sm:text-8xl font-extrabold tracking-tight font-mono text-zinc-300 dark:text-zinc-800">
        404
      </span>

      <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white mt-4">
        Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 mb-6">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>

      <div className="flex items-center gap-3">
        <Link to={isAuthenticated ? '/dashboard' : '/login'}>
          <Button variant="primary" size="md" leftIcon={isAuthenticated ? Home : ArrowLeft}>
            {isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
