import React from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { AdminLoginPage } from '../pages/admin/Login.tsx';
import { BrandLogo } from './ui/BrandLogo.tsx';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
  onBackToStore: () => void;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({
  children,
  onBackToStore,
}) => {
  const { canAccessAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F0] flex flex-col items-center justify-center text-[#3B2314]">
        <div className="flex flex-col items-center gap-5">
          <BrandLogo variant="monogram" size="md" color="#3B2314" />
          <div className="flex items-center gap-2 text-xs font-serif uppercase tracking-[0.2em] text-[#3B2314]">
            <Loader2 className="w-4 h-4 animate-spin text-[#9E5A38]" />
            <span>Verifying Atelier Staff Privileges...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin) {
    return <AdminLoginPage onSuccess={() => {}} onBackToStore={onBackToStore} />;
  }

  return <>{children}</>;
};
