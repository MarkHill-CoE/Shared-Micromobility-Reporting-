import React, { useState, useEffect } from 'react';
import type { IssueReport, ReportStatus } from '../types/report.ts';
import { Open311InspectorModal } from './Open311InspectorModal.tsx';
import {
  Download,
  Search,
  Filter,
  RefreshCw,
  MapPin,
  Clock,
  Bike,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  Cloud,
  FileSpreadsheet,
  X,
  ChevronDown,
  Code2,
  FileCode,
  ShieldCheck,
  Mail,
  Send,
} from 'lucide-react';

interface DispatchDashboardProps {
  onBackToForm: () => void;
}

export const DispatchDashboard: React.FC<DispatchDashboardProps> = ({ onBackToForm }) => {
  const [reports, setReports] = useState<IssueReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOperator, setSelectedOperator] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<IssueReport | null>(null);
  const [open311ModalReport, setOpen311ModalReport] = useState<IssueReport | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      if (selectedOperator !== 'all') params.set('operator', selectedOperator);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
      setError('Could not connect to GCP storage service.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedStatus, selectedOperator]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const updateStatus = async (reportId: string, newStatus: ReportStatus) => {
    setIsUpdatingStatus(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Status update failed');

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
      );
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport({ ...selectedReport, status: newStatus });
      }
    } catch {
      setActionFeedback('Failed to update status on server.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const retryEmailDispatch = async (reportId: string) => {
    setIsSendingEmail(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/reports/${encodeURIComponent(reportId)}/notify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Email dispatch failed');
      const updatedReport: IssueReport = data.report;
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? updatedReport : r))
      );
      if (selectedReport && selectedReport.id === reportId) {
        setSelectedReport(updatedReport);
      }
      if (updatedReport.emailDispatch?.status === 'sent') {
        setActionFeedback(`Email dispatched to ${updatedReport.emailDispatch.recipient}.`);
      } else {
        setActionFeedback(
          updatedReport.emailDispatch?.error || 'SMTP server not configured; email remains queued.'
        );
      }
    } catch (err: any) {
      setActionFeedback(err?.message || 'Failed to dispatch vendor email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Status badge styling
  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'Submitted':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Under Review':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Dispatched to Operator':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Resolved':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <Cloud className="h-3.5 w-3.5" />
            <span>GCP Storage Active · Data File: /data/reports.json</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Municipal Dispatch &amp; Review Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time intake queue of citizen issue reports for Lime, Bird, and private micro-mobility devices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchReports}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            title="Refresh submissions from server"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href="/api/export?format=open311-json"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 hover:bg-slate-50 shadow-xs transition-colors"
            title="Export all requests in Open311 GeoReport v2 JSON format"
          >
            <FileCode className="h-3.5 w-3.5 text-emerald-600" />
            <span>Open311 JSON</span>
          </a>

          <a
            href="/api/export?format=open311-xml"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-slate-50 shadow-xs transition-colors"
            title="Export all requests in Open311 GeoReport v2 XML format"
          >
            <Code2 className="h-3.5 w-3.5 text-blue-600" />
            <span>Open311 XML</span>
          </a>

          <a
            href="/api/export?format=csv"
            download
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-slate-600" />
            <span>CSV</span>
          </a>

          <button
            type="button"
            onClick={onBackToForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
          >
            <span>Back to Intake Form</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Total Stored</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {reports.length}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">New / Submitted</span>
          <span className="text-2xl font-bold text-amber-700 tabular-nums">
            {reports.filter((r) => r.status === 'Submitted').length}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Dispatched to Vendor</span>
          <span className="text-2xl font-bold text-purple-700 tabular-nums">
            {reports.filter((r) => r.status === 'Dispatched to Operator').length}
          </span>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Resolved</span>
          <span className="text-2xl font-bold text-emerald-700 tabular-nums">
            {reports.filter((r) => r.status === 'Resolved').length}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <input
            type="text"
            placeholder="Search by tracking code, vehicle ID, location, or problem keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-300 pl-9 pr-20 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-hidden"
          />
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted (New)</option>
            <option value="Under Review">Under Review</option>
            <option value="Dispatched to Operator">Dispatched to Operator</option>
            <option value="Resolved">Resolved</option>
          </select>

          {/* Operator filter */}
          <select
            value={selectedOperator}
            onChange={(e) => setSelectedOperator(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="all">All Operators</option>
            <option value="Lime">Lime</option>
            <option value="Bird">Bird</option>
            <option value="Private">Private</option>
          </select>
        </div>
      </div>

      {/* Reports Table / List */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
            <span>Loading submissions from GCP storage...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            <p className="font-semibold text-slate-700 text-sm">No reports found</p>
            <p className="mt-1">Try clearing your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3">Tracking Code</th>
                  <th className="px-4 py-3">Date &amp; Time</th>
                  <th className="px-4 py-3">Operator / ID</th>
                  <th className="px-4 py-3">Issue Category</th>
                  <th className="px-4 py-3">Location Details</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {report.trackingCode}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap tabular-nums">
                      {report.incidentDate} {report.incidentTime}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 truncate max-w-[160px]">
                        {report.identifyingColours.split(' - ')[0]}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {report.vehicleIdNumber || 'ID not stated'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {report.issueTypes.improperParking && (
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            Parking
                          </span>
                        )}
                        {report.issueTypes.damageMalfunction && (
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            Damage
                          </span>
                        )}
                        {report.issueTypes.safetyConcerns && (
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            Safety
                          </span>
                        )}
                        {report.issueTypes.other && (
                          <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                            Other
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 max-w-[240px] truncate">
                      {report.locationDetails}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusBadge(
                          report.status
                        )}`}
                      >
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpen311ModalReport(report);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
                        title="Inspect Open311 GeoReport v2 schema"
                      >
                        <Code2 className="h-3 w-3" />
                        <span>Open311</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                        className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50/70">
              <div>
                <span className="text-xs font-medium text-slate-500">Report Details</span>
                <h2 className="text-lg font-bold text-slate-900 font-mono">
                  {selectedReport.trackingCode}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-500 block text-xs">Current Status:</span>
                  <span
                    className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(
                      selectedReport.status
                    )}`}
                  >
                    {selectedReport.status}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500">Change Status:</span>
                  <select
                    disabled={isUpdatingStatus}
                    value={selectedReport.status}
                    onChange={(e) =>
                      updateStatus(selectedReport.id, e.target.value as ReportStatus)
                    }
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800"
                  >
                    <option value="Submitted">Submitted</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Dispatched to Operator">Dispatched to Operator</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-xs text-slate-500 block">Operator / Colours</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedReport.identifyingColours}
                  </span>
                  {selectedReport.vehicleIdNumber && (
                    <span className="font-mono text-xs text-slate-600 block mt-1">
                      VIN: {selectedReport.vehicleIdNumber}
                    </span>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-xs text-slate-500 block">Incident Date &amp; Time</span>
                  <span className="font-semibold text-slate-900 mt-0.5 block">
                    {selectedReport.incidentDate} at {selectedReport.incidentTime}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <span className="text-xs text-slate-500 block">Location Details</span>
                <span className="font-semibold text-slate-900 mt-0.5 block">
                  {selectedReport.locationDetails}
                </span>
                {selectedReport.gpsCoordinates && (
                  <span className="text-xs text-slate-500 font-mono block mt-1">
                    GPS Coordinates: {selectedReport.gpsCoordinates.latitude},{' '}
                    {selectedReport.gpsCoordinates.longitude} (±{selectedReport.gpsCoordinates.accuracy}m)
                  </span>
                )}
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-xs text-slate-500">Description of Issue (PII Scrubbed)</span>
                  {selectedReport.piiScrubbing && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#E8F1F6] border border-[#B6D0E2] px-2 py-0.5 text-[11px] font-semibold text-[#005087]">
                      <ShieldCheck className="h-3 w-3 text-[#008269]" />
                      {selectedReport.piiScrubbing.scrubbed
                        ? `${selectedReport.piiScrubbing.redactedCount} redacted (${selectedReport.piiScrubbing.redactedCategories.join(', ')})`
                        : 'Verified PII-Free'}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {selectedReport.issueDescription}
                </p>
              </div>

              {selectedReport.emailDispatch && (
                <div className="rounded-lg border border-[#B6D0E2] bg-[#E8F1F6]/50 p-3.5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#193A5A]">
                      <Mail className="h-3.5 w-3.5 text-[#005087]" />
                      <span>Vendor Email Dispatch</span>
                    </div>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        selectedReport.emailDispatch.status === 'sent'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : selectedReport.emailDispatch.status === 'failed'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {selectedReport.emailDispatch.status === 'sent'
                        ? 'Sent via SMTP'
                        : selectedReport.emailDispatch.status === 'failed'
                        ? 'Delivery Failed'
                        : 'Pending SMTP Config'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      <span className="font-semibold text-slate-500">Vendor: </span>
                      <span>{selectedReport.emailDispatch.vendor}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Recipient: </span>
                      <span className="font-mono text-[#005087]">{selectedReport.emailDispatch.recipient}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-500">Subject: </span>
                      <span className="font-mono text-slate-900 break-all">{selectedReport.emailDispatch.subject}</span>
                    </div>
                    {selectedReport.emailDispatch.sentAt && (
                      <div>
                        <span className="font-semibold text-slate-500">Sent At: </span>
                        <span>{new Date(selectedReport.emailDispatch.sentAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <details className="text-xs">
                    <summary className="cursor-pointer font-semibold text-[#005087] hover:underline">
                      View Scrubbed Email Body
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded border border-[#D0D7DE] bg-white p-2.5 font-mono text-[11px] text-slate-700">
                      {selectedReport.emailDispatch.body}
                    </pre>
                  </details>

                  {actionFeedback && (
                    <div className="rounded bg-white border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-700">
                      {actionFeedback}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isSendingEmail}
                      onClick={() => retryEmailDispatch(selectedReport.id)}
                      className="inline-flex items-center gap-1.5 rounded-md bg-[#005087] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#193A5A] disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      <Send className="h-3 w-3" />
                      <span>{isSendingEmail ? 'Dispatching...' : 'Send / Retry via SMTP'}</span>
                    </button>
                    <a
                      href={`mailto:${encodeURIComponent(selectedReport.emailDispatch.recipient)}?subject=${encodeURIComponent(selectedReport.emailDispatch.subject)}&body=${encodeURIComponent(selectedReport.emailDispatch.body)}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#005087] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#005087] hover:bg-[#E8F1F6] transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span>Open in Mail App</span>
                    </a>
                  </div>
                </div>
              )}

              {selectedReport.attachment && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-xs text-slate-500 block mb-2">Attached Photo / Video</span>
                  {selectedReport.attachment.type.startsWith('image/') && selectedReport.attachment.dataUrl ? (
                    <img
                      src={selectedReport.attachment.dataUrl}
                      alt="Citizen evidence photo"
                      className="max-h-60 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <div className="text-xs font-mono text-slate-700">
                      File: {selectedReport.attachment.name} ({(selectedReport.attachment.size / 1024).toFixed(0)} KB)
                    </div>
                  )}
                </div>
              )}

              {selectedReport.internalNotes && (
                <div className="rounded-lg bg-amber-50/70 border border-amber-200 p-3">
                  <span className="text-xs font-semibold text-amber-900 block">Internal Dispatch Notes:</span>
                  <p className="mt-0.5 text-xs text-amber-800">
                    {selectedReport.internalNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setOpen311ModalReport(selectedReport)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <Code2 className="h-3.5 w-3.5 text-emerald-700" />
                <span>View Open311 Schema (JSON &amp; XML)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open311 GeoReport v2 Inspector Modal */}
      <Open311InspectorModal
        report={open311ModalReport}
        isOpen={!!open311ModalReport}
        onClose={() => setOpen311ModalReport(null)}
      />
    </div>
  );
};
