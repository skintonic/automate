import React from 'react';
import { 
  ShieldCheck, 
  Mail, 
  AlertTriangle, 
  Sparkles, 
  User, 
  ExternalLink, 
  LogOut, 
  CheckCircle2, 
  Lock,
  UserCheck,
  LayoutDashboard,
  Send,
  BarChart3
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface NavbarProps {
  user: FirebaseUser | null;
  hasGmailToken: boolean;
  isLoggingIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onOpenBrandModal: () => void;
  draftsCount: number;
  activeView: 'workspace' | 'boss-portal' | 'engagement';
  onViewChange: (view: 'workspace' | 'boss-portal' | 'engagement') => void;
  pendingBossCount: number;
  sentPitchesCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  hasGmailToken,
  isLoggingIn,
  onLogin,
  onLogout,
  onOpenBrandModal,
  draftsCount,
  activeView,
  onViewChange,
  pendingBossCount,
  sentPitchesCount = 0,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center shadow-inner shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-sm sm:text-base md:text-lg tracking-tight text-white truncate">
                  HARO & Connectively Pitch Assistant
                </h1>
                <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  Executive Approval & Auto-Send
                </span>
              </div>
              <p className="hidden sm:block text-xs text-slate-400">
                PR & SEO Manager for 3 Medical Brands: <span className="text-emerald-400 font-medium">Performance P-Wave</span> • <span className="text-rose-400 font-medium">Skin & Tonic</span> • <span className="text-blue-400 font-medium">Dr. Croley's</span>
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Workspace vs Boss Portal vs Engagement Metrics) */}
          <div className="hidden md:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-workspace-tab"
              onClick={() => onViewChange('workspace')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeView === 'workspace'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>PR Workspace</span>
            </button>

            <button
              id="nav-boss-tab"
              onClick={() => onViewChange('boss-portal')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-2 ${
                activeView === 'boss-portal'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>👔 Executive Approval</span>
              {pendingBossCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 animate-pulse">
                  {pendingBossCount}
                </span>
              )}
            </button>

            <button
              id="nav-engagement-tab"
              onClick={() => onViewChange('engagement')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
                activeView === 'engagement'
                  ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Engagement Metrics</span>
              {sentPitchesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-purple-900 text-purple-200">
                  {sentPitchesCount}
                </span>
              )}
            </button>
          </div>

          {/* Right Controls: Brands Guide & Google Auth */}
          <div className="flex items-center space-x-2.5">
            {/* Mobile View Switcher */}
            <div className="flex md:hidden items-center space-x-1">
              <button
                onClick={() => {
                  if (activeView === 'workspace') onViewChange('boss-portal');
                  else if (activeView === 'boss-portal') onViewChange('engagement');
                  else onViewChange('workspace');
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 flex items-center space-x-1"
              >
                {activeView === 'workspace' ? (
                  <>
                    <UserCheck className="w-3 h-3 text-emerald-400" />
                    <span>Boss ({pendingBossCount})</span>
                  </>
                ) : activeView === 'boss-portal' ? (
                  <>
                    <BarChart3 className="w-3 h-3 text-purple-400" />
                    <span>Metrics</span>
                  </>
                ) : (
                  <>
                    <LayoutDashboard className="w-3 h-3 text-indigo-400" />
                    <span>Workspace</span>
                  </>
                )}
              </button>
            </div>

            <button
              id="view-brands-btn"
              onClick={onOpenBrandModal}
              className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition items-center space-x-1.5"
            >
              <span>Brand Guidelines</span>
            </button>

            {/* Google Authentication */}
            {user && hasGmailToken ? (
              <div className="flex items-center space-x-2 bg-slate-800/80 border border-slate-700 rounded-lg px-2.5 py-1 text-xs">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    user.email?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-slate-200 font-medium truncate max-w-[120px]">
                    {user.email}
                  </div>
                  <div className="text-[10px] text-emerald-400 flex items-center">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1" />
                    Gmail Connected
                  </div>
                </div>
                <button
                  id="signout-btn"
                  onClick={onLogout}
                  title="Disconnect Gmail"
                  className="p-1 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-700"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="google-signin-btn"
                onClick={onLogin}
                disabled={isLoggingIn}
                className="gsi-material-button text-xs py-1 px-2.5 flex items-center bg-white hover:bg-slate-100 text-slate-800 rounded-lg font-medium shadow-sm transition border border-slate-200"
              >
                <div className="w-4 h-4 mr-1.5 shrink-0">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-full h-full">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                </div>
                <span>{isLoggingIn ? 'Connecting...' : 'Connect Gmail'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
