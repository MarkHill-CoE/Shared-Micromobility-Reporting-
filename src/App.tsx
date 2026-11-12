/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type {
  IssueReport,
  IssueReportSubmission,
  IssueTypeSelection,
  VehicleColourOption,
  FileAttachment,
} from './types/report.ts';
import { FormHeader } from './components/FormHeader.tsx';
import { StepProgressBar } from './components/StepProgressBar.tsx';
import { Section1IssueType } from './components/Section1IssueType.tsx';
import { Section2DateTimeLocation } from './components/Section2DateTimeLocation.tsx';
import { Section3VehicleDetails } from './components/Section3VehicleDetails.tsx';
import { SubmissionSuccess } from './components/SubmissionSuccess.tsx';
import { EmbedModal } from './components/EmbedModal.tsx';
import { DispatchDashboard } from './components/DispatchDashboard.tsx';
import { Open311InspectorModal } from './components/Open311InspectorModal.tsx';
import {
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  ShieldCheck,
  Code,
  CheckCircle2,
  AlertCircle,
  FileText,
  LayoutDashboard,
  Code2,
} from 'lucide-react';

export default function App() {
  // Query param detection for iframe embedding
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isEmbeddedFromQuery = urlParams?.get('embedded') === 'true';
  const initialViewParam = urlParams?.get('view') === 'single' ? 'single' : 'wizard';

  const [isEmbedded, setIsEmbedded] = useState<boolean>(isEmbeddedFromQuery);
  const [viewMode, setViewMode] = useState<'wizard' | 'single'>(initialViewParam);
  const [activeTab, setActiveTab] = useState<'form' | 'dashboard'>('form');
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [topOpen311Report, setTopOpen311Report] = useState<IssueReport | null>(null);

  const handleOpen311ApiClick = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.reports && data.reports.length > 0) {
        setTopOpen311Report(data.reports[0]);
      }
    } catch (err) {
      console.error('Failed to load report for Open311 viewer:', err);
    }
  };

  // Form State
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 3;
  const stepTitles = ['Issue Type', 'Date & Location', 'Vehicle Details'];
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]);

  const [issueTypes, setIssueTypes] = useState<IssueTypeSelection>({
    improperParking: false,
    damageMalfunction: false,
    safetyConcerns: false,
    other: false,
    otherText: '',
  });
  const [description, setDescription] = useState<string>('');

  // Default date to today
  const [incidentDate, setIncidentDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [incidentTime, setIncidentTime] = useState<string>(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });
  const [locationDetails, setLocationDetails] = useState<string>('');
  const [gpsCoordinates, setGpsCoordinates] = useState<
    { latitude: number; longitude: number; accuracy?: number } | undefined
  >(undefined);

  const [identifyingColours, setIdentifyingColours] = useState<VehicleColourOption | string>('');
  const [vehicleIdNumber, setVehicleIdNumber] = useState<string>('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);

  // Validation Errors
  const [errors, setErrors] = useState<{
    issueTypes?: string;
    description?: string;
    incidentDate?: string;
    incidentTime?: string;
    locationDetails?: string;
    identifyingColours?: string;
    vehicleIdNumber?: string;
    general?: string;
  }>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReport, setSubmittedReport] = useState<IssueReport | null>(null);

  // Detect iframe environment automatically
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const inIframe = window.self !== window.top || isEmbeddedFromQuery;
      setIsEmbedded(inIframe);
    }
  }, [isEmbeddedFromQuery]);

  // Notify parent window for responsive height adjustments
  useEffect(() => {
    if (typeof window !== 'undefined' && window.parent) {
      const notifyHeight = () => {
        const height = document.documentElement.scrollHeight || document.body.scrollHeight;
        window.parent.postMessage({ type: 'ESCOOTER_FRAME_RESIZE', height }, '*');
      };
      notifyHeight();
      const timer = setTimeout(notifyHeight, 150);
      return () => clearTimeout(timer);
    }
  }, [currentStep, viewMode, activeTab, submittedReport, errors]);

  // Validation functions
  const validateStep1 = (): boolean => {
    const newErrors: typeof errors = {};
    const hasAnyType =
      issueTypes.improperParking ||
      issueTypes.damageMalfunction ||
      issueTypes.safetyConcerns ||
      issueTypes.other;

    if (!hasAnyType) {
      newErrors.issueTypes = 'Please select at least one type of issue.';
    } else if (issueTypes.other && (!issueTypes.otherText || !issueTypes.otherText.trim())) {
      newErrors.issueTypes = 'Please enter a brief note for "Other" issue.';
    }

    if (!description.trim()) {
      newErrors.description = 'Please provide a clear description of the issue.';
    } else if (description.trim().length < 5) {
      newErrors.description = 'Description should be at least 5 characters long.';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: typeof errors = {};

    if (!incidentDate) {
      newErrors.incidentDate = 'Please select the date of the incident.';
    }

    if (!locationDetails.trim()) {
      newErrors.locationDetails = 'Please provide the street name or intersection.';
    } else if (locationDetails.trim().length < 3) {
      newErrors.locationDetails = 'Please provide a specific street or landmark location.';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: typeof errors = {};

    if (!identifyingColours) {
      newErrors.identifyingColours = 'Please select the identifying colour scheme or operator.';
    }

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Clear step specific errors
    setErrors({});

    if (currentStep === 1) {
      if (validateStep1()) {
        setCompletedSteps((prev) => [true, prev[1], prev[2]]);
        setCurrentStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCompletedSteps((prev) => [prev[0], true, prev[2]]);
        setCurrentStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    setErrors({});
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrors({});

    // Validate all sections
    const s1Valid = validateStep1();
    const s2Valid = validateStep2();
    const s3Valid = validateStep3();

    if (!s1Valid || !s2Valid || !s3Valid) {
      if (!s1Valid && viewMode === 'wizard') setCurrentStep(1);
      else if (!s2Valid && viewMode === 'wizard') setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);

    const payload: IssueReportSubmission = {
      issueTypes,
      issueDescription: description.trim(),
      incidentDate,
      incidentTime,
      locationDetails: locationDetails.trim(),
      gpsCoordinates,
      identifyingColours,
      vehicleIdNumber: vehicleIdNumber.trim(),
      attachment,
    };

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data = await response.json();
      const savedReport: IssueReport = data.report;
      setSubmittedReport(savedReport);

      // Emit postMessage for parent frame if embedded
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage(
          {
            type: 'ESCOOTER_FORM_SUBMITTED',
            reportId: savedReport.id,
            trackingCode: savedReport.trackingCode,
            status: savedReport.status,
          },
          '*'
        );
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Submission failed:', err);
      setErrors((prev) => ({
        ...prev,
        general: err.message || 'Failed to submit report to GCP database. Please try again.',
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSubmittedReport(null);
    setCurrentStep(1);
    setCompletedSteps([false, false, false]);
    setIssueTypes({
      improperParking: false,
      damageMalfunction: false,
      safetyConcerns: false,
      other: false,
      otherText: '',
    });
    setDescription('');
    setLocationDetails('');
    setGpsCoordinates(undefined);
    setIdentifyingColours('');
    setVehicleIdNumber('');
    setAttachment(null);
    setErrors({});
  };

  return (
    <div className={`min-h-screen ${isEmbedded ? 'p-3 sm:p-5 bg-transparent' : 'bg-[#F3F5F7] p-4 sm:p-8'}`}>
      {/* Top Bar for non-embedded view */}
      {!isEmbedded && (
        <header className="mx-auto max-w-4xl mb-6 flex items-center justify-between gap-4 border-b border-[#D0D7DE] pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-[#005087] text-white shadow-xs">
              <svg
                className="h-6 w-6 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.3l6 3.33v4.67c0 4.25-2.88 8.23-6 9.38-3.12-1.15-6-5.13-6-9.38V8.63l6-3.33z" />
                <path d="M11 11h2v5h-2zm0-4h2v2h-2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#193A5A] tracking-tight text-base sm:text-lg">
                  City of Edmonton
                </span>
                <span className="hidden sm:inline text-xs font-semibold uppercase tracking-wider text-[#005087] bg-[#E8F1F6] px-2 py-0.5 rounded-sm">
                  Official Service
                </span>
              </div>
              <span className="text-xs text-[#767676] block">
                Parks &amp; Roads Services · Micromobility Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('form')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-[#005087] text-white shadow-xs'
                  : 'text-[#444444] hover:text-[#005087] hover:bg-[#E8F1F6]'
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Intake Form</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-[#005087] text-white shadow-xs'
                  : 'text-[#444444] hover:text-[#005087] hover:bg-[#E8F1F6]'
              }`}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span>GCP Intake Queue</span>
            </button>

            <button
              type="button"
              onClick={handleOpen311ApiClick}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#B6D0E2] bg-[#E8F1F6] text-xs font-bold text-[#005087] hover:bg-[#D0E0EA] shadow-xs cursor-pointer"
              title="Open311 GeoReport v2 API and Schema Inspector"
            >
              <Code2 className="h-3.5 w-3.5 text-[#005087]" />
              <span>Open311 API</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEmbedModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#D0D7DE] bg-white text-xs font-bold text-[#005087] hover:bg-[#F3F5F7] shadow-xs cursor-pointer"
            >
              <Code className="h-3.5 w-3.5 text-[#005087]" />
              <span>Iframe Embed</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="mx-auto max-w-3xl">
        <div className="rounded-md border border-[#D0D7DE] bg-white p-5 sm:p-8 shadow-xs">
          {activeTab === 'dashboard' ? (
            <DispatchDashboard onBackToForm={() => setActiveTab('form')} />
          ) : submittedReport ? (
            <SubmissionSuccess
              report={submittedReport}
              onReset={handleResetForm}
              isEmbedded={isEmbedded}
            />
          ) : (
            <div>
              <FormHeader
                isEmbedded={isEmbedded}
                viewMode={viewMode}
                onToggleViewMode={setViewMode}
                onOpenEmbedModal={() => setIsEmbedModalOpen(true)}
              />

              {errors.general && (
                <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Multi-Step Wizard View */}
              {viewMode === 'wizard' ? (
                <div>
                  <StepProgressBar
                    currentStep={currentStep}
                    totalSteps={totalSteps}
                    stepTitles={stepTitles}
                    completedSteps={completedSteps}
                    onStepClick={(s) => setCurrentStep(s)}
                  />

                  {currentStep === 1 && (
                    <Section1IssueType
                      issueTypes={issueTypes}
                      onChangeIssueTypes={(val) => {
                        setIssueTypes(val);
                        if (errors.issueTypes) setErrors((prev) => ({ ...prev, issueTypes: undefined }));
                      }}
                      description={description}
                      onChangeDescription={(val) => {
                        setDescription(val);
                        if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
                      }}
                      errors={{
                        issueTypes: errors.issueTypes,
                        description: errors.description,
                      }}
                    />
                  )}

                  {currentStep === 2 && (
                    <Section2DateTimeLocation
                      incidentDate={incidentDate}
                      onChangeIncidentDate={(val) => {
                        setIncidentDate(val);
                        if (errors.incidentDate) setErrors((prev) => ({ ...prev, incidentDate: undefined }));
                      }}
                      incidentTime={incidentTime}
                      onChangeIncidentTime={(val) => {
                        setIncidentTime(val);
                        if (errors.incidentTime) setErrors((prev) => ({ ...prev, incidentTime: undefined }));
                      }}
                      locationDetails={locationDetails}
                      onChangeLocationDetails={(val) => {
                        setLocationDetails(val);
                        if (errors.locationDetails) setErrors((prev) => ({ ...prev, locationDetails: undefined }));
                      }}
                      gpsCoordinates={gpsCoordinates}
                      onSetGpsCoordinates={setGpsCoordinates}
                      errors={{
                        incidentDate: errors.incidentDate,
                        incidentTime: errors.incidentTime,
                        locationDetails: errors.locationDetails,
                      }}
                    />
                  )}

                  {currentStep === 3 && (
                    <Section3VehicleDetails
                      identifyingColours={identifyingColours}
                      onChangeIdentifyingColours={(val) => {
                        setIdentifyingColours(val);
                        if (errors.identifyingColours) setErrors((prev) => ({ ...prev, identifyingColours: undefined }));
                      }}
                      vehicleIdNumber={vehicleIdNumber}
                      onChangeVehicleIdNumber={(val) => setVehicleIdNumber(val)}
                      attachment={attachment}
                      onChangeAttachment={setAttachment}
                      errors={{
                        identifyingColours: errors.identifyingColours,
                      }}
                    />
                  )}

                  {/* Navigation Buttons for Wizard */}
                  <div className="mt-8 flex items-center justify-between border-t border-[#D0D7DE] pt-5">
                    {currentStep > 1 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-1.5 rounded-md border border-[#D0D7DE] bg-white px-4 py-2.5 text-xs font-bold text-[#005087] shadow-xs hover:bg-[#F3F5F7] transition-colors cursor-pointer"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        <span>Previous Section</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    {currentStep < totalSteps ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[#005087] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#193A5A] transition-colors cursor-pointer"
                      >
                        <span>Next: {stepTitles[currentStep]}</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSubmit()}
                        disabled={isSubmitting}
                        className="inline-flex items-center gap-2 rounded-md bg-[#005087] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#193A5A] transition-colors disabled:opacity-70 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Submitting to City Database...</span>
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            <span>Submit Issue Report</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Continuous Single-Page View */
                <form onSubmit={handleSubmit} className="space-y-10">
                  <Section1IssueType
                    issueTypes={issueTypes}
                    onChangeIssueTypes={(val) => setIssueTypes(val)}
                    description={description}
                    onChangeDescription={(val) => setDescription(val)}
                    errors={{
                      issueTypes: errors.issueTypes,
                      description: errors.description,
                    }}
                  />

                  <div className="border-t border-slate-100 pt-6">
                    <Section2DateTimeLocation
                      incidentDate={incidentDate}
                      onChangeIncidentDate={(val) => setIncidentDate(val)}
                      incidentTime={incidentTime}
                      onChangeIncidentTime={(val) => setIncidentTime(val)}
                      locationDetails={locationDetails}
                      onChangeLocationDetails={(val) => setLocationDetails(val)}
                      gpsCoordinates={gpsCoordinates}
                      onSetGpsCoordinates={setGpsCoordinates}
                      errors={{
                        incidentDate: errors.incidentDate,
                        incidentTime: errors.incidentTime,
                        locationDetails: errors.locationDetails,
                      }}
                    />
                  </div>

                  <div className="border-t border-slate-100 pt-6">
                    <Section3VehicleDetails
                      identifyingColours={identifyingColours}
                      onChangeIdentifyingColours={(val) => setIdentifyingColours(val)}
                      vehicleIdNumber={vehicleIdNumber}
                      onChangeVehicleIdNumber={(val) => setVehicleIdNumber(val)}
                      attachment={attachment}
                      onChangeAttachment={setAttachment}
                      errors={{
                        identifyingColours: errors.identifyingColours,
                      }}
                    />
                  </div>

                  <div className="border-t border-[#D0D7DE] pt-6 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 rounded-md bg-[#005087] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[#193A5A] transition-colors disabled:opacity-70 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Submitting to City Database...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>Submit Issue Report</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <footer className="mt-5 text-center text-xs text-slate-500 space-y-1">
          <p>
            Submissions are transmitted securely to municipal storage. Emergency safety hazards requiring immediate police or ambulance response should call 911.
          </p>
          {!isEmbedded && (
            <p className="text-[11px] text-slate-400">
              City Mobility Shared Micromobility Safety Program · Powered by Google Cloud Platform
            </p>
          )}
        </footer>
      </main>

      {/* Embed Modal */}
      <EmbedModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
      />

      {/* Top Bar Open311 Inspector Modal */}
      <Open311InspectorModal
        report={topOpen311Report}
        isOpen={!!topOpen311Report}
        onClose={() => setTopOpen311Report(null)}
      />
    </div>
  );
}
