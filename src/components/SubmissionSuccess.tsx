import React, { useState } from 'react';
import type { IssueReport } from '../types/report.ts';
import { Open311InspectorModal } from './Open311InspectorModal.tsx';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Cloud,
  MapPin,
  Calendar,
  AlertTriangle,
  FileCheck,
  Code2,
  ShieldCheck,
  Mail,
  ExternalLink,
} from 'lucide-react';

interface SubmissionSuccessProps {
  report: IssueReport;
  onReset: () => void;
  isEmbedded?: boolean;
}

export const SubmissionSuccess: React.FC<SubmissionSuccessProps> = ({
  report,
  onReset,
  isEmbedded,
}) => {
  const [copied, setCopied] = useState(false);
  const [showOpen311Modal, setShowOpen311Modal] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(report.trackingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const issueTypeList: string[] = [];
  if (report.issueTypes.improperParking) issueTypeList.push('Improper Parking');
  if (report.issueTypes.damageMalfunction) issueTypeList.push('Damage or Malfunction');
  if (report.issueTypes.safetyConcerns) issueTypeList.push('Safety Concerns');
  if (report.issueTypes.other) {
    issueTypeList.push(
      report.issueTypes.otherText ? `Other: ${report.issueTypes.otherText}` : 'Other'
    );
  }

  return (
    <div className="space-y-6 py-2" aria-live="polite">
      {/* Top Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center sm:text-left flex flex-col sm:flex-row items-center gap-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-800">
            <Cloud className="h-3.5 w-3.5" />
            <span>Stored in GCP Cloud Database</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Report Submitted Successfully
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Thank you for helping keep sidewalks, ramps, and roadways accessible. Your description was scrubbed for personally identifiable information and prepared for vendor dispatch.
          </p>
        </div>
      </div>

      {/* Tracking Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-medium text-slate-500 block">
              Reference Tracking Number
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-xl font-bold tracking-wider text-slate-900">
                {report.trackingCode}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Copy tracking code"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-500" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-xs text-slate-500 sm:text-right">
            <span>Status: </span>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {report.status}
            </span>
            <div className="text-[11px] text-slate-400 mt-1">
              Received: {new Date(report.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Summary of Answers */}
        <div className="mt-4 space-y-3 text-xs sm:text-sm">
          <h3 className="font-semibold text-slate-900 text-xs uppercase tracking-wider text-slate-500">
            Summary of Reported Answers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500 block mb-1">Type of Issue</span>
              <div className="font-medium text-slate-900 flex flex-wrap gap-1">
                {issueTypeList.map((type, i) => (
                  <span
                    key={i}
                    className="inline-block bg-white px-2 py-0.5 rounded border border-slate-200 text-xs text-slate-800"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500 block mb-1">Operator / Vehicle</span>
              <div className="font-medium text-slate-900">
                {report.identifyingColours}
              </div>
              {report.vehicleIdNumber && (
                <div className="text-xs text-slate-600 font-mono mt-1">
                  ID: {report.vehicleIdNumber}
                </div>
              )}
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500 block mb-1">Incident Time &amp; Location</span>
              <div className="font-medium text-slate-900 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>{report.locationDetails}</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <span>
                  {report.incidentDate} at {report.incidentTime || 'Not specified'}
                </span>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500 block mb-1">Attached Media</span>
              {report.attachment ? (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-800">
                  <FileCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{report.attachment.name}</span>
                  <span className="text-slate-400">
                    ({(report.attachment.size / (1024 * 1024)).toFixed(1)} MB)
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">None attached</span>
              )}
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
              <span className="text-xs text-slate-500">Description (PII Scrubbed)</span>
              {report.piiScrubbing && (
                <span className="inline-flex items-center gap-1 rounded bg-[#E8F1F6] border border-[#B6D0E2] px-2 py-0.5 text-[11px] font-semibold text-[#005087]">
                  <ShieldCheck className="h-3 w-3 text-[#008269]" />
                  {report.piiScrubbing.scrubbed
                    ? `${report.piiScrubbing.redactedCount} PII item(s) scrubbed: ${report.piiScrubbing.redactedCategories.join(', ')}`
                    : 'Verified PII-Free'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {report.issueDescription}
            </p>
          </div>

          {report.emailDispatch && (
            <div className="rounded-lg border border-[#B6D0E2] bg-[#E8F1F6]/50 p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#193A5A]">
                  <Mail className="h-3.5 w-3.5 text-[#005087]" />
                  <span>Vendor Email Notification</span>
                </div>
                {report.emailDispatch.status === 'sent' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    Sent via SMTP
                  </span>
                ) : report.emailDispatch.status === 'failed' ? (
                  <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                    SMTP Delivery Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                    Prepared (SMTP Not Configured)
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div>
                  <span className="font-semibold text-slate-500">To: </span>
                  <span className="font-mono text-[#005087]">{report.emailDispatch.recipient}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Subject: </span>
                  <span className="font-mono text-slate-900 break-all">{report.emailDispatch.subject}</span>
                </div>
              </div>
              {report.emailDispatch.status !== 'sent' && (
                <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-600">
                    {report.emailDispatch.error}
                  </span>
                  <a
                    href={`mailto:${encodeURIComponent(report.emailDispatch.recipient)}?subject=${encodeURIComponent(report.emailDispatch.subject)}&body=${encodeURIComponent(report.emailDispatch.body)}`}
                    className="inline-flex items-center gap-1 rounded border border-[#005087] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#005087] hover:bg-[#E8F1F6] transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>Open in Mail App</span>
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Printer className="h-4 w-4 text-slate-500" />
            <span>Print Receipt</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOpen311Modal(true)}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800 shadow-xs hover:bg-emerald-100 transition-colors cursor-pointer"
            title="Inspect formatted Open311 GeoReport v2 JSON and XML payload"
          >
            <Code2 className="h-4 w-4 text-emerald-700" />
            <span>Open311 Schema</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Submit Another Report</span>
        </button>
      </div>

      {/* Open311 Inspector Modal */}
      <Open311InspectorModal
        report={report}
        isOpen={showOpen311Modal}
        onClose={() => setShowOpen311Modal(false)}
      />
    </div>
  );
};
