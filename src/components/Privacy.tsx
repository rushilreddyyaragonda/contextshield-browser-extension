import { ShieldCheck, Lock, Cpu, Database, Ban, FileText } from 'lucide-react';

const PRIVACY_POINTS = [
  {
    icon: Cpu,
    title: 'Processed locally',
    text: 'All claim classification, context-gap detection, and comparison analysis runs in your browser using deterministic rules. No article text is sent to any server.',
  },
  {
    icon: Lock,
    title: 'Permissions are minimal',
    text: 'ContextShield requests only activeTab, contextMenus, and storage. No broad host permissions. No access to pages unless you explicitly trigger an action.',
  },
  {
    icon: Database,
    title: 'Stored locally',
    text: 'Inspection history, research notes, and settings are saved in chrome.storage.local. Nothing is uploaded. You can delete all data from the Settings page.',
  },
  {
    icon: Ban,
    title: 'Never transmitted',
    text: 'No third-party analytics, advertising scripts, tracking pixels, or telemetry. No account required. Strict Content Security Policy with no remote connections.',
  },
];

const METHODOLOGY = [
  {
    title: 'Claim classification heuristics',
    text: 'Passages are matched against pattern sets for opinion language ("I think," "should be"), prediction cues ("will," "likely to"), question structure, instruction directives, absolute terms ("everyone," "always"), numerical expressions, and factual references ("according to," "study," "published"). The highest-scoring pattern set determines the classification label.',
  },
  {
    title: 'Context-gap detection rules',
    text: 'Eight rules check for specific patterns: change terms without time references, vague attribution without named sources, percentage changes without baselines, absolute quantifiers, factual claims without source links, causal language with temporal coincidence, comparative terms without comparison groups, and "recent" references with old dates.',
  },
  {
    title: 'Comparison engine',
    text: 'Two passages are normalized and compared for differing numbers, dates, named entities, negation polarity, geographic references, and quantifier scope. Token overlap is calculated to measure wording similarity. The engine identifies structural differences but cannot reliably detect semantic contradictions.',
  },
  {
    title: 'Source inspection',
    text: 'Page metadata (title, author, publication date, canonical URL, description) is extracted from meta tags. Links are collected and classified as internal or external based on domain comparison. Citation-like text patterns are detected. No external HTTP requests are made.',
  },
];

export default function Privacy() {
  return (
    <section id="privacy" className="py-24 bg-[#f7f4ed]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-[#2a6a3a]/10 rounded-full mb-4">
            <span className="text-xs font-sans font-semibold text-[#2a6a3a] tracking-wide uppercase">
              Privacy & Methodology
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4 text-balance">
            What stays on your computer, stays on your computer
          </h2>
          <p className="text-lg text-[#4a4238] font-sans max-w-2xl mx-auto">
            ContextShield is designed with a strict local-first privacy model. Here is exactly what happens, what does not, and how the analysis works.
          </p>
        </div>

        {/* Privacy points */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {PRIVACY_POINTS.map((point, idx) => {
            const Icon = point.icon;
            return (
              <div key={idx} className="bg-white border border-[#e8e0cc] rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#2a6a3a]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#2a6a3a]" />
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

        {/* Permissions table */}
        <div className="bg-white border border-[#e8e0cc] rounded-lg p-6 mb-16">
          <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-4">
            Browser permissions explained
          </h3>
          <div className="space-y-3">
            <div className="flex gap-4 pb-3 border-b border-[#e8e0cc]">
              <span className="font-mono text-sm text-[#1e3a5f] font-semibold flex-shrink-0 w-32">activeTab</span>
              <span className="text-sm font-sans text-[#4a4238]">Access the current tab only when you explicitly click the extension icon or context menu item. No continuous monitoring.</span>
            </div>
            <div className="flex gap-4 pb-3 border-b border-[#e8e0cc]">
              <span className="font-mono text-sm text-[#1e3a5f] font-semibold flex-shrink-0 w-32">contextMenus</span>
              <span className="text-sm font-sans text-[#4a4238]">Add the "Inspect selection with ContextShield" item to the right-click menu. Can be disabled in Settings.</span>
            </div>
            <div className="flex gap-4">
              <span className="font-mono text-sm text-[#1e3a5f] font-semibold flex-shrink-0 w-32">storage</span>
              <span className="text-sm font-sans text-[#4a4238]">Save settings, inspection history, and research notes locally in the browser. Never synced or transmitted.</span>
            </div>
          </div>
        </div>

        {/* Methodology */}
        <div className="bg-white border border-[#e8e0cc] rounded-lg p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <FileText className="w-5 h-5 text-[#1e3a5f]" />
            <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">
              Analysis methodology
            </h3>
          </div>
          <div className="space-y-6">
            {METHODOLOGY.map((item, idx) => (
              <div key={idx} className="border-l-3 border-[#c4952e] pl-4">
                <h4 className="text-base font-serif font-bold text-[#1a1a1a] mb-2">
                  {item.title}
                </h4>
                <p className="text-sm font-sans text-[#4a4238] leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-[#fdf6e8] border border-[#c4952e]/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#8a5a10] flex-shrink-0 mt-0.5" />
              <p className="text-sm font-sans text-[#4a4238] leading-relaxed">
                <strong>Limitations:</strong> Rule-based classification is imperfect. Labels say "Possible factual claim" or "Likely opinion" — not definitive truth assessments. Context-gap detection produces suggestions for investigation, not proof that a statement is false. ContextShield does not work on browser-internal pages (chrome://, about:) or the Chrome Web Store. It does not bypass paywalls, CAPTCHA, or website restrictions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
