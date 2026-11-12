/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Open311 GeoReport v2 Schema Definitions, Mappings, and Serializers
 * Strictly adheres to Open311 GeoReport v2 API specification (XML & JSON)
 */

import type { IssueReport, IssueReportSubmission } from '../types/report.ts';

export const JURISDICTION_ID = 'edmonton.ca';
export const SERVICE_CODE = 'micromobility-hazard';
export const SERVICE_NAME = 'Rental E-Scooter or E-Bike Issue Reporting';
export const SERVICE_DESCRIPTION =
  'By completing this form you help ensure that rental e-bikes and e-scooters are safely managed and properly maintained.';
export const SERVICE_GROUP = 'shared-micromobility';
export const AGENCY_RESPONSIBLE = 'City of Edmonton Mobility Services';

/**
 * Escapes special XML characters
 */
export function escapeXml(str: string | number | boolean | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Normalizes ISO date string to W3 subset of ISO 8601 with timezone (required by Open311 spec)
 */
export function formatOpen311DateTime(isoString?: string): string {
  if (!isoString) return new Date().toISOString();
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return new Date().toISOString();
    return d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Maps application report status to Open311 standard ('open' | 'closed')
 */
export function mapToOpen311Status(status: string): 'open' | 'closed' {
  const s = (status || '').toLowerCase();
  if (s === 'resolved' || s === 'closed') {
    return 'closed';
  }
  return 'open';
}

/**
 * Converts internal VehicleColourOption to Open311 attribute value key
 */
export function getVehicleBrandKey(colours: string): string {
  const c = colours.toLowerCase();
  if (c.includes('bird')) return 'bird';
  if (c.includes('lime')) return 'lime';
  if (c.includes('private')) return 'private';
  return 'other';
}

/**
 * Extracts active issue type keys from IssueTypeSelection
 */
export function getIssueTypeKeys(issueTypes: IssueReport['issueTypes']): string[] {
  const keys: string[] = [];
  if (issueTypes?.improperParking) keys.push('improper_parking');
  if (issueTypes?.damageMalfunction) keys.push('damage_malfunction');
  if (issueTypes?.safetyConcerns) keys.push('safety_concerns');
  if (issueTypes?.other) keys.push('other');
  return keys;
}

/**
 * Open311 Service Definition metadata
 */
export const OPEN311_SERVICE = {
  service_code: SERVICE_CODE,
  service_name: SERVICE_NAME,
  description: SERVICE_DESCRIPTION,
  metadata: true,
  type: 'realtime' as const,
  keywords: 'escooter, ebike, micromobility, bird, lime, parking, obstruction, hazard, sidewalk, barrier, vandalism',
  group: SERVICE_GROUP,
};

/**
 * Custom Service Attributes Definition
 */
export const OPEN311_ATTRIBUTES = [
  {
    variable: true,
    code: 'issue_types',
    datatype: 'multivaluelist',
    required: true,
    datatype_description: 'Select all issues that apply to this equipment',
    order: 1,
    description: 'Type of issue',
    values: [
      {
        key: 'improper_parking',
        name: 'Improper Parking: E-scooters or e-bikes blocking sidewalks, ramps, or other critical areas.',
      },
      {
        key: 'damage_malfunction',
        name: 'Damage or Malfunction: Broken, damaged, or malfunctioning equipment.',
      },
      {
        key: 'safety_concerns',
        name: 'Safety Concerns: Unsafe riding, illegal use, or any issue that could affect public safety.',
      },
      {
        key: 'other',
        name: 'Other',
      },
    ],
  },
  {
    variable: true,
    code: 'other_issue_detail',
    datatype: 'string',
    required: false,
    datatype_description: 'Brief explanation if Other was checked',
    order: 2,
    description: 'Other issue details',
  },
  {
    variable: true,
    code: 'incident_time',
    datatype: 'datetime',
    required: true,
    datatype_description: 'Date and time the incident or hazard was observed (ISO 8601)',
    order: 3,
    description: 'Incident Date and Time',
  },
  {
    variable: true,
    code: 'vehicle_brand',
    datatype: 'singlevaluelist',
    required: true,
    datatype_description: 'Identifying operator colours of the vehicle',
    order: 4,
    description: 'Identifying colours',
    values: [
      {
        key: 'bird',
        name: 'Bird - Blue or Black E-Scooters and Blue and Black E-Bikes',
      },
      {
        key: 'lime',
        name: 'Lime - White and Green E-Scooters and E-Bikes',
      },
      {
        key: 'private',
        name: 'Private E-Scooter or E-Bike',
      },
      {
        key: 'other',
        name: 'Other / Unidentified',
      },
    ],
  },
  {
    variable: true,
    code: 'vehicle_id',
    datatype: 'string',
    required: false,
    datatype_description: 'Large alphanumeric characters found on frame/stem/fender',
    order: 5,
    description: 'Vehicle identification number',
  },
];

/**
 * Maps a single stored report to an Open311 JSON request object
 */
export function mapReportToOpen311Json(report: IssueReport) {
  const issueKeys = getIssueTypeKeys(report.issueTypes);
  const brandKey = getVehicleBrandKey(report.identifyingColours);

  const attributes = [
    {
      code: 'issue_types',
      values: issueKeys,
    },
    {
      code: 'identifying_colours',
      value: brandKey,
    },
    {
      code: 'vehicle_id_number',
      value: report.vehicleIdNumber || '',
    },
    {
      code: 'incident_datetime',
      value: `${report.incidentDate}T${report.incidentTime || '00:00'}:00Z`,
    },
  ];

  if (report.issueTypes?.other && report.issueTypes?.otherText) {
    attributes.push({
      code: 'other_issue_detail',
      value: report.issueTypes.otherText,
    });
  }

  return {
    service_request_id: report.trackingCode || report.id,
    status: mapToOpen311Status(report.status),
    status_notes: report.internalNotes || `Internal status: ${report.status}`,
    service_name: SERVICE_NAME,
    service_code: SERVICE_CODE,
    description: report.issueDescription,
    agency_responsible: AGENCY_RESPONSIBLE,
    service_notice: 'Forwarded to designated micromobility vendor street team for resolution SLA.',
    requested_datetime: formatOpen311DateTime(report.createdAt),
    updated_datetime: formatOpen311DateTime(report.updatedAt),
    expected_datetime: null,
    address: report.locationDetails,
    address_id: null,
    zipcode: null,
    lat: report.gpsCoordinates ? report.gpsCoordinates.latitude : null,
    long: report.gpsCoordinates ? report.gpsCoordinates.longitude : null,
    media_url: report.attachment?.dataUrl ? report.attachment.dataUrl : null,
    attributes,
  };
}

/**
 * Generates Open311 Services List in JSON format
 */
export function getServicesListJson() {
  return [
    {
      service_code: OPEN311_SERVICE.service_code,
      service_name: OPEN311_SERVICE.service_name,
      description: OPEN311_SERVICE.description,
      metadata: OPEN311_SERVICE.metadata,
      type: OPEN311_SERVICE.type,
      keywords: OPEN311_SERVICE.keywords,
      group: OPEN311_SERVICE.group,
    },
  ];
}

/**
 * Generates Open311 Services List in XML format
 */
export function getServicesListXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<services>
  <service>
    <service_code>${escapeXml(OPEN311_SERVICE.service_code)}</service_code>
    <service_name>${escapeXml(OPEN311_SERVICE.service_name)}</service_name>
    <description>${escapeXml(OPEN311_SERVICE.description)}</description>
    <metadata>${OPEN311_SERVICE.metadata}</metadata>
    <type>${OPEN311_SERVICE.type}</type>
    <keywords>${escapeXml(OPEN311_SERVICE.keywords)}</keywords>
    <group>${escapeXml(OPEN311_SERVICE.group)}</group>
  </service>
</services>`;
}

/**
 * Generates Open311 Service Definition in JSON format
 */
export function getServiceDefinitionJson() {
  return {
    service_code: SERVICE_CODE,
    attributes: OPEN311_ATTRIBUTES,
  };
}

/**
 * Generates Open311 Service Definition in XML format
 */
export function getServiceDefinitionXml(): string {
  const attrsXml = OPEN311_ATTRIBUTES.map((attr) => {
    let valuesXml = '';
    if (attr.values && attr.values.length > 0) {
      valuesXml = `
      <values>
        ${attr.values
          .map(
            (v) => `
        <value>
          <key>${escapeXml(v.key)}</key>
          <name>${escapeXml(v.name)}</name>
        </value>`
          )
          .join('')}
      </values>`;
    }

    return `
    <attribute>
      <variable>${attr.variable}</variable>
      <code >${escapeXml(attr.code)}</code>
      <datatype>${escapeXml(attr.datatype)}</datatype>
      <required>${attr.required}</required>
      <datatype_description>${escapeXml(attr.datatype_description)}</datatype_description>
      <order>${attr.order}</order>
      <description>${escapeXml(attr.description)}</description>${valuesXml}
    </attribute>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<service_definition>
  <service_code>${escapeXml(SERVICE_CODE)}</service_code>
  <attributes>${attrsXml}
  </attributes>
</service_definition>`;
}

/**
 * Serializes a single report to Open311 <request> XML node
 */
function serializeSingleRequestXml(report: IssueReport): string {
  const open311 = mapReportToOpen311Json(report);

  const attributesXml = open311.attributes
    .map((attr) => {
      if ('values' in attr && Array.isArray(attr.values)) {
        return `
        <attribute>
          <code>${escapeXml(attr.code)}</code>
          <values>${attr.values.map((v) => `<value>${escapeXml(v)}</value>`).join('')}</values>
        </attribute>`;
      }
      return `
      <attribute>
        <code>${escapeXml(attr.code)}</code>
        <value>${escapeXml((attr as any).value)}</value>
      </attribute>`;
    })
    .join('');

  return `
  <request>
    <service_request_id>${escapeXml(open311.service_request_id)}</service_request_id>
    <status>${escapeXml(open311.status)}</status>
    <status_notes>${escapeXml(open311.status_notes)}</status_notes>
    <service_name>${escapeXml(open311.service_name)}</service_name>
    <service_code>${escapeXml(open311.service_code)}</service_code>
    <description>${escapeXml(open311.description)}</description>
    <agency_responsible>${escapeXml(open311.agency_responsible)}</agency_responsible>
    <service_notice>${escapeXml(open311.service_notice)}</service_notice>
    <requested_datetime>${escapeXml(open311.requested_datetime)}</requested_datetime>
    <updated_datetime>${escapeXml(open311.updated_datetime)}</updated_datetime>
    <expected_datetime/>
    <address>${escapeXml(open311.address)}</address>
    <address_id/>
    <zipcode/>
    <lat>${open311.lat !== null ? open311.lat : ''}</lat>
    <long>${open311.long !== null ? open311.long : ''}</long>
    <media_url>${escapeXml(open311.media_url)}</media_url>
    <attributes>${attributesXml}
    </attributes>
  </request>`;
}

/**
 * Generates Open311 Service Requests list in XML format
 */
export function getServiceRequestsXml(reports: IssueReport[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<service_requests>${reports.map((r) => serializeSingleRequestXml(r)).join('')}
</service_requests>`;
}

/**
 * Generates Open311 single Service Request in XML format
 */
export function getSingleServiceRequestXml(report: IssueReport): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<service_requests>${serializeSingleRequestXml(report)}
</service_requests>`;
}

/**
 * Generates Open311 POST Request success response in XML format
 */
export function getPostRequestSuccessXml(report: IssueReport): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<service_requests>
  <request>
    <service_request_id>${escapeXml(report.trackingCode || report.id)}</service_request_id>
    <token/>
    <service_notice>Request received and stored in persistent GCP municipal storage.</service_notice>
    <account_id/>
  </request>
</service_requests>`;
}

/**
 * Generates Open311 POST Request success response in JSON format
 */
export function getPostRequestSuccessJson(report: IssueReport) {
  return [
    {
      service_request_id: report.trackingCode || report.id,
      token: null,
      service_notice: 'Request received and stored in persistent GCP municipal storage.',
      account_id: null,
    },
  ];
}

/**
 * Generates Open311 Error Response in XML format
 */
export function getOpen311ErrorXml(code: number, description: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<errors>
  <error>
    <code>${code}</code>
    <description>${escapeXml(description)}</description>
  </error>
</errors>`;
}

/**
 * Generates Open311 Service Discovery in XML format
 */
export function getServiceDiscoveryXml(origin: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<discovery>
  <changeset>2026-11-05T00:00:00Z</changeset>
  <contact>Mark Hill &lt;mark.hill@edmonton.ca&gt;</contact>
  <key_service>No API key required for GET queries; required for third-party automated POST</key_service>
  <endpoints>
    <endpoint>
      <specification>http://wiki.open311.org/GeoReport_v2</specification>
      <url>${escapeXml(origin)}/open311/v2</url>
      <changeset>2026-11-05T00:00:00Z</changeset>
      <type>production</type>
      <formats>
        <format>text/xml</format>
        <format>application/json</format>
      </formats>
    </endpoint>
  </endpoints>
</discovery>`;
}

/**
 * Generates Open311 Service Discovery in JSON format
 */
export function getServiceDiscoveryJson(origin: string) {
  return {
    changeset: '2026-11-05T00:00:00Z',
    contact: 'Mark Hill <mark.hill@edmonton.ca>',
    key_service: 'No API key required for GET queries; required for third-party automated POST',
    endpoints: [
      {
        specification: 'http://wiki.open311.org/GeoReport_v2',
        url: `${origin}/open311/v2`,
        changeset: '2026-11-05T00:00:00Z',
        type: 'production',
        formats: ['text/xml', 'application/json'],
      },
    ],
  };
}
