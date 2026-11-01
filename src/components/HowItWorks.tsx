import { Search, FileSearch, GitCompare, NotebookPen, Eye, ListChecks } from 'lucide-react';

const STEPS = [
  {
    icon: Search,
    title: 'Select a passage',
    description: 'Highlight text on any webpage and right-click to inspect it with ContextShield, or click the toolbar icon to analyze the full page.',
  },
  {
    icon: FileSearch,
    title: 'Classify the claim',
    description: 'ContextShield identifies whether the passage reads as a factual claim, opinion, prediction, question, instruction, or generalization — using deterministic local rules.',
  },
  {
    icon: ListChecks,
    title: 'Detect context gaps',
    description: 'The engine checks for missing time context, vague attribution, unclear numerical comparisons, broad generalizations, and other patterns that warrant investigation.',
  },
  {
    icon: GitCompare,
    title: 'Compare statements',
    description: 'Paste two passages side by side to identify differing numbers, dates, entities, or polarity that may deserve further investigation.',
  },
  {
    icon: NotebookPen,
    title: 'Record your assessment',
    description: 'Save research notes, set a verification status, and track what you have investigated — all stored locally in your browser.',
  },
  {
    icon: Eye,
    title: 'Understand the analysis',
    description: 'Every finding explains what was noticed, why the rule flagged it, what information is available, and what you should investigate next.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-[#f7f4ed]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-[#1e3a5f]/10 rounded-full mb-4">
            <span className="text-xs font-sans font-semibold text-[#1e3a5f] tracking-wide uppercase">
              How It Works
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4 text-balance">
            From reading to investigating
          </h2>
          <p className="text-lg text-[#4a4238] font-sans max-w-2xl mx-auto">
            ContextShield does not tell you what to believe. It helps you ask better questions about what you read.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-white border border-[#e8e0cc] rounded-lg p-6 hover:border-[#c4952e] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#1e3a5f] rounded-lg flex items-center justify-center group-hover:bg-[#2a4f7a] transition-colors">
                    <Icon className="w-5 h-5 text-[#c4952e]" />
                  </div>
                  <span className="text-2xl font-serif font-bold text-[#d4ccb8]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-2">
                  {step.title}
                </h3>
                <p className="text-sm font-sans text-[#4a4238] leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
