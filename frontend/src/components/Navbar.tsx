import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Satellite, Plus, LogOut } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const links = [
    { to: '/krishi-saarthi', label: 'Dashboard' },
    { to: '/farms', label: 'Fields' },
    { to: '/doctor', label: 'Crop Doctor' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/90 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-cyan-400" />
            <span className="font-mono font-bold text-sm text-white">
              KRISHI<span className="text-cyan-400"> SAARTHI</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={clsx(
                  'px-3 py-1.5 rounded text-xs font-mono transition-colors',
                  location.pathname.startsWith(link.to)
                    ? 'text-cyan-300 bg-cyan-500/10'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              to="/onboard"
              className="hidden sm:flex px-3 py-1.5 rounded bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-semibold items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Mark Field
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block text-xs text-white/50 font-mono">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleSignOut}
                  className="p-1.5 rounded text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-xs font-mono transition-colors"
              >
                Sign In
              </Link>
            )}

            {/* Mobile menu */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-1.5 rounded text-white/60 hover:text-white"
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-white/10 bg-black">
          <div className="px-4 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'block px-3 py-2 rounded text-sm font-mono',
                  location.pathname.startsWith(link.to)
                    ? 'text-cyan-300 bg-cyan-500/10'
                    : 'text-white/60 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/onboard"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded bg-cyan-500 text-black text-sm font-semibold text-center mt-2"
            >
              Mark Field
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
