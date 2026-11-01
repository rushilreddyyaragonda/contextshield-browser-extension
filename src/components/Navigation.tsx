import { useState, useEffect } from 'react';
import { Menu, X, ShieldCheck, Download } from 'lucide-react';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#demo', label: 'Live Demo' },
  { href: '#features', label: 'Features' },
  { href: '#installation', label: 'Installation' },
  { href: '#privacy', label: 'Privacy' },
  { href: '#developer', label: 'Developer' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#1e3a5f] shadow-lg border-b-2 border-[#c4952e]'
          : 'bg-[#1e3a5f]/95 border-b border-[#c4952e]/30'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="#home" className="flex items-center gap-2 group" aria-label="ContextShield home">
            <ShieldCheck className="w-6 h-6 text-[#c4952e] group-hover:scale-110 transition-transform" />
            <span className="text-[#f7f4ed] font-bold text-lg font-sans tracking-tight">ContextShield</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-sans font-medium text-[#9bb8d4] hover:text-[#f7f4ed] hover:bg-white/10 rounded-md transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/downloads/contextshield-chrome.zip"
              download="contextshield-chrome.zip"
              className="ml-3 flex items-center gap-2 px-4 py-2 bg-[#c4952e] hover:bg-[#d4a542] text-[#1a1a1a] font-sans font-bold text-sm rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-[#f7f4ed]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-[#1e3a5f] border-t border-[#c4952e]/20 animate-slide-in">
            <div className="px-2 py-3 space-y-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block px-3 py-2 text-sm font-sans font-medium text-[#9bb8d4] hover:text-[#f7f4ed] hover:bg-white/10 rounded-md transition-colors"
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/downloads/contextshield-chrome.zip"
                download="contextshield-chrome.zip"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 mt-2 bg-[#c4952e] text-[#1a1a1a] font-sans font-bold text-sm rounded-md"
              >
                <Download className="w-4 h-4" />
                Download Extension
              </a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
