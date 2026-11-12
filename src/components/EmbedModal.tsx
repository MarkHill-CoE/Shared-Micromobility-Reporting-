import React, { useState } from 'react';
import { X, Copy, Check, Code, ExternalLink, Sliders } from 'lucide-react';

interface EmbedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmbedModal: React.FC<EmbedModalProps> = ({ isOpen, onClose }) => {
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [embedHeight, setEmbedHeight] = useState(820);
  const [defaultView, setDefaultView] = useState<'wizard' | 'single'>('wizard');

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.run.app';
  const iframeSrc = `${currentOrigin}/?embedded=true${defaultView === 'single' ? '&view=single' : ''}`;

  const iframeSnippet = `<iframe
  src="${iframeSrc}"
  width="100%"
  height="${embedHeight}"
  style="border: none; max-width: 100%; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);"
  allow="geolocation; camera"
  title="Rental E-Scooter or E-Bike Issue Reporting"
></iframe>`;

  const scriptSnippet = `<!-- Optional Auto-Resize Listener for Parent Page -->
<script>
  window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'ESCOOTER_FRAME_RESIZE') {
      const iframe = document.querySelector('iframe[title="Rental E-Scooter or E-Bike Issue Reporting"]');
      if (iframe && event.data.height) {
        iframe.style.height = event.data.height + 20 + 'px';
      }
    }
    if (event.data && event.data.type === 'ESCOOTER_FORM_SUBMITTED') {
      console.log('E-Scooter report received:', event.data.trackingCode);
    }
  });
</script>`;

  const copyToClipboard = (text: string, isScript = false) => {
    navigator.clipboard.writeText(text);
    if (isScript) {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2000);
    } else {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="embed-modal-title"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Code className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="embed-modal-title" className="text-base font-bold text-slate-900">
                Website Iframe Integration
              </h2>
              <p className="text-xs text-slate-500">
                Embed this issue reporting form into your municipal or transit website
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Customization options */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
              <Sliders className="h-3.5 w-3.5" />
              <span>Embed Options</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Default View Mode
                </label>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDefaultView('wizard')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      defaultView === 'wizard'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Step-by-Step (3 Sections)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDefaultView('single')}
                    className={`px-3 py-1 rounded-md font-medium transition-colors ${
                      defaultView === 'single'
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All in One
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="height-range" className="block text-xs font-medium text-slate-700 mb-1">
                  Iframe Height: <span className="font-mono font-semibold">{embedHeight}px</span>
                </label>
                <input
                  id="height-range"
                  type="range"
                  min="600"
                  max="1200"
                  step="20"
                  value={embedHeight}
                  onChange={(e) => setEmbedHeight(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Iframe Code */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="iframe-code" className="text-xs font-semibold text-slate-800">
                1. Standard HTML Iframe Code
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(iframeSnippet, false)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                {copiedIframe ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-500" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              id="iframe-code"
              readOnly
              rows={5}
              value={iframeSnippet}
              className="w-full rounded-xl border border-slate-300 bg-slate-900 p-3 font-mono text-xs text-emerald-400 focus:outline-hidden"
            />
          </div>

          {/* Auto resize listener script */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="script-code" className="text-xs font-semibold text-slate-800">
                2. Auto-Resize &amp; Submission Event Script (Optional)
              </label>
              <button
                type="button"
                onClick={() => copyToClipboard(scriptSnippet, true)}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 text-slate-500" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              id="script-code"
              readOnly
              rows={7}
              value={scriptSnippet}
              className="w-full rounded-xl border border-slate-300 bg-slate-900 p-3 font-mono text-xs text-slate-300 focus:outline-hidden"
            />
          </div>

          {/* Direct Link Preview */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Direct Embed URL:</span>
            <a
              href={iframeSrc}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-emerald-700 hover:underline"
            >
              <span>{iframeSrc}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        <div className="flex items-center justify-end border-t border-slate-200 px-6 py-3.5 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
