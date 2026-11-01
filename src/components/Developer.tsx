import { Mail, Code, ShieldCheck, GraduationCap, BookOpen, Lightbulb, AlertCircle } from 'lucide-react';

const VISION_POINTS = [
  {
    icon: Lightbulb,
    title: 'Project vision',
    text: 'ContextShield explores how browser technology can help people investigate online information more carefully. The project focuses on transparent analysis, source inspection, and identifying the questions a reader should ask before accepting a claim.',
  },
  {
    icon: Code,
    title: 'Technical approach',
    text: 'A Manifest V3 Chrome extension with a background service worker, content scripts, popup, research workspace, and options page. All analysis uses deterministic JavaScript rules — no machine learning models, no remote API calls, no AI services. The extension and portal share the same analysis logic.',
  },
  {
    icon: ShieldCheck,
    title: 'Privacy principles',
    text: 'Local-first by design. No article text, browsing history, or research notes ever leave the browser. No analytics, no tracking, no account. The Content Security Policy forbids all remote connections. Users can delete all data from Settings.',
  },
  {
    icon: AlertCircle,
    title: 'Known limitations',
    text: 'Rule-based heuristics cannot perfectly classify every statement. Surface-level comparison cannot reliably detect semantic contradictions. The extension does not work on restricted browser-internal pages. It is not a fact-checker and does not determine whether claims are true or false.',
  },
];

export default function Developer() {
  return (
    <section id="developer" className="py-24 bg-white border-y border-[#e8e0cc]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-[#c4952e]/10 rounded-full mb-4">
            <span className="text-xs font-sans font-semibold text-[#8a5a10] tracking-wide uppercase">
              About the Creator
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4 text-balance">
            Developer
          </h2>
        </div>

        {/* Developer card */}
        <div className="bg-[#1e3a5f] rounded-xl p-8 mb-12 text-center">
          <div className="w-20 h-20 bg-[#c4952e] rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="w-10 h-10 text-[#1a1a1a]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#f7f4ed] mb-2">
            Rushil Reddy Yaragonda
          </h3>
          <p className="text-[#9bb8d4] font-sans text-sm mb-1">
            UIA International School of Tokyo, Tokyo
          </p>
          <p className="text-[#9bb8d4] font-sans text-sm mb-4">
            Computer Science
          </p>
          <a
            href="mailto:rushil2626reddy@gmail.com"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#c4952e] hover:bg-[#d4a542] text-[#1a1a1a] font-sans font-bold text-sm rounded-lg transition-colors"
          >
            <Mail className="w-4 h-4" />
            rushil2626reddy@gmail.com
          </a>
        </div>

        {/* Motivation quote */}
        <div className="bg-[#f7f4ed] border-l-4 border-[#c4952e] rounded-r-lg p-6 mb-12">
          <BookOpen className="w-6 h-6 text-[#c4952e] mb-3" />
          <p className="text-lg font-serif italic text-[#1a1a1a] leading-relaxed">
            "ContextShield explores how browser technology can help people investigate online information more carefully. The project focuses on transparent analysis, source inspection, and identifying the questions a reader should ask before accepting a claim."
          </p>
        </div>

        {/* Vision points */}
        <div className="grid md:grid-cols-2 gap-6">
          {VISION_POINTS.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div key={idx} className="bg-[#f7f4ed] border border-[#e8e0cc] rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#c4952e]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-2">
                      {point.title}
                    </h3>
                    <p className="text-sm font-sans text-[#4a4238] leading-relaxed">
                      {point.text}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-sm font-sans text-[#8a7e62] leading-relaxed max-w-2xl mx-auto">
            ContextShield is an original computer science project focused on information transparency and browser technology. It is not a verified fact-checking authority, and the developer does not claim professional cybersecurity credentials.
          </p>
        </div>
      </div>
    </section>
  );
}
