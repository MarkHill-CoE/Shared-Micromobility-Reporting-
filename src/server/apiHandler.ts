import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  getAllReports,
  saveNewReport,
  updateReport,
  deleteReport,
  generateCsvExport,
} from './storage.ts';
import type { IssueReportSubmission, IssueReport } from '../types/report.ts';
import { scrubPiiText } from './piiScrubber.ts';
import { dispatchVendorEmail } from './emailService.ts';
import {
  JURISDICTION_ID,
  SERVICE_CODE,
  getServicesListJson,
  getServicesListXml,
  getServiceDefinitionJson,
  getServiceDefinitionXml,
  mapReportToOpen311Json,
  getServiceRequestsXml,
  getSingleServiceRequestXml,
  getPostRequestSuccessJson,
  getPostRequestSuccessXml,
  getOpen311ErrorXml,
  getServiceDiscoveryJson,
  getServiceDiscoveryXml,
  mapToOpen311Status,
} from './open311.ts';

async function processAndStoreReport(rawSubmission: IssueReportSubmission): Promise<IssueReport> {
  const descScrub = await scrubPiiText(rawSubmission.issueDescription);
  let otherText = rawSubmission.issueTypes?.otherText;
  let totalRedactions = descScrub.metadata.redactedCount;
  const combinedCategories = new Set(descScrub.metadata.redactedCategories);
  let wasScrubbed = descScrub.metadata.scrubbed;
  let method = descScrub.metadata.method;

  if (rawSubmission.issueTypes?.other && otherText && otherText.trim().length > 0) {
    const otherScrub = await scrubPiiText(otherText);
    otherText = otherScrub.scrubbedText;
    totalRedactions += otherScrub.metadata.redactedCount;
    otherScrub.metadata.redactedCategories.forEach((c) => combinedCategories.add(c));
    if (otherScrub.metadata.scrubbed) wasScrubbed = true;
    if (otherScrub.metadata.method === 'gemini-and-regex') method = 'gemini-and-regex';
  }

  const sanitizedSubmission: IssueReportSubmission & Partial<Pick<IssueReport, 'piiScrubbing'>> = {
    ...rawSubmission,
    issueDescription: descScrub.scrubbedText,
    issueTypes: {
      ...rawSubmission.issueTypes,
      otherText,
    },
    piiScrubbing: {
      scrubbed: wasScrubbed,
      redactedCount: totalRedactions,
      redactedCategories: Array.from(combinedCategories),
      method,
      scrubbedAt: descScrub.metadata.scrubbedAt,
    },
  };

  const created = saveNewReport(sanitizedSubmission);
  const emailDispatch = await dispatchVendorEmail(created);

  const dispatchNote =
    emailDispatch.status === 'sent'
      ? `Automated vendor email sent to ${emailDispatch.recipient} (${emailDispatch.vendor}).`
      : `Vendor email prepared for ${emailDispatch.recipient} (${emailDispatch.vendor}) — status: ${emailDispatch.status}.`;

  const updated = updateReport(created.id, {
    emailDispatch,
    operatorNotificationSent: emailDispatch.status === 'sent',
    status: emailDispatch.status === 'sent' ? 'Dispatched to Operator' : 'Submitted',
    internalNotes: dispatchNote,
  });

  return updated || { ...created, emailDispatch };
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 15 * 1024 * 1024) {
        reject(new Error('Payload too large (max 15MB)'));
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

async function readJsonBody(req: IncomingMessage): Promise<any> {
  const raw = await readBody(req);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    // If sent as form urlencoded
    const params = new URLSearchParams(raw);
    const obj: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
      obj[key] = value;
    }
    return obj;
  }
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(JSON.stringify(data, null, 2));
}

function sendXml(res: ServerResponse, statusCode: number, xmlString: string) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'text/xml; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.end(xmlString);
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next?: () => void
): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  const origin = `${url.protocol}//${url.host}`;

  // CORS and framing headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  // -------------------------------------------------------------------------
  // 1. OPEN311 DISCOVERY ENDPOINTS
  // -------------------------------------------------------------------------
  if (pathname === '/open311/discovery.xml') {
    sendXml(res, 200, getServiceDiscoveryXml(origin));
    return true;
  }
  if (pathname === '/open311/discovery.json' || pathname === '/open311/discovery') {
    sendJson(res, 200, getServiceDiscoveryJson(origin));
    return true;
  }

  // -------------------------------------------------------------------------
  // 2. OPEN311 GEOREPORT V2 SERVICES LIST
  // GET /open311/v2/services.xml OR /open311/v2/services.json
  // -------------------------------------------------------------------------
  if (pathname === '/open311/v2/services.xml') {
    sendXml(res, 200, getServicesListXml());
    return true;
  }
  if (pathname === '/open311/v2/services.json' || pathname === '/open311/v2/services') {
    if (req.headers.accept?.includes('application/xml') || req.headers.accept?.includes('text/xml')) {
      sendXml(res, 200, getServicesListXml());
    } else {
      sendJson(res, 200, getServicesListJson());
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // 3. OPEN311 GEOREPORT V2 SERVICE DEFINITION
  // GET /open311/v2/services/{service_code}.xml OR .json
  // -------------------------------------------------------------------------
  const serviceDefMatch = pathname.match(/^\/open311\/v2\/services\/([^/.]+)(\.(xml|json))?$/);
  if (serviceDefMatch) {
    const requestedCode = serviceDefMatch[1];
    const format = serviceDefMatch[3] || (req.headers.accept?.includes('text/xml') ? 'xml' : 'json');

    if (requestedCode !== SERVICE_CODE && requestedCode !== 'all') {
      if (format === 'xml') {
        sendXml(res, 404, getOpen311ErrorXml(404, `service_code '${requestedCode}' not found.`));
      } else {
        sendJson(res, 404, [{ code: 404, description: `service_code '${requestedCode}' not found.` }]);
      }
      return true;
    }

    if (format === 'xml') {
      sendXml(res, 200, getServiceDefinitionXml());
    } else {
      sendJson(res, 200, getServiceDefinitionJson());
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // 4. OPEN311 GEOREPORT V2 SERVICE REQUESTS (GET / POST)
  // -------------------------------------------------------------------------

  // POST /open311/v2/requests.xml or requests.json
  if (pathname.match(/^\/open311\/v2\/requests(\.(xml|json))?$/) && req.method === 'POST') {
    const isXml = pathname.endsWith('.xml') || req.headers.accept?.includes('text/xml');
    try {
      const rawBody = await readBody(req);
      let parsed: Record<string, any> = {};

      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        parsed = JSON.parse(rawBody);
      } else {
        const params = new URLSearchParams(rawBody);
        for (const [k, v] of params.entries()) {
          parsed[k] = v;
        }
      }

      // Check required location parameter
      const lat = parsed.lat ? parseFloat(parsed.lat) : undefined;
      const long = parsed.long ? parseFloat(parsed.long) : undefined;
      const addressString = parsed.address_string || parsed.address || '';

      if ((lat === undefined || long === undefined) && !addressString.trim()) {
        const err = 'Location parameter missing: Must provide (lat and long) or address_string.';
        if (isXml) sendXml(res, 400, getOpen311ErrorXml(400, err));
        else sendJson(res, 400, [{ code: 400, description: err }]);
        return true;
      }

      // Parse attribute values if provided
      let improperParking = false;
      let damageMalfunction = false;
      let safetyConcerns = false;
      let other = false;
      let otherText = '';
      let identifyingColours = 'Lime - White and Green E-Scooters and E-Bikes';
      let vehicleIdNumber = '';

      // Check form attributes
      for (const [key, val] of Object.entries(parsed)) {
        if (key.includes('issue_type') || key === 'attribute[issue_types]') {
          const v = String(val).toLowerCase();
          if (v.includes('parking')) improperParking = true;
          if (v.includes('damage') || v.includes('malfunction')) damageMalfunction = true;
          if (v.includes('safety')) safetyConcerns = true;
          if (v.includes('other')) other = true;
        }
        if (key.includes('vehicle_brand') || key === 'attribute[vehicle_brand]') {
          const v = String(val).toLowerCase();
          if (v.includes('bird')) identifyingColours = 'Bird - Blue or Black E-Scooters and Blue and Black E-Bikes';
          else if (v.includes('lime')) identifyingColours = 'Lime - White and Green E-Scooters and E-Bikes';
          else if (v.includes('private')) identifyingColours = 'Private E-Scooter or E-Bike';
        }
        if (key.includes('vehicle_id') || key === 'attribute[vehicle_id]') {
          vehicleIdNumber = String(val);
        }
        if (key.includes('other_issue_detail') || key === 'attribute[other_issue_detail]') {
          otherText = String(val);
        }
      }

      // If no issue type was flagged from attributes, default to improperParking or description keywords
      if (!improperParking && !damageMalfunction && !safetyConcerns && !other) {
        improperParking = true;
      }

      const submission: IssueReportSubmission = {
        issueTypes: {
          improperParking,
          damageMalfunction,
          safetyConcerns,
          other,
          otherText,
        },
        issueDescription: parsed.description || 'Rental micromobility equipment issue reported via Open311 intake.',
        incidentDate: parsed.incident_date || new Date().toISOString().slice(0, 10),
        incidentTime: parsed.incident_time || '12:00',
        locationDetails: addressString || `GPS (${lat}, ${long})`,
        gpsCoordinates: lat !== undefined && long !== undefined ? { latitude: lat, longitude: long } : undefined,
        identifyingColours,
        vehicleIdNumber,
        attachment: parsed.media_url ? { name: 'attached_media', type: 'image/jpeg', size: 1024, dataUrl: parsed.media_url } : null,
      };

      const saved = await processAndStoreReport(submission);

      if (isXml) {
        sendXml(res, 201, getPostRequestSuccessXml(saved));
      } else {
        sendJson(res, 201, getPostRequestSuccessJson(saved));
      }
      return true;
    } catch (err: any) {
      if (isXml) sendXml(res, 500, getOpen311ErrorXml(500, err.message));
      else sendJson(res, 500, [{ code: 500, description: err.message }]);
      return true;
    }
  }

  // GET /open311/v2/requests.xml or requests.json (List query)
  if (pathname.match(/^\/open311\/v2\/requests(\.(xml|json))?$/) && req.method === 'GET') {
    const isXml = pathname.endsWith('.xml') || req.headers.accept?.includes('text/xml');
    let reports = getAllReports();

    const serviceRequestIdParam = url.searchParams.get('service_request_id');
    const statusParam = url.searchParams.get('status');
    const startDateParam = url.searchParams.get('start_date');
    const endDateParam = url.searchParams.get('end_date');

    if (serviceRequestIdParam) {
      const ids = serviceRequestIdParam.split(',').map((s) => s.trim().toLowerCase());
      reports = reports.filter(
        (r) => ids.includes(r.id.toLowerCase()) || ids.includes(r.trackingCode.toLowerCase())
      );
    } else {
      if (statusParam) {
        reports = reports.filter((r) => mapToOpen311Status(r.status) === statusParam.toLowerCase());
      }
      if (startDateParam) {
        const start = new Date(startDateParam).getTime();
        reports = reports.filter((r) => new Date(r.createdAt).getTime() >= start);
      }
      if (endDateParam) {
        const end = new Date(endDateParam).getTime();
        reports = reports.filter((r) => new Date(r.createdAt).getTime() <= end);
      }
    }

    if (isXml) {
      sendXml(res, 200, getServiceRequestsXml(reports));
    } else {
      sendJson(res, 200, reports.map(mapReportToOpen311Json));
    }
    return true;
  }

  // GET /open311/v2/requests/{service_request_id}.xml or .json
  const singleRequestMatch = pathname.match(/^\/open311\/v2\/requests\/([^/.]+)(\.(xml|json))?$/);
  if (singleRequestMatch && req.method === 'GET') {
    const id = decodeURIComponent(singleRequestMatch[1]);
    const isXml = singleRequestMatch[3] === 'xml' || req.headers.accept?.includes('text/xml');

    const reports = getAllReports();
    const report = reports.find((r) => r.id === id || r.trackingCode === id);

    if (!report) {
      if (isXml) {
        sendXml(res, 404, getOpen311ErrorXml(404, `service_request_id '${id}' not found.`));
      } else {
        sendJson(res, 404, [{ code: 404, description: `service_request_id '${id}' not found.` }]);
      }
      return true;
    }

    if (isXml) {
      sendXml(res, 200, getSingleServiceRequestXml(report));
    } else {
      sendJson(res, 200, [mapReportToOpen311Json(report)]);
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // 5. INTERNAL APPLICATION API ROUTES (/api/*)
  // -------------------------------------------------------------------------

  if (pathname === '/api/health') {
    const reports = getAllReports();
    sendJson(res, 200, {
      status: 'healthy',
      service: 'rental-escooter-issue-reporting',
      jurisdiction_id: JURISDICTION_ID,
      open311_service_code: SERVICE_CODE,
      open311_endpoints: {
        discovery_xml: '/open311/discovery.xml',
        discovery_json: '/open311/discovery.json',
        services_xml: '/open311/v2/services.xml',
        services_json: '/open311/v2/services.json',
        service_definition_xml: `/open311/v2/services/${SERVICE_CODE}.xml`,
        service_definition_json: `/open311/v2/services/${SERVICE_CODE}.json`,
        requests_xml: '/open311/v2/requests.xml',
        requests_json: '/open311/v2/requests.json',
      },
      storedIn: 'GCP persistent storage (/data/reports.json)',
      totalReports: reports.length,
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // GET /api/open311/report/:id -> returns both JSON and XML representations for in-browser inspector
  const open311InspectorMatch = pathname.match(/^\/api\/open311\/report\/([^/]+)$/);
  if (open311InspectorMatch && req.method === 'GET') {
    const id = decodeURIComponent(open311InspectorMatch[1]);
    const reports = getAllReports();
    const report = reports.find((r) => r.id === id || r.trackingCode === id);

    if (!report) {
      sendJson(res, 404, { success: false, error: 'Report not found' });
      return true;
    }

    sendJson(res, 200, {
      success: true,
      report,
      open311_json: [mapReportToOpen311Json(report)],
      open311_xml: getSingleServiceRequestXml(report),
      open311_service_definition_xml: getServiceDefinitionXml(),
      open311_service_definition_json: getServiceDefinitionJson(),
      endpoints: {
        request_xml: `/open311/v2/requests/${report.trackingCode || report.id}.xml`,
        request_json: `/open311/v2/requests/${report.trackingCode || report.id}.json`,
      },
    });
    return true;
  }

  // GET /api/export
  if (pathname === '/api/export') {
    const format = url.searchParams.get('format') || 'csv';
    const reports = getAllReports();
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="escooter-reports-${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.end(JSON.stringify(reports, null, 2));
      return true;
    } else if (format === 'open311-json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="open311-georeport-v2-${new Date().toISOString().slice(0, 10)}.json"`
      );
      res.end(JSON.stringify(reports.map(mapReportToOpen311Json), null, 2));
      return true;
    } else if (format === 'open311-xml') {
      res.setHeader('Content-Type', 'text/xml; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="open311-georeport-v2-${new Date().toISOString().slice(0, 10)}.xml"`
      );
      res.end(getServiceRequestsXml(reports));
      return true;
    } else {
      const csv = generateCsvExport();
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="escooter-reports-${new Date().toISOString().slice(0, 10)}.csv"`
      );
      res.end(csv);
      return true;
    }
  }

  // GET /api/reports
  if (pathname === '/api/reports' && req.method === 'GET') {
    let reports = getAllReports();
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const operator = url.searchParams.get('operator');

    if (status && status !== 'all') {
      reports = reports.filter((r) => r.status.toLowerCase() === status.toLowerCase());
    }
    if (operator && operator !== 'all') {
      reports = reports.filter((r) =>
        r.identifyingColours.toLowerCase().includes(operator.toLowerCase())
      );
    }
    if (search) {
      const q = search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.trackingCode.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.locationDetails.toLowerCase().includes(q) ||
          r.vehicleIdNumber.toLowerCase().includes(q) ||
          r.issueDescription.toLowerCase().includes(q)
      );
    }

    sendJson(res, 200, {
      success: true,
      count: reports.length,
      reports,
    });
    return true;
  }

  // POST /api/reports
  if (pathname === '/api/reports' && req.method === 'POST') {
    const body = (await readJsonBody(req)) as IssueReportSubmission;

    if (!body.issueDescription || body.issueDescription.trim().length === 0) {
      sendJson(res, 400, {
        success: false,
        error: 'Issue description is required.',
      });
      return true;
    }

    if (!body.incidentDate) {
      sendJson(res, 400, {
        success: false,
        error: 'Incident date is required.',
      });
      return true;
    }

    if (!body.locationDetails || body.locationDetails.trim().length === 0) {
      sendJson(res, 400, {
        success: false,
        error: 'Location details are required.',
      });
      return true;
    }

    if (!body.identifyingColours) {
      sendJson(res, 400, {
        success: false,
        error: 'Identifying colours/operator selection is required.',
      });
      return true;
    }

    const created = await processAndStoreReport(body);
    sendJson(res, 201, {
      success: true,
      message: 'Report scrubbed for PII, stored in GCP persistent storage, and vendor email dispatch processed.',
      report: created,
      open311_service_request_id: created.trackingCode,
    });
    return true;
  }

  // POST /api/reports/:id/notify (Retry / trigger vendor email dispatch)
  const notifyMatch = pathname.match(/^\/api\/reports\/([^/]+)\/notify$/);
  if (notifyMatch && req.method === 'POST') {
    const id = decodeURIComponent(notifyMatch[1]);
    const reports = getAllReports();
    const report = reports.find((r) => r.id === id || r.trackingCode === id);

    if (!report) {
      sendJson(res, 404, { success: false, error: 'Report not found' });
      return true;
    }

    const emailDispatch = await dispatchVendorEmail(report);
    const updated = updateReport(report.id, {
      emailDispatch,
      operatorNotificationSent: emailDispatch.status === 'sent',
      status: emailDispatch.status === 'sent' ? 'Dispatched to Operator' : report.status,
    });

    sendJson(res, 200, {
      success: true,
      report: updated || { ...report, emailDispatch },
      emailDispatch,
    });
    return true;
  }

  // Individual report /api/reports/:id
  const reportMatch = pathname.match(/^\/api\/reports\/([^/]+)$/);
  if (reportMatch) {
    const id = decodeURIComponent(reportMatch[1]);
    const reports = getAllReports();
    const report = reports.find((r) => r.id === id || r.trackingCode === id);

    if (req.method === 'GET') {
      if (!report) {
        sendJson(res, 404, { success: false, error: 'Report not found' });
        return true;
      }
      sendJson(res, 200, {
        success: true,
        report,
        open311: mapReportToOpen311Json(report),
      });
      return true;
    }

    if (req.method === 'PATCH') {
      const updates = await readJsonBody(req);
      const updated = updateReport(id, updates);
      if (!updated) {
        sendJson(res, 404, { success: false, error: 'Report not found to update' });
        return true;
      }
      sendJson(res, 200, { success: true, report: updated });
      return true;
    }

    if (req.method === 'DELETE') {
      const deleted = deleteReport(id);
      if (!deleted) {
        sendJson(res, 404, { success: false, error: 'Report not found to delete' });
        return true;
      }
      sendJson(res, 200, { success: true, message: 'Report removed' });
      return true;
    }
  }

  if (pathname.startsWith('/api/') || pathname.startsWith('/open311/')) {
    sendJson(res, 404, { success: false, error: 'API or Open311 endpoint not found' });
    return true;
  }

  return false;
}
