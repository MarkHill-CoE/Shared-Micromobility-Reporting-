import React, { useState, useEffect } from 'react';
import type { IssueReport } from '../types/report.ts';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  FileCode,
  ExternalLink,
  Terminal,
  Layers,
  BookOpen,
} from 'lucide-react';

interface Open311InspectorModalProps {
  report: IssueReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const Open311InspectorModal: React.FC<Open311InspectorModalProps> = ({
  report,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'json' | 'xml' | 'definition' | 'endpoints'>('json');
  const [copied, setCopied] = useState<string | null>(null);
  const [inspectorData, setInspectorData] = useState<{
    open311_json?: any;
    open311_xml?: string;
    open311_service_definition_xml?: string;
    open311_service_definition_json?: any;
    endpoints?: { request_xml: string; request_json: string };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && report) {
      setIsLoading(true);
      fetch(`/api/open311/report/${encodeURIComponent(report.trackingCode || report.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setInspectorData(data);
          }
        })
        .catch((err) => console.error('Failed to fetch Open311 data:', err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, report]);

  if (!isOpen || !report) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://edmonton-escooter.run.app';
  const trackingCode = report.trackingCode || report.id;

  const jsonString = inspectorData?.open311_json
    ? JSON.stringify(inspectorData.open311_json, null, 2)
    : '// Loading Open311 JSON...';

  const xmlString = inspectorData?.open311_xml || '<!-- Loading Open311 XML... -->';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/65 backdrop-blur-xs">
      <div
        className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="open311-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-xs">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="open311-modal-title" className="text-base font-bold text-slate-900">
                  Open311 GeoReport v2 Schema Viewer
                </h2>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[11px] font-semibold px-2 py-0.5">
                  Standard Compliant
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Service Request: <span className="font-mono font-semibold text-slate-700">{trackingCode}</span> · Jurisdiction: <code className="font-mono text-emerald-800">edmonton.ca</code>
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

        {/* Tab Controls & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-6 py-2.5 bg-slate-100/50 shrink-0">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'json'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="h-3.5 w-3.5 text-emerald-600" />
              <span>Open311 JSON</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'xml'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Code2 className="h-3.5 w-3.5 text-blue-600" />
              <span>Open311 XML</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('definition')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'definition'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              <span>Service Definition</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('endpoints')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'endpoints'
                  ? 'bg-white text-emerald-800 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Terminal className="h-3.5 w-3.5 text-amber-600" />
              <span>REST API &amp; cURL</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'json' && (
              <>
                <button
                  type="button"
                  onClick={() => copyToClipboard(jsonString, 'json')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  {copied === 'json' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      jsonString,
                      `open311-request-${trackingCode}.json`,
                      'application/json'
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="h-3 w-3 text-slate-500" />
                  <span>Download .json</span>
                </button>
              </>
            )}

            {activeTab === 'xml' && (
              <>
                <button
                  type="button"
                  onClick={() => copyToClipboard(xmlString, 'xml')}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  {copied === 'xml' ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 text-slate-500" />
                      <span>Copy XML</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      xmlString,
                      `open311-request-${trackingCode}.xml`,
                      'text/xml'
                    )
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
                >
                  <Download className="h-3 w-3 text-slate-500" />
                  <span>Download .xml</span>
                </button>
              </>
            )}

            <a
              href={`/open311/v2/requests/${trackingCode}.${activeTab === 'xml' ? 'xml' : 'json'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline ml-1"
            >
              <span>Raw Endpoint</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950 font-mono text-xs text-slate-200">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400">
              <span>Generating normalized Open311 schema...</span>
            </div>
          ) : activeTab === 'json' ? (
            <pre className="whitespace-pre-wrap break-all text-emerald-400 selection:bg-emerald-900 selection:text-white">
              {jsonString}
            </pre>
          ) : activeTab === 'xml' ? (
            <pre className="whitespace-pre-wrap break-all text-blue-300 selection:bg-blue-900 selection:text-white">
              {xmlString}
            </pre>
          ) : activeTab === 'definition' ? (
            <div className="space-y-4 text-slate-300">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-sans">
                <span className="font-semibold text-white block">Open311 Service Code: <code className="font-mono text-purple-400">micromobility-hazard</code></span>
                <span className="text-slate-400 block mt-0.5">Defines the required and custom attribute structure per Open311 Section 7.2 specification.</span>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 font-sans block mb-1">
                  Service Definition XML:
                </span>
                <pre className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-purple-300 whitespace-pre-wrap text-[11px]">
                  {inspectorData?.open311_service_definition_xml || ''}
                </pre>
              </div>
            </div>
          ) : (
            <div className="space-y-5 font-sans text-xs text-slate-300">
              <div className="rounded-lg bg-slate-900 p-4 border border-slate-800 space-y-2">
                <span className="font-bold text-white text-sm block">
                  City of Edmonton Open311 GeoReport v2 REST API Endpoints
                </span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  These live endpoints allow municipal 311 CRM systems, public safety analytics platforms, and micromobility operators to consume and query requests in real-time.
                </p>
              </div>

              {/* Endpoint 1: Services List */}
              <div className="rounded-lg bg-slate-900 p-3.5 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono">
                  GET /open311/v2/services.json  (or .xml)
                </span>
                <span className="text-slate-400 text-xs block">Returns acceptable 311 service request types for Edmonton.</span>
                <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300">
                  curl -s "{currentOrigin}/open311/v2/services.json"
                </div>
              </div>

              {/* Endpoint 2: Service Definition */}
              <div className="rounded-lg bg-slate-900 p-3.5 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono">
                  GET /open311/v2/services/micromobility-hazard.json  (or .xml)
                </span>
                <span className="text-slate-400 text-xs block">Returns required attributes (issue types, operator colours, vehicle ID, incident time).</span>
                <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300">
                  curl -s "{currentOrigin}/open311/v2/services/micromobility-hazard.json"
                </div>
              </div>

              {/* Endpoint 3: Service Requests Feed */}
              <div className="rounded-lg bg-slate-900 p-3.5 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono">
                  GET /open311/v2/requests.json  (or .xml)
                </span>
                <span className="text-slate-400 text-xs block">Query active reports. Filters supported: <code>?status=open|closed</code>, <code>?service_request_id=...</code>, <code>?start_date=...</code>.</span>
                <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300">
                  curl -s "{currentOrigin}/open311/v2/requests.xml?status=open"
                </div>
              </div>

              {/* Endpoint 4: Single Service Request */}
              <div className="rounded-lg bg-slate-900 p-3.5 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono">
                  GET /open311/v2/requests/{trackingCode}.json  (or .xml)
                </span>
                <span className="text-slate-400 text-xs block">Fetch this specific report in Open311 standard format.</span>
                <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300">
                  curl -s "{currentOrigin}/open311/v2/requests/{trackingCode}.xml"
                </div>
              </div>

              {/* Endpoint 5: Discovery */}
              <div className="rounded-lg bg-slate-900 p-3.5 border border-slate-800 space-y-1.5">
                <span className="font-semibold text-emerald-400 block font-mono">
                  GET /open311/discovery.json  (or .xml)
                </span>
                <span className="text-slate-400 text-xs block">Standard GeoReport v2 Service Discovery file.</span>
                <div className="p-2 bg-black rounded font-mono text-[11px] text-slate-300">
                  curl -s "{currentOrigin}/open311/discovery.json"
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-sans">
            <BookOpen className="h-3.5 w-3.5 text-emerald-700" />
            <span>Open311 GeoReport v2 Specification Compliant · UTF-8 XML &amp; Spark JSON</span>
          </div>

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
