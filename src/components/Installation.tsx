import { useState } from 'react';
import { Download, FileArchive, Chrome, Settings, FolderOpen, Pin, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const STEPS = [
  { num: 1, icon: Download, title: 'Download', text: 'Click the download button and save the ZIP archive to your computer.' },
  { num: 2, icon: FileArchive, title: 'Extract', text: 'Extract the archive into a permanent folder. Do not select the ZIP file itself in Chrome.' },
  { num: 3, icon: Chrome, title: 'Open Chrome Extensions', text: 'Navigate to chrome://extensions in your Chrome browser.' },
  { num: 4, icon: Settings, title: 'Enable Developer mode', text: 'Enable the Developer mode switch in the top-right corner of the extensions page.' },
  { num: 5, icon: FolderOpen, title: 'Load unpacked', text: 'Click "Load unpacked" and select the extracted folder containing the extension\'s manifest.json file.' },
  { num: 6, icon: Pin, title: 'Pin the extension', text: 'Open Chrome\'s Extensions menu and pin ContextShield for convenient access.' },
  { num: 7, icon: CheckCircle2, title: 'Test the extension', text: 'Open a normal webpage, click the ContextShield icon, and test the claim-inspection features.' },
];

const TROUBLESHOOTING = [
  {
    problem: 'I selected the ZIP file instead of the extracted folder',
    solution: 'Chrome requires you to select the extracted folder, not the ZIP archive. Extract the ZIP first, then select the folder containing manifest.json.',
  },
  {
    problem: 'I get a "Missing manifest" error',
    solution: 'Make sure you selected the correct folder. The folder must contain a file named manifest.json at its top level. If you see a nested folder, select the inner one.',
  },
  {
    problem: 'The extension does not appear after loading',
    solution: 'Check that Developer mode is enabled. Try refreshing the chrome://extensions page. If it still does not appear, verify the folder structure and try loading again.',
  },
  {
    problem: 'The popup does not open',
    solution: 'Ensure you are on a regular webpage (http or https), not a chrome:// internal page. Try clicking the extension icon again. Check the extensions page for any error messages.',
  },
  {
    problem: 'The extension does not work on certain pages',
    solution: 'Chrome-internal pages (chrome://, about:), the Chrome Web Store, and some restricted pages do not allow content scripts. Use the context menu on regular webpages instead.',
  },
  {
    problem: 'I downloaded the ZIP but cannot load it',
    solution: 'The ZIP must be extracted first. On Windows, right-click and select "Extract All." On Mac, double-click the ZIP. Then load the extracted folder through "Load unpacked."',
  },
];

export default function Installation() {
  const [expandedTrouble, setExpandedTrouble] = useState<number | null>(null);

  return (
    <section id="installation" className="py-24 bg-white border-y border-[#e8e0cc]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-block px-3 py-1 bg-[#1e3a5f]/10 rounded-full mb-4">
            <span className="text-xs font-sans font-semibold text-[#1e3a5f] tracking-wide uppercase">
              Installation Guide
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1a1a1a] mb-4 text-balance">
            Install ContextShield in seven steps
          </h2>
          <p className="text-lg text-[#4a4238] font-sans max-w-2xl mx-auto">
            Developer-loaded extensions are installed manually. Chrome Web Store publication is a separate process.
          </p>
        </div>

        {/* Download card */}
        <div className="bg-[#1e3a5f] rounded-xl p-8 mb-12 text-center">
          <h3 className="text-2xl font-serif font-bold text-[#f7f4ed] mb-2">
            Download ContextShield for Chrome
          </h3>
          <p className="text-[#9bb8d4] font-sans text-sm mb-6">
            Version 1.0.0 · Manifest V3 · 43 KB · No account required
          </p>
          <a
            href="/downloads/contextshield-chrome.zip"
            download="contextshield-chrome.zip"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#c4952e] hover:bg-[#d4a542] text-[#1a1a1a] font-sans font-bold rounded-lg transition-colors shadow-lg text-lg"
          >
            <Download className="w-6 h-6" />
            Download Extension (ZIP)
          </a>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs font-sans text-[#9bb8d4]">
            <span>Package: contextshield-chrome.zip</span>
            <span>·</span>
            <span>21 files included</span>
            <span>·</span>
            <span>Chrome desktop only</span>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-16">
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex gap-5 bg-[#f7f4ed] border border-[#e8e0cc] rounded-lg p-5 hover:border-[#c4952e] transition-colors"
              >
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#c4952e]" />
                  </div>
                  {step.num < STEPS.length && (
                    <div className="w-0.5 h-full bg-[#d4ccb8] mt-2"></div>
                  )}
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-sans font-bold text-[#c4952e] uppercase tracking-wide">
                      Step {step.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-serif font-bold text-[#1a1a1a] mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm font-sans text-[#4a4238] leading-relaxed">
                    {step.text}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Troubleshooting */}
        <div className="bg-[#f7f4ed] border border-[#e8e0cc] rounded-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-[#b03020]" />
            <h3 className="text-xl font-serif font-bold text-[#1a1a1a]">
              Troubleshooting
            </h3>
          </div>
          <div className="space-y-2">
            {TROUBLESHOOTING.map((item, idx) => (
              <div key={idx} className="bg-white border border-[#e8e0cc] rounded-md overflow-hidden">
                <button
                  onClick={() => setExpandedTrouble(expandedTrouble === idx ? null : idx)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#fdf6e8] transition-colors"
                >
                  <span className="text-sm font-sans font-semibold text-[#1a1a1a]">
                    {item.problem}
                  </span>
                  {expandedTrouble === idx ? (
                    <ChevronUp className="w-4 h-4 text-[#8a7e62] flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#8a7e62] flex-shrink-0" />
                  )}
                </button>
                {expandedTrouble === idx && (
                  <div className="px-4 pb-4 animate-slide-in">
                    <p className="text-sm font-sans text-[#4a4238] leading-relaxed">
                      {item.solution}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 bg-[#eef3f8] border border-[#1e3a5f]/20 rounded-lg p-4">
          <p className="text-sm font-sans text-[#1e3a5f] leading-relaxed">
            <strong>Note:</strong> Developer-loaded extensions are intended for manual installation.
            Chrome Web Store publication requires a separate review and distribution process.
            ContextShield is not currently listed on the Chrome Web Store.
          </p>
        </div>
      </div>
    </section>
  );
}
