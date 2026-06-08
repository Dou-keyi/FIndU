// GlobePage — interactive 3D globe for discovering opportunities (placeholder)
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { LogOut } from 'lucide-react';

export default function GlobePage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Minimal header with sign out */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100">
            <span className="text-sm font-bold text-brand">C</span>
          </div>
          <span className="font-semibold text-sm">Career OS</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {profile?.full_name || user?.email}
          </span>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1.5" />
            Sign out
          </Button>
        </div>
      </header>

      {/* Placeholder content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <span className="text-3xl">🌍</span>
          </div>
          <h1 className="text-xl font-semibold">Globe View</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            The interactive 3D globe will be built in Phase 2. 
            You're logged in as <strong>{profile?.role || 'user'}</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
