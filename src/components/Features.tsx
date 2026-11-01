import { Search, Link2, AlertTriangle, GitCompare, NotebookPen, Eye } from 'lucide-react';

const FEATURES = [
  {
    icon: Search,
    title: 'Claim Inspector',
    description: 'Extract and inspect a selected statement. ContextShield classifies it as a possible factual claim, opinion, prediction, question, instruction, or generalization using deterministic local rules.',
    points: ['Right-click any selected text', 'Classify claim type', 'Edit before analysis'],
  },
  {
    icon: Link2,
    title: 'Evidence Trail',
    description: 'Review source links, publication information where available, and supporting context extracted from the page — without making external requests.',
    points: ['Page metadata extraction', 'Internal vs. external links', 'Citation pattern detection'],
  },
  {
    icon: AlertTriangle,
    title: 'Context Gaps',
    description: 'Identify missing dates, unclear attribution, broad generalizations, unsupported numerical claims, and correlation presented as causation.',
    points: ['8 gap detection patterns', 'Each gap includes a question to ask', 'Explainable reasoning'],
  },
  {
    icon: GitCompare,
    title: 'Contradiction Workspace',
    description: 'Compare two passages or source excerpts and identify differences in numbers, dates, entities, negation, and geography that deserve further investigation.',
    points: ['Side-by-side comparison', 'Surface-level text analysis', 'Manual interpretation field'],
  },
  {
    icon: NotebookPen,
    title: 'Research Notes',
    description: 'Save personal annotations and verification status locally. Notes are never transmitted and persist across browser sessions.',
    points: ['Six verification statuses', 'URL and date tracking', 'Export to JSON or Markdown'],
  },
  {
    icon: Eye,
    title: 'Transparent Analysis',
    description: 'Understand which checks were performed, what evidence was found, and what remains uncertain. Every finding connects to a real rule.',
    points: ['"Explain this finding" for each result', 'No fabricated credibility scores', 'Reproducible results'],
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-[#f7f4ed]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-[#1e3a5f]/10 rounded-full mb-4">
            <span className="text-xs font-sans font-semibold text-[#1e3a5f] tracking-wide uppercase">
              Features
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4 text-balance">
            Tools for investigating information
          </h2>
          <p className="text-lg text-[#4a4238] font-sans max-w-2xl mx-auto">
            Six core capabilities, all running locally in your browser. No paid API, no AI service, no account required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#e8e0cc] rounded-lg p-6 hover:shadow-lg hover:border-[#c4952e] transition-all group"
              >
                <div className="w-12 h-12 bg-[#1e3a5f] rounded-lg flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Icon className="w-6 h-6 text-[#c4952e]" />
                </div>
                <h3 className="text-xl font-serif font-bold text-[#1a1a1a] mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm font-sans text-[#4a4238] leading-relaxed mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-1.5">
                  {feature.points.map((point, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-sans text-[#6b6256]">
                      <span className="w-1.5 h-1.5 bg-[#c4952e] rounded-full flex-shrink-0"></span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
