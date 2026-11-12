import fs from 'node:fs';
import path from 'node:path';
import type { IssueReport, IssueReportSubmission } from '../types/report.ts';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

function ensureDataFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    // Seed initial realistic reports for City Mobility operations
    const initialSeed: IssueReport[] = [
      {
        id: 'RPT-2026-1042',
        trackingCode: 'EDM-ESC-1042',
        createdAt: '2026-11-04T14:32:00.000Z',
        updatedAt: '2026-11-04T15:10:00.000Z',
        status: 'Dispatched to Operator',
        issueTypes: {
          improperParking: true,
          damageMalfunction: false,
          safetyConcerns: true,
          other: false,
        },
        issueDescription:
          'Two e-scooters are left directly across the curb ramp at the pedestrian crosswalk, obstructing wheelchair and stroller accessibility.',
        incidentDate: '2026-11-04',
        incidentTime: '14:15',
        locationDetails: 'Corner of 104 St NW & Jasper Ave, southwest crosswalk ramp',
        gpsCoordinates: {
          latitude: 53.5411,
          longitude: -113.4989,
          accuracy: 8,
        },
        identifyingColours: 'Lime - White and Green E-Scooters and E-Bikes',
        vehicleIdNumber: 'LM-94821',
        internalNotes: 'Dispatched notification ticket to Lime Operations team for 2-hour priority relocation SLA.',
        operatorNotificationSent: true,
      },
      {
        id: 'RPT-2026-1039',
        trackingCode: 'EDM-ESC-1039',
        createdAt: '2026-11-04T09:12:00.000Z',
        updatedAt: '2026-11-04T11:45:00.000Z',
        status: 'Under Review',
        issueTypes: {
          improperParking: false,
          damageMalfunction: true,
          safetyConcerns: false,
          other: false,
        },
        issueDescription:
          'E-bike has a collapsed kickstand and damaged front handlebar grip. Parked against bike rack but leans dangerously.',
        incidentDate: '2026-11-04',
        incidentTime: '08:50',
        locationDetails: 'Near Churchill LRT Station entrance, 99 St NW',
        identifyingColours: 'Bird - Blue or Black E-Scooters and Blue and Black E-Bikes',
        vehicleIdNumber: 'BRD-44109',
        internalNotes: 'Maintenance flagged for damaged handlebar assembly.',
        operatorNotificationSent: true,
      },
      {
        id: 'RPT-2026-1025',
        trackingCode: 'EDM-ESC-1025',
        createdAt: '2026-11-03T18:22:00.000Z',
        updatedAt: '2026-11-03T20:00:00.000Z',
        status: 'Resolved',
        issueTypes: {
          improperParking: true,
          damageMalfunction: false,
          safetyConcerns: false,
          other: false,
        },
        issueDescription:
          'E-scooter left tipped over in middle of shared bike pathway.',
        incidentDate: '2026-11-03',
        incidentTime: '18:10',
        locationDetails: '102 Ave bike lane near 107 St NW',
        identifyingColours: 'Lime - White and Green E-Scooters and E-Bikes',
        vehicleIdNumber: 'LM-31200',
        internalNotes: 'Operator street team verified repositioning to designated corral at 19:40.',
        operatorNotificationSent: true,
      },
    ];

    fs.writeFileSync(DATA_FILE, JSON.stringify(initialSeed, null, 2), 'utf-8');
  }
}

export function getAllReports(): IssueReport[] {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed: IssueReport[] = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read reports data file:', err);
    return [];
  }
}

export function saveNewReport(
  submission: IssueReportSubmission & Partial<Pick<IssueReport, 'piiScrubbing'>>
): IssueReport {
  ensureDataFile();
  const reports = getAllReports();
  
  const serial = Math.floor(1000 + Math.random() * 9000);
  const timestamp = new Date().toISOString();
  const id = `RPT-2026-${serial}`;
  const trackingCode = `EDM-ESC-${serial}`;

  const newReport: IssueReport = {
    ...submission,
    id,
    trackingCode,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: 'Submitted',
    operatorNotificationSent: false,
  };

  reports.unshift(newReport);
  fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  return newReport;
}

export function updateReport(id: string, updates: Partial<IssueReport>): IssueReport | null {
  ensureDataFile();
  const reports = getAllReports();
  const index = reports.findIndex((r) => r.id === id || r.trackingCode === id);
  if (index === -1) return null;

  const existing = reports[index];
  const updated: IssueReport = {
    ...existing,
    ...updates,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };

  reports[index] = updated;
  fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  return updated;
}

export function deleteReport(id: string): boolean {
  ensureDataFile();
  const reports = getAllReports();
  const filtered = reports.filter((r) => r.id !== id);
  if (filtered.length === reports.length) return false;

  fs.writeFileSync(DATA_FILE, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}

export function generateCsvExport(): string {
  const reports = getAllReports();
  const headers = [
    'Report ID',
    'Tracking Code',
    'Created At',
    'Status',
    'Incident Date',
    'Incident Time',
    'Location',
    'Operator / Colours',
    'Vehicle ID',
    'Improper Parking',
    'Damage / Malfunction',
    'Safety Concerns',
    'Other Issue',
    'Other Details',
    'Description',
    'Has Photo/Video',
  ];

  const rows = reports.map((r) => [
    `"${r.id}"`,
    `"${r.trackingCode}"`,
    `"${r.createdAt}"`,
    `"${r.status}"`,
    `"${r.incidentDate}"`,
    `"${r.incidentTime}"`,
    `"${(r.locationDetails || '').replace(/"/g, '""')}"`,
    `"${(r.identifyingColours || '').replace(/"/g, '""')}"`,
    `"${(r.vehicleIdNumber || '').replace(/"/g, '""')}"`,
    r.issueTypes?.improperParking ? 'Yes' : 'No',
    r.issueTypes?.damageMalfunction ? 'Yes' : 'No',
    r.issueTypes?.safetyConcerns ? 'Yes' : 'No',
    r.issueTypes?.other ? 'Yes' : 'No',
    `"${(r.issueTypes?.otherText || '').replace(/"/g, '""')}"`,
    `"${(r.issueDescription || '').replace(/"/g, '""')}"`,
    r.attachment ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
