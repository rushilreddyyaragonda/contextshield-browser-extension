import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, HelpCircle, PenLine } from 'lucide-react';
import {
  classifyClaim,
  detectGaps,
  explainClassification,
  DEMO_ARTICLE,
  type ClassificationResult,
  type ContextGap,
} from '@/lib/analysis';

type EvidenceStatus = 'not_reviewed' | 'needs_evidence' | 'evidence_located' | 'partially_supported' | 'conflicting_evidence' | 'unresolved';

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  not_reviewed: 'Not reviewed',
  needs_evidence: 'Needs evidence',
  evidence_located: 'Evidence located',
  partially_supported: 'Partially supported',
  conflicting_evidence: 'Conflicting evidence found',
  unresolved: 'Unresolved',
};

const STATUS_COLORS: Record<EvidenceStatus, string> = {
  not_reviewed: 'bg-[#e8e0cc] text-[#8a7e62]',
  needs_evidence: 'bg-[#fdf6e8] text-[#8a5a10]',
  evidence_located: 'bg-[#e8f0e8] text-[#2a6a3a]',
  partially_supported: 'bg-[#eef3f8] text-[#1e3a5f]',
  conflicting_evidence: 'bg-[#fbeae8] text-[#b03020]',
  unresolved: 'bg-[#f0e8f5] text-[#5a3a7a]',
};

const LABEL_STYLES: Record<string, string> = {
  factual: 'bg-[#e3edf6] text-[#1e3a5f]',
  opinion: 'bg-[#fdf0e0] text-[#8a5a10]',
  prediction: 'bg-[#f0e8f5] text-[#5a3a7a]',
  question: 'bg-[#e8f0e8] text-[#2a6a3a]',
  generalization: 'bg-[#fbeae8] text-[#b03020]',
  numerical: 'bg-[#e0f0f5] text-[#1a5a7a]',
  instruction: 'bg-[#f5e8e0] text-[#7a4a2a]',
  empty: 'bg-[#e8e0cc] text-[#8a7e62]',
  invalid: 'bg-[#e8e0cc] text-[#8a7e62]',
  too_long: 'bg-[#e8e0cc] text-[#8a7e62]',
};

interface AnalysisState {
  classification: ClassificationResult;
  gaps: ContextGap[];
  explanation: string;
}

export default function LiveDemo() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState | null>(null);
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [status, setStatus] = useState<EvidenceStatus>('not_reviewed');
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  function analyzeText(text: string, id?: string) {
    const classification = classifyClaim(text);
    const gaps = detectGaps(text);
    const explanation = explainClassification(classification);
    setAnalysis({ classification, gaps, explanation });
    setSelectedId(id || 'custom');
    setStatus('not_reviewed');
    setExpandedGap(null);
  }

  function handleCustomAnalyze() {
    if (customText.trim().length > 0) {
      analyzeText(customText.trim());
    }
  }

  return (
    <section id="demo" className="py-24 bg-white border-y border-[#e8e0cc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 bg-[#c4952e]/10 rounded-full mb-4">
            <span className="text-xs font-sans font-semibold text-[#8a5a10] tracking-wide uppercase">
              Interactive Demo
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4 text-balance">
            Try the analysis yourself
          </h2>
          <p className="text-lg text-[#4a4238] font-sans max-w-2xl mx-auto">
            This is a fictional sample article. Click any highlighted passage to see how ContextShield analyzes it — or paste your own text.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Article panel */}
          <div className="lg:col-span-3">
            <div className="bg-[#f7f4ed] border border-[#d4ccb8] rounded-lg overflow-hidden">
              {/* Mock browser bar */}
              <div className="bg-[#e8e0cc] px-4 py-2 flex items-center gap-2 border-b border-[#d4ccb8]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#d05050]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#d4a542]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#5a9a5a]"></div>
                </div>
                <div className="flex-1 ml-3 bg-white rounded px-3 py-0.5 text-xs text-[#8a7e62] font-sans truncate border border-[#d4ccb8]">
                  example-publication.com/health/exercise-study
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <div className="text-xs font-sans text-[#8a7e62] uppercase tracking-wider mb-2">
                  Fictional Sample Article
                </div>
                <h3 className="text-2xl font-serif font-bold text-[#1a1a1a] mb-1 leading-tight">
                  New Study Reveals Surprising Health Benefits of Daily Exercise
                </h3>
                <div className="text-sm font-sans text-[#8a7e62] mb-6">
                  By Sample Author · Published recently · Example Publication
                </div>

                <div className="space-y-4">
                  {DEMO_ARTICLE.map((passage) => {
                    const isSelected = selectedId === passage.id;
                    return (
                      <div key={passage.id}>
                        <div className="text-xs font-sans text-[#a0967c] mb-1">
                          {passage.context}
                        </div>
                        <p
                          onClick={() => analyzeText(passage.text, passage.id)}
                          className={`text-[#1a1a1a] leading-relaxed font-serif text-[15px] cursor-pointer rounded p-2 -m-2 transition-all ${
                            isSelected
                              ? 'bg-[#eef3f8] border border-[#1e3a5f]/30'
                              : 'hover:bg-[#fdf6e8] border border-transparent'
                          }`}
                        >
                          {passage.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Custom text input */}
                <div className="mt-8 pt-6 border-t border-[#d4ccb8]">
                  <button
                    onClick={() => setShowCustom(!showCustom)}
                    className="text-sm font-sans font-semibold text-[#1e3a5f] hover:underline flex items-center gap-1"
                  >
                    {showCustom ? 'Hide' : 'Paste your own text to analyze'}
                  </button>
                  {showCustom && (
                    <div className="mt-3 animate-slide-in">
                      <textarea
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        placeholder="Paste any passage here..."
                        className="w-full p-3 border border-[#d4ccb8] rounded-md font-sans text-sm text-[#1a1a1a] bg-white resize-y focus:outline-none focus:border-[#1e3a5f] transition-colors"
                        rows={4}
                      />
                      <button
                        onClick={handleCustomAnalyze}
                        className="mt-2 px-5 py-2 bg-[#1e3a5f] hover:bg-[#2a4f7a] text-[#f7f4ed] font-sans font-semibold text-sm rounded-md transition-colors"
                      >
                        Analyze Passage
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Analysis panel */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#d4ccb8] rounded-lg p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                  <path d="M11 1L2 5v6c0 5.5 3.8 8.5 9 10 5.2-1.5 9-4.5 9-10V5l-9-4z" stroke="#1e3a5f" strokeWidth="1.5" fill="#f5f1e8"/>
                  <path d="M7 11l2.5 2.5L15 8" stroke="#c4952e" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                </svg>
                <span className="font-sans font-bold text-[#1e3a5f]">Analysis Results</span>
              </div>

              {!analysis ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-10 h-10 text-[#d4ccb8] mx-auto mb-3" />
                  <p className="text-sm font-sans text-[#8a7e62]">
                    Click any passage in the article to see the analysis.
                  </p>
                </div>
              ) : (
                <div className="animate-slide-in space-y-4">
                  {/* Classification */}
                  <div>
                    <div className="text-xs font-sans text-[#8a7e62] uppercase tracking-wide mb-1.5">
                      Classification
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded text-sm font-sans font-semibold ${
                        LABEL_STYLES[analysis.classification.type] || LABEL_STYLES.factual
                      }`}
                    >
                      {analysis.classification.label}
                    </span>
                  </div>

                  {/* Passage */}
                  <div>
                    <div className="text-xs font-sans text-[#8a7e62] uppercase tracking-wide mb-1.5">
                      Passage
                    </div>
                    <p className="text-sm font-serif italic text-[#4a4238] bg-[#f7f4ed] border-l-3 border-[#1e3a5f] p-3 rounded-r">
                      "{analysis.classification.text.substring(0, 300)}"
                    </p>
                  </div>

                  {/* Context gaps */}
                  <div>
                    <div className="text-xs font-sans text-[#8a7e62] uppercase tracking-wide mb-2">
                      Context Gaps ({analysis.gaps.length})
                    </div>
                    {analysis.gaps.length === 0 ? (
                      <div className="flex items-center gap-2 text-sm font-sans text-[#2a6a3a] bg-[#e8f0e8] p-3 rounded">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>No context-gap patterns detected. This does not verify the claim.</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analysis.gaps.map((gap) => (
                          <div key={gap.id} className="bg-[#fdf6e8] border-l-3 border-[#c4952e] rounded-r p-3">
                            <button
                              onClick={() => setExpandedGap(expandedGap === gap.id ? null : gap.id)}
                              className="w-full flex items-start justify-between gap-2 text-left"
                            >
                              <div className="flex items-start gap-2">
                                <AlertTriangle className="w-4 h-4 text-[#8a5a10] flex-shrink-0 mt-0.5" />
                                <span className="text-sm font-sans font-semibold text-[#8a5a10]">
                                  {gap.label}
                                </span>
                              </div>
                              {expandedGap === gap.id ? (
                                <ChevronUp className="w-4 h-4 text-[#8a5a10] flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-[#8a5a10] flex-shrink-0" />
                              )}
                            </button>
                            {expandedGap === gap.id && (
                              <div className="mt-3 ml-6 space-y-2 animate-slide-in">
                                <div>
                                  <div className="text-xs font-sans font-semibold text-[#8a5a10]">Why it matters</div>
                                  <p className="text-xs font-sans text-[#4a4238] mt-0.5">{gap.whyItMatters}</p>
                                </div>
                                <div>
                                  <div className="text-xs font-sans font-semibold text-[#1e3a5f]">Question to ask</div>
                                  <p className="text-xs font-sans text-[#4a4238] mt-0.5">{gap.questionToAsk}</p>
                                </div>
                                <div>
                                  <div className="text-xs font-sans font-semibold text-[#8a7e62]">Suggested next step</div>
                                  <p className="text-xs font-sans text-[#4a4238] mt-0.5">{gap.suggestedAction}</p>
                                </div>
                              </div>
                            )}
                            {expandedGap !== gap.id && (
                              <p className="mt-1 ml-6 text-xs font-sans text-[#4a4238]">
                                {gap.questionToAsk}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="bg-[#f7f4ed] border border-[#e8e0cc] rounded p-3">
                    <div className="text-xs font-sans font-semibold text-[#1e3a5f] mb-1">
                      Why this classification
                    </div>
                    <p className="text-xs font-sans text-[#4a4238] leading-relaxed">
                      {analysis.explanation}
                    </p>
                  </div>

                  {/* Manual assessment */}
                  <div className="pt-3 border-t border-[#e8e0cc]">
                    <div className="flex items-center gap-2 mb-2">
                      <PenLine className="w-4 h-4 text-[#8a7e62]" />
                      <span className="text-xs font-sans font-semibold text-[#8a7e62] uppercase tracking-wide">
                        Your assessment
                      </span>
                    </div>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as EvidenceStatus)}
                      className="w-full p-2 border border-[#d4ccb8] rounded text-sm font-sans bg-white text-[#1a1a1a] focus:outline-none focus:border-[#1e3a5f]"
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <div className={`mt-2 inline-block px-2 py-0.5 rounded text-xs font-sans font-medium ${STATUS_COLORS[status]}`}>
                      {STATUS_LABELS[status]} — user-managed, not auto-verified
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
