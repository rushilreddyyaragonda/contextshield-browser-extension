import { ShieldCheck } from 'lucide-react';

const FOOTER_LINKS = [
  {
    title: 'Product',
    links: [
      { label: 'Home', href: '#home' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Live Demo', href: '#demo' },
      { label: 'Features', href: '#features' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Installation', href: '#installation' },
      { label: 'Privacy', href: '#privacy' },
      { label: 'Developer', href: '#developer' },
      { label: 'Download', href: '/downloads/contextshield-chrome.zip' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-[#b8a886] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-6 h-6 text-[#c4952e]" />
              <span className="text-[#f7f4ed] font-bold text-lg font-sans">ContextShield</span>
            </div>
            <p className="text-sm font-sans text-[#8a7e62] leading-relaxed max-w-sm mb-3">
              The internet shows you information. ContextShield shows you what is missing.
            </p>
            <p className="text-xs font-sans text-[#6b6256]">
              A browser extension for investigating online claims, discovering missing context, and evaluating evidence.
            </p>
          </div>

          {/* Links */}
          {FOOTER_LINKS.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-sans font-semibold text-[#c4952e] uppercase tracking-wide mb-3">
                {section.title}
              </h4>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm font-sans text-[#8a7e62] hover:text-[#f7f4ed] transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[#333] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs font-sans text-[#6b6256]">
            ContextShield v1.0.0 · Local processing only · No remote API
          </p>
          <p className="text-xs font-sans text-[#6b6256]">
            Original computer science project by Rushil Reddy Yaragonda
          </p>
        </div>
      </div>
    </footer>
  );
}
