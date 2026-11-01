import { Download, Play } from 'lucide-react';

export default function Hero() {
  return (
    <section id="home" className="pt-16 bg-[#f7f4ed] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: text */}
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1e3a5f]/10 border border-[#1e3a5f]/20 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#2a6a3a] rounded-full"></span>
              <span className="text-xs font-sans font-semibold text-[#1e3a5f] tracking-wide">
                Local processing — No remote API required
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-[#1a1a1a] leading-[1.1] text-balance mb-6">
              Read beyond the headline.
            </h1>

            <p className="text-lg text-[#4a4238] leading-relaxed mb-8 max-w-xl font-sans">
              Online information rarely tells the whole story. ContextShield helps you inspect claims, trace available sources, identify missing context, and understand what still needs verification — all from your browser.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/downloads/contextshield-chrome.zip"
                download="contextshield-chrome.zip"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-[#1e3a5f] hover:bg-[#2a4f7a] text-[#f7f4ed] font-sans font-bold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <Download className="w-5 h-5" />
                Download Extension
              </a>
              <a
                href="#demo"
                className="flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-[#1e3a5f] text-[#1e3a5f] hover:bg-[#1e3a5f] hover:text-[#f7f4ed] font-sans font-bold rounded-lg transition-colors"
              >
                <Play className="w-5 h-5" />
                Explore the Live Demo
              </a>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm font-sans text-[#8a7e62]">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#c4952e] rounded-full"></span>
                Chrome MV3
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#c4952e] rounded-full"></span>
                v1.0.0
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#c4952e] rounded-full"></span>
                No account needed
              </span>
            </div>
          </div>

          {/* Right: illustration */}
          <div className="relative animate-fade-in">
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* Decorative bottom border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-[#c4952e] to-transparent"></div>
    </section>
  );
}

function HeroIllustration() {
  return (
    <div className="relative">
      {/* Browser window mockup */}
      <div className="bg-white rounded-lg shadow-2xl border border-[#d4ccb8] overflow-hidden max-w-lg mx-auto">
        {/* Browser bar */}
        <div className="bg-[#e8e0cc] px-4 py-2.5 flex items-center gap-2 border-b border-[#d4ccb8]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#d05050]"></div>
            <div className="w-3 h-3 rounded-full bg-[#d4a542]"></div>
            <div className="w-3 h-3 rounded-full bg-[#5a9a5a]"></div>
          </div>
          <div className="flex-1 ml-3 bg-white rounded px-3 py-1 text-xs text-[#8a7e62] font-sans truncate border border-[#d4ccb8]">
            example-news.com/article
          </div>
          <div className="w-5 h-5 bg-[#1e3a5f] rounded-sm flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1L1.5 3v3c0 3 2 4.5 4.5 5.5C8.5 10.5 10.5 9 10.5 6V3L6 1z" stroke="#c4952e" strokeWidth="1" fill="#f5f1e8"/>
              <path d="M4 6l1.5 1.5L8 5" stroke="#c4952e" strokeWidth="1" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Article content with annotations */}
        <div className="p-6 space-y-4">
          <div className="text-xs font-sans text-[#8a7e62] uppercase tracking-wide">Sample Article</div>
          <h3 className="text-lg font-serif font-bold text-[#1a1a1a] leading-tight">
            New Study Reveals Surprising Health Benefits
          </h3>

          {/* Annotated passage 1 */}
          <div className="relative">
            <p className="text-sm text-[#4a4238] leading-relaxed font-serif">
              A recent study found that daily exercise can improve cognitive performance by{' '}
              <span className="bg-[#fdf6e8] border-b-2 border-dashed border-[#c4952e] px-1 relative cursor-help">
                35%
                <span className="absolute -top-12 -right-2 w-44 bg-[#1e3a5f] text-[#f7f4ed] text-xs font-sans rounded p-2 shadow-lg opacity-0 hover:opacity-100 transition-opacity z-10 pointer-events-none">
                  Unclear comparison: 35% compared to what?
                </span>
              </span>
              .
            </p>
          </div>

          {/* Annotated passage 2 */}
          <div className="relative">
            <p className="text-sm text-[#4a4238] leading-relaxed font-serif">
              <span className="bg-[#fbeae8] border-b-2 border-dashed border-[#b03020] px-1">
                Experts agree
              </span>{' '}
              that this is the most important discovery of the decade.
            </p>
          </div>

          {/* Annotation panel preview */}
          <div className="mt-4 bg-[#f7f4ed] border border-[#d4ccb8] rounded-md p-3 space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#e3edf6] text-[#1e3a5f] text-xs font-sans font-semibold rounded">
                Possible factual claim
              </span>
              <span className="text-xs font-sans text-[#8a7e62]">ContextShield</span>
            </div>
            <div className="bg-[#fdf6e8] border-l-3 border-[#c4952e] px-2 py-1.5 rounded-sm">
              <div className="text-xs font-sans font-semibold text-[#8a5a10]">
                Missing time context
              </div>
              <div className="text-xs font-sans text-[#4a4238] mt-0.5">
                Compared with which time period?
              </div>
            </div>
            <div className="bg-[#fdf6e8] border-l-3 border-[#c4952e] px-2 py-1.5 rounded-sm">
              <div className="text-xs font-sans font-semibold text-[#8a5a10]">
                Missing attribution
              </div>
              <div className="text-xs font-sans text-[#4a4238] mt-0.5">
                Which experts, and what specific research?
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating annotation badge */}
      <div className="absolute -top-4 -right-2 bg-[#1e3a5f] text-[#f7f4ed] px-3 py-1.5 rounded-full shadow-lg text-xs font-sans font-semibold animate-fade-in">
        2 context gaps detected
      </div>
    </div>
  );
}
