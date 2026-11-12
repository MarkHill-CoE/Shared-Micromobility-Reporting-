export interface IssueTypeSelection {
  improperParking: boolean;
  damageMalfunction: boolean;
  safetyConcerns: boolean;
  other: boolean;
  otherText?: string;
}

export type VehicleColourOption =
  | 'Bird - Blue or Black E-Scooters and Blue and Black E-Bikes'
  | 'Lime - White and Green E-Scooters and E-Bikes'
  | 'Private E-Scooter or E-Bike'
  | 'Other / Unidentified';

export type ReportStatus = 'Submitted' | 'Under Review' | 'Dispatched to Operator' | 'Resolved' | 'Closed';

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  dataUrl?: string; // base64 representation for preview & storage
}

export interface IssueReportSubmission {
  // Section 1: Rental E-Scooter or E-Bike Issue Reporting
  issueTypes: IssueTypeSelection;
  issueDescription: string;

  // Section 2: Incident Date and Location Details
  incidentDate: string; // YYYY-MM-DD
  incidentTime: string; // HH:mm
  locationDetails: string;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  // Section 3: Vehicle Details
  identifyingColours: VehicleColourOption | string;
  vehicleIdNumber: string;
  attachment?: FileAttachment | null;

  // Metadata
  reporterContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface PiiScrubMetadata {
  scrubbed: boolean;
  redactedCount: number;
  redactedCategories: string[];
  method: 'gemini-and-regex' | 'regex';
  scrubbedAt: string;
}

export type EmailDispatchStatus = 'sent' | 'pending_smtp' | 'failed';

export interface VendorEmailDispatch {
  vendor: string;
  recipient: string;
  subject: string;
  body: string;
  status: EmailDispatchStatus;
  sentAt?: string;
  messageId?: string;
  error?: string;
}

export interface IssueReport extends IssueReportSubmission {
  id: string; // e.g. "RPT-2026-9281"
  trackingCode: string;
  createdAt: string; // ISO string
  updatedAt: string;
  status: ReportStatus;
  internalNotes?: string;
  operatorNotificationSent?: boolean;
  piiScrubbing?: PiiScrubMetadata;
  emailDispatch?: VendorEmailDispatch;
}
