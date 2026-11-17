/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Open311 GeoReport v2 -> SAP CRM Service Request (BUS2000223) Field Mapper & Serializers
 */

import type { IssueReport } from '../types/report.ts';
import {
  JURISDICTION_ID,
  SERVICE_CODE,
  escapeXml,
  formatOpen311DateTime,
  getIssueTypeKeys,
  getVehicleBrandKey,
  mapReportToOpen311Json,
  mapToOpen311Status,
} from './open311.ts';

export interface Open311ToSapCrmFieldRule {
  open311Source: string;
  open311Field: string;
  sapCrmStructure: string;
  sapCrmField: string;
  sapDataType: string;
  mappingRule: string;
}

export interface Open311ToSapCrmMappedRow extends Open311ToSapCrmFieldRule {
  open311Value: string;
  sapCrmValue: string;
}

export const OPEN311_TO_SAP_CRM_RULES: Open311ToSapCrmFieldRule[] = [
  {
    open311Source: 'Core Request',
    open311Field: 'service_request_id',
    sapCrmStructure: 'CRMD_ORDERADM_H',
    sapCrmField: 'EXT_REF_NO / OBJECT_ID',
    sapDataType: 'CHAR(35)',
    mappingRule: 'Maps Open311 tracking ID directly to SAP External Reference Number',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'service_code',
    sapCrmStructure: 'CRMD_ORDERADM_H',
    sapCrmField: 'PROCESS_TYPE',
    sapDataType: 'CHAR(4)',
    mappingRule: 'micromobility-hazard -> Z311 (Municipal 311 Service Request)',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'service_name',
    sapCrmStructure: 'CRMD_ORDERADM_H',
    sapCrmField: 'DESCRIPTION',
    sapDataType: 'CHAR(40)',
    mappingRule: 'Normalized transaction short description for SAP CRM Order Header',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'status',
    sapCrmStructure: 'CRM_JEST',
    sapCrmField: 'STAT / USER_STATUS',
    sapDataType: 'CHAR(5)',
    mappingRule: 'open -> E0001/E0003/E0004 (Open/In Process/Dispatched); closed -> E0005 (Completed)',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'status_notes',
    sapCrmStructure: 'CRMD_TEXT (STXH)',
    sapCrmField: 'TDID_0002_STATUS_NOTE',
    sapDataType: 'STRING',
    mappingRule: 'Maps status notes to SAP internal log text type 0002',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'description',
    sapCrmStructure: 'CRMD_TEXT (STXH)',
    sapCrmField: 'TDID_SU99_PROBLEM_DESC',
    sapDataType: 'STRING',
    mappingRule: 'PII-scrubbed citizen problem description mapped to SAP Problem Description text',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'agency_responsible',
    sapCrmStructure: 'CRMD_ORGMAN',
    sapCrmField: 'SERVICE_ORG / RESP_ORG',
    sapDataType: 'CHAR(14)',
    mappingRule: 'City of Edmonton Mobility Services -> O 50001010 (Mobility Services Org Unit)',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'requested_datetime',
    sapCrmStructure: 'CRMD_ORDERADM_H',
    sapCrmField: 'POSTING_DATE / CREATED_AT',
    sapDataType: 'TIMESTAMP',
    mappingRule: 'ISO 8601 request timestamp converted to SAP UTC timestamp',
  },
  {
    open311Source: 'Core Request',
    open311Field: 'updated_datetime',
    sapCrmStructure: 'CRMD_ORDERADM_H',
    sapCrmField: 'CHANGED_AT',
    sapDataType: 'TIMESTAMP',
    mappingRule: 'ISO 8601 last modified timestamp mapped to SAP Order Changed At',
  },
  {
    open311Source: 'Location',
    open311Field: 'address',
    sapCrmStructure: 'ADRC',
    sapCrmField: 'STREET / LOCATION_TEXT',
    sapDataType: 'CHAR(60)',
    mappingRule: 'Free-text street or intersection mapped to SAP Incident Address Street',
  },
  {
    open311Source: 'Location',
    open311Field: 'jurisdiction_id',
    sapCrmStructure: 'ADRC',
    sapCrmField: 'CITY1 / REGION / COUNTRY',
    sapDataType: 'CHAR(40)',
    mappingRule: 'edmonton.ca -> CITY1=Edmonton, REGION=AB, COUNTRY=CA',
  },
  {
    open311Source: 'Location',
    open311Field: 'lat / long',
    sapCrmStructure: 'CRMD_CUSTOMER_H',
    sapCrmField: 'ZZ_GEO_LAT / ZZ_GEO_LONG',
    sapDataType: 'DEC(11,8)',
    mappingRule: 'WGS84 EPSG:4326 decimal coordinates mapped to custom SAP GIS fields',
  },
  {
    open311Source: 'Attribute [issue_types]',
    open311Field: 'attributes.issue_types',
    sapCrmStructure: 'CRMC_ERMS_CAT_CD',
    sapCrmField: 'CAT_ID (Multi-Level Categorization)',
    sapDataType: 'CHAR(20)',
    mappingRule: 'improper_parking -> Z_PARK_OBSTRUCT; damage_malfunction -> Z_EQUIP_DAMAGE; safety_concerns -> Z_PUBLIC_SAFETY; other -> Z_OTHER_ISSUE',
  },
  {
    open311Source: 'Attribute [other_issue_detail]',
    open311Field: 'attributes.other_issue_detail',
    sapCrmStructure: 'CRMD_CUSTOMER_H',
    sapCrmField: 'ZZ_OTHER_ISSUE_TXT',
    sapDataType: 'CHAR(255)',
    mappingRule: 'PII-scrubbed "Other" text mapped to SAP AET customer extension field',
  },
  {
    open311Source: 'Attribute [identifying_colours]',
    open311Field: 'attributes.identifying_colours',
    sapCrmStructure: 'CRMD_PARTNER',
    sapCrmField: 'PARTNER_NO (FCT 00000014)',
    sapDataType: 'CHAR(10)',
    mappingRule: 'bird -> BP_BIRD_CA; lime -> BP_LIME_CA; private -> BP_PRIVATE; other -> BP_UNIDENT',
  },
  {
    open311Source: 'Attribute [vehicle_id_number]',
    open311Field: 'attributes.vehicle_id_number',
    sapCrmStructure: 'CRMD_SRV_OSSET / EQUI',
    sapCrmField: 'SERNR / ZZ_VEHICLE_ID',
    sapDataType: 'CHAR(30)',
    mappingRule: 'Alphanumeric frame ID mapped to SAP Equipment Serial Number / Extension',
  },
  {
    open311Source: 'Attribute [incident_datetime]',
    open311Field: 'attributes.incident_datetime',
    sapCrmStructure: 'SCAPPTSEG',
    sapCrmField: 'ZINCIDENT_DT (TIMESTAMP_FROM)',
    sapDataType: 'TIMESTAMP',
    mappingRule: 'Observed incident date/time mapped to SAP Appointment Type ZINCIDENT_DT',
  },
  {
    open311Source: 'Media',
    open311Field: 'media_url',
    sapCrmStructure: 'SKWF_PHIO / BDS_CONN',
    sapCrmField: 'ATTACHMENT_URI / MIME_TYPE',
    sapDataType: 'STRING',
    mappingRule: 'Photo/video payload or URI mapped to SAP Content Server Attachment reference',
  },
];

function mapSapStatusCode(reportStatus: string): {
  sapUserStatus: string;
  sapSystemStatus: string;
  sapStatusLabel: string;
} {
  const s = (reportStatus || '').toLowerCase();
  if (s === 'resolved' || s === 'closed') {
    return { sapUserStatus: 'E0005', sapSystemStatus: 'I1005', sapStatusLabel: 'Completed' };
  }
  if (s === 'dispatched to operator') {
    return { sapUserStatus: 'E0004', sapSystemStatus: 'I1003', sapStatusLabel: 'Dispatched to Vendor' };
  }
  if (s === 'under review') {
    return { sapUserStatus: 'E0003', sapSystemStatus: 'I1003', sapStatusLabel: 'In Process' };
  }
  return { sapUserStatus: 'E0001', sapSystemStatus: 'I1002', sapStatusLabel: 'Open' };
}

function mapSapVendorPartner(brandKey: string): {
  partnerId: string;
  partnerName: string;
  partnerFunction: string;
  vendorEmail: string;
} {
  switch (brandKey) {
    case 'bird':
      return {
        partnerId: 'BP_BIRD_CA',
        partnerName: 'Bird Canada Inc.',
        partnerFunction: '00000014',
        vendorEmail: 'mark.hill@edmonton.ca',
      };
    case 'lime':
      return {
        partnerId: 'BP_LIME_CA',
        partnerName: 'Lime Technology Canada',
        partnerFunction: '00000014',
        vendorEmail: 'mark.hill@edmonton.ca',
      };
    case 'private':
      return {
        partnerId: 'BP_PRIVATE',
        partnerName: 'Private Micromobility Owner',
        partnerFunction: '00000014',
        vendorEmail: 'mark.hill@edmonton.ca',
      };
    default:
      return {
        partnerId: 'BP_UNIDENT',
        partnerName: 'Unidentified Micromobility Operator',
        partnerFunction: '00000014',
        vendorEmail: 'mark.hill@edmonton.ca',
      };
  }
}

function mapSapCategories(issueKeys: string[]): {
  schemaId: string;
  level1: string;
  level2: string;
  categoryIds: string[];
} {
  const map: Record<string, string> = {
    improper_parking: 'Z_PARK_OBSTRUCT',
    damage_malfunction: 'Z_EQUIP_DAMAGE',
    safety_concerns: 'Z_PUBLIC_SAFETY',
    other: 'Z_OTHER_ISSUE',
  };

  return {
    schemaId: 'Z_EDMONTON_311',
    level1: 'Z_TRANSPORT_MOBILITY',
    level2: 'Z_SHARED_MICROMOBILITY',
    categoryIds: issueKeys.map((k) => map[k] || 'Z_OTHER_ISSUE'),
  };
}

/**
 * Maps a stored report (via its Open311 GeoReport v2 structure) into an SAP CRM BUS2000223 Service Request payload.
 */
export function mapReportToSapCrmPayload(report: IssueReport) {
  const open311 = mapReportToOpen311Json(report);
  const issueKeys = getIssueTypeKeys(report.issueTypes);
  const brandKey = getVehicleBrandKey(report.identifyingColours);
  const sapStatus = mapSapStatusCode(report.status);
  const vendorPartner = mapSapVendorPartner(brandKey);
  const categories = mapSapCategories(issueKeys);
  const incidentIso = `${report.incidentDate}T${report.incidentTime || '00:00'}:00Z`;

  return {
    SAP_OBJECT_TYPE: 'BUS2000223',
    INTEGRATION_SOURCE: 'Open311_GeoReport_v2',
    JURISDICTION_ID,
    OPEN311_SERVICE_CODE: SERVICE_CODE,
    CRMD_ORDERADM_H: {
      OBJECT_ID: open311.service_request_id,
      EXT_REF_NO: open311.service_request_id,
      PROCESS_TYPE: 'Z311',
      DESCRIPTION: 'E-Scooter/E-Bike Issue Report',
      POSTING_DATE: open311.requested_datetime.slice(0, 10),
      CREATED_AT: open311.requested_datetime,
      CHANGED_AT: open311.updated_datetime,
    },
    CRM_JEST: {
      OPEN311_STATUS: mapToOpen311Status(report.status),
      USER_STATUS: sapStatus.sapUserStatus,
      SYSTEM_STATUS: sapStatus.sapSystemStatus,
      STATUS_TEXT: sapStatus.sapStatusLabel,
      STATUS_PROFILE: 'Z311STAT',
    },
    CRMD_ORGMAN: {
      SERVICE_ORG: 'O 50001010',
      RESP_ORG_UNIT: open311.agency_responsible,
      DISPATCH_CHANNEL: 'Z_IFRAME_OPEN311',
    },
    CRMD_SERVICE_H: {
      CAT_SCHEMA_ID: categories.schemaId,
      CAT_LEVEL_1: categories.level1,
      CAT_LEVEL_2: categories.level2,
      CAT_IDS: categories.categoryIds,
      PRIORITY: issueKeys.includes('safety_concerns') ? '1' : '3',
    },
    CRMD_PARTNER: [
      {
        PARTNER_FCT: vendorPartner.partnerFunction,
        PARTNER_FCT_DESC: 'Vendor / Responsible Operator',
        PARTNER_NO: vendorPartner.partnerId,
        PARTNER_NAME: vendorPartner.partnerName,
        SMTP_ADDR: report.emailDispatch?.recipient || vendorPartner.vendorEmail,
      },
    ],
    ADRC_LOCATION: {
      STREET: open311.address,
      CITY1: 'Edmonton',
      REGION: 'AB',
      COUNTRY: 'CA',
      POSTL_COD1: open311.zipcode,
    },
    SCAPPTSEG: [
      {
        APPT_TYPE: 'SRV_RF_DURA',
        TIMESTAMP_FROM: open311.requested_datetime,
      },
      {
        APPT_TYPE: 'ZINCIDENT_DT',
        TIMESTAMP_FROM: formatOpen311DateTime(incidentIso),
      },
    ],
    CRMD_TEXT: [
      {
        TDID: 'SU99',
        TDID_DESC: 'Problem Description (PII Scrubbed)',
        TDSPRAS: 'EN',
        TEXT: open311.description,
      },
      {
        TDID: '0002',
        TDID_DESC: 'Internal Status / Dispatch Note',
        TDSPRAS: 'EN',
        TEXT: open311.status_notes,
      },
    ],
    CRMD_CUSTOMER_H: {
      ZZ_VEHICLE_BRAND: brandKey.toUpperCase(),
      ZZ_VEHICLE_COLOUR_DESC: report.identifyingColours,
      ZZ_VEHICLE_ID: report.vehicleIdNumber || null,
      ZZ_OTHER_ISSUE_TXT: report.issueTypes?.other ? report.issueTypes.otherText || null : null,
      ZZ_GEO_LAT: open311.lat,
      ZZ_GEO_LONG: open311.long,
      ZZ_GEO_SRID: open311.lat !== null && open311.long !== null ? 'EPSG:4326' : null,
      ZZ_PII_SCRUBBED: report.piiScrubbing?.scrubbed ?? false,
      ZZ_EMAIL_SUBJECT: report.emailDispatch?.subject || null,
    },
    SKWF_DOCUMENTS: report.attachment
      ? [
          {
            FILE_NAME: report.attachment.name,
            MIME_TYPE: report.attachment.type,
            FILE_SIZE_BYTES: report.attachment.size,
            ATTACHMENT_URI: open311.media_url ? '[DATA_URI_ATTACHED]' : null,
          },
        ]
      : [],
  };
}

/**
 * Generates a field-by-field Open311 -> SAP CRM matrix populated with live values for a report.
 */
export function getOpen311ToSapCrmMappedRows(report: IssueReport): Open311ToSapCrmMappedRow[] {
  const open311 = mapReportToOpen311Json(report);
  const sap = mapReportToSapCrmPayload(report);
  const issueKeys = getIssueTypeKeys(report.issueTypes);
  const brandKey = getVehicleBrandKey(report.identifyingColours);

  const valuesMap: Record<string, { o311: string; sap: string }> = {
    service_request_id: {
      o311: open311.service_request_id,
      sap: sap.CRMD_ORDERADM_H.EXT_REF_NO,
    },
    service_code: {
      o311: open311.service_code,
      sap: sap.CRMD_ORDERADM_H.PROCESS_TYPE,
    },
    service_name: {
      o311: open311.service_name,
      sap: sap.CRMD_ORDERADM_H.DESCRIPTION,
    },
    status: {
      o311: open311.status,
      sap: `${sap.CRM_JEST.USER_STATUS} / ${sap.CRM_JEST.SYSTEM_STATUS} (${sap.CRM_JEST.STATUS_TEXT})`,
    },
    status_notes: {
      o311: open311.status_notes,
      sap: sap.CRMD_TEXT[1].TEXT,
    },
    description: {
      o311: open311.description,
      sap: sap.CRMD_TEXT[0].TEXT,
    },
    agency_responsible: {
      o311: open311.agency_responsible,
      sap: `${sap.CRMD_ORGMAN.SERVICE_ORG} (${sap.CRMD_ORGMAN.RESP_ORG_UNIT})`,
    },
    requested_datetime: {
      o311: open311.requested_datetime,
      sap: sap.CRMD_ORDERADM_H.CREATED_AT,
    },
    updated_datetime: {
      o311: open311.updated_datetime,
      sap: sap.CRMD_ORDERADM_H.CHANGED_AT,
    },
    address: {
      o311: open311.address,
      sap: sap.ADRC_LOCATION.STREET,
    },
    jurisdiction_id: {
      o311: JURISDICTION_ID,
      sap: `${sap.ADRC_LOCATION.CITY1}, ${sap.ADRC_LOCATION.REGION}, ${sap.ADRC_LOCATION.COUNTRY}`,
    },
    'lat / long': {
      o311:
        open311.lat !== null && open311.long !== null
          ? `${open311.lat}, ${open311.long}`
          : 'null',
      sap:
        sap.CRMD_CUSTOMER_H.ZZ_GEO_LAT !== null && sap.CRMD_CUSTOMER_H.ZZ_GEO_LONG !== null
          ? `${sap.CRMD_CUSTOMER_H.ZZ_GEO_LAT}, ${sap.CRMD_CUSTOMER_H.ZZ_GEO_LONG} (${sap.CRMD_CUSTOMER_H.ZZ_GEO_SRID})`
          : 'null',
    },
    'attributes.issue_types': {
      o311: issueKeys.join(', ') || 'none',
      sap: sap.CRMD_SERVICE_H.CAT_IDS.join(', '),
    },
    'attributes.other_issue_detail': {
      o311: report.issueTypes?.other ? report.issueTypes.otherText || '(empty)' : 'N/A',
      sap: sap.CRMD_CUSTOMER_H.ZZ_OTHER_ISSUE_TXT || 'N/A',
    },
    'attributes.identifying_colours': {
      o311: `${brandKey} (${report.identifyingColours})`,
      sap: `${sap.CRMD_PARTNER[0].PARTNER_NO} (${sap.CRMD_PARTNER[0].PARTNER_NAME})`,
    },
    'attributes.vehicle_id_number': {
      o311: report.vehicleIdNumber || '(not provided)',
      sap: sap.CRMD_CUSTOMER_H.ZZ_VEHICLE_ID || 'null',
    },
    'attributes.incident_datetime': {
      o311: `${report.incidentDate}T${report.incidentTime || '00:00'}:00Z`,
      sap: sap.SCAPPTSEG[1].TIMESTAMP_FROM,
    },
    media_url: {
      o311: report.attachment ? `${report.attachment.name} (${report.attachment.type})` : 'null',
      sap:
        sap.SKWF_DOCUMENTS.length > 0
          ? `${sap.SKWF_DOCUMENTS[0].FILE_NAME} (${sap.SKWF_DOCUMENTS[0].MIME_TYPE})`
          : 'None',
    },
  };

  return OPEN311_TO_SAP_CRM_RULES.map((rule) => ({
    ...rule,
    open311Value: valuesMap[rule.open311Field]?.o311 ?? '',
    sapCrmValue: valuesMap[rule.open311Field]?.sap ?? '',
  }));
}

function serializeSingleSapCrmXmlNode(report: IssueReport): string {
  const sap = mapReportToSapCrmPayload(report);
  const partner = sap.CRMD_PARTNER[0];
  const catsXml = sap.CRMD_SERVICE_H.CAT_IDS.map((c) => `<CAT_ID>${escapeXml(c)}</CAT_ID>`).join('');
  const apptsXml = sap.SCAPPTSEG.map(
    (a) => `
      <APPOINTMENT>
        <APPT_TYPE>${escapeXml(a.APPT_TYPE)}</APPT_TYPE>
        <TIMESTAMP_FROM>${escapeXml(a.TIMESTAMP_FROM)}</TIMESTAMP_FROM>
      </APPOINTMENT>`
  ).join('');
  const textsXml = sap.CRMD_TEXT.map(
    (t) => `
      <TEXT_LINE>
        <TDID>${escapeXml(t.TDID)}</TDID>
        <TDSPRAS>${escapeXml(t.TDSPRAS)}</TDSPRAS>
        <TEXT>${escapeXml(t.TEXT)}</TEXT>
      </TEXT_LINE>`
  ).join('');
  const docsXml = sap.SKWF_DOCUMENTS.map(
    (d) => `
      <DOCUMENT>
        <FILE_NAME>${escapeXml(d.FILE_NAME)}</FILE_NAME>
        <MIME_TYPE>${escapeXml(d.MIME_TYPE)}</MIME_TYPE>
        <FILE_SIZE_BYTES>${d.FILE_SIZE_BYTES}</FILE_SIZE_BYTES>
      </DOCUMENT>`
  ).join('');

  return `
  <ServiceRequest>
    <SAP_OBJECT_TYPE>${escapeXml(sap.SAP_OBJECT_TYPE)}</SAP_OBJECT_TYPE>
    <CRMD_ORDERADM_H>
      <OBJECT_ID>${escapeXml(sap.CRMD_ORDERADM_H.OBJECT_ID)}</OBJECT_ID>
      <EXT_REF_NO>${escapeXml(sap.CRMD_ORDERADM_H.EXT_REF_NO)}</EXT_REF_NO>
      <PROCESS_TYPE>${escapeXml(sap.CRMD_ORDERADM_H.PROCESS_TYPE)}</PROCESS_TYPE>
      <DESCRIPTION>${escapeXml(sap.CRMD_ORDERADM_H.DESCRIPTION)}</DESCRIPTION>
      <POSTING_DATE>${escapeXml(sap.CRMD_ORDERADM_H.POSTING_DATE)}</POSTING_DATE>
      <CREATED_AT>${escapeXml(sap.CRMD_ORDERADM_H.CREATED_AT)}</CREATED_AT>
      <CHANGED_AT>${escapeXml(sap.CRMD_ORDERADM_H.CHANGED_AT)}</CHANGED_AT>
    </CRMD_ORDERADM_H>
    <CRM_JEST>
      <STATUS_PROFILE>${escapeXml(sap.CRM_JEST.STATUS_PROFILE)}</STATUS_PROFILE>
      <USER_STATUS>${escapeXml(sap.CRM_JEST.USER_STATUS)}</USER_STATUS>
      <SYSTEM_STATUS>${escapeXml(sap.CRM_JEST.SYSTEM_STATUS)}</SYSTEM_STATUS>
      <STATUS_TEXT>${escapeXml(sap.CRM_JEST.STATUS_TEXT)}</STATUS_TEXT>
    </CRM_JEST>
    <CRMD_ORGMAN>
      <SERVICE_ORG>${escapeXml(sap.CRMD_ORGMAN.SERVICE_ORG)}</SERVICE_ORG>
      <RESP_ORG_UNIT>${escapeXml(sap.CRMD_ORGMAN.RESP_ORG_UNIT)}</RESP_ORG_UNIT>
      <DISPATCH_CHANNEL>${escapeXml(sap.CRMD_ORGMAN.DISPATCH_CHANNEL)}</DISPATCH_CHANNEL>
    </CRMD_ORGMAN>
    <CRMD_SERVICE_H>
      <CAT_SCHEMA_ID>${escapeXml(sap.CRMD_SERVICE_H.CAT_SCHEMA_ID)}</CAT_SCHEMA_ID>
      <CAT_LEVEL_1>${escapeXml(sap.CRMD_SERVICE_H.CAT_LEVEL_1)}</CAT_LEVEL_1>
      <CAT_LEVEL_2>${escapeXml(sap.CRMD_SERVICE_H.CAT_LEVEL_2)}</CAT_LEVEL_2>
      <CATEGORIES>${catsXml}</CATEGORIES>
      <PRIORITY>${escapeXml(sap.CRMD_SERVICE_H.PRIORITY)}</PRIORITY>
    </CRMD_SERVICE_H>
    <CRMD_PARTNER>
      <PARTNER>
        <PARTNER_FCT>${escapeXml(partner.PARTNER_FCT)}</PARTNER_FCT>
        <PARTNER_NO>${escapeXml(partner.PARTNER_NO)}</PARTNER_NO>
        <PARTNER_NAME>${escapeXml(partner.PARTNER_NAME)}</PARTNER_NAME>
        <SMTP_ADDR>${escapeXml(partner.SMTP_ADDR)}</SMTP_ADDR>
      </PARTNER>
    </CRMD_PARTNER>
    <ADRC_LOCATION>
      <STREET>${escapeXml(sap.ADRC_LOCATION.STREET)}</STREET>
      <CITY1>${escapeXml(sap.ADRC_LOCATION.CITY1)}</CITY1>
      <REGION>${escapeXml(sap.ADRC_LOCATION.REGION)}</REGION>
      <COUNTRY>${escapeXml(sap.ADRC_LOCATION.COUNTRY)}</COUNTRY>
      <POSTL_COD1>${escapeXml(sap.ADRC_LOCATION.POSTL_COD1)}</POSTL_COD1>
    </ADRC_LOCATION>
    <SCAPPTSEG>${apptsXml}
    </SCAPPTSEG>
    <CRMD_TEXT>${textsXml}
    </CRMD_TEXT>
    <CRMD_CUSTOMER_H>
      <ZZ_VEHICLE_BRAND>${escapeXml(sap.CRMD_CUSTOMER_H.ZZ_VEHICLE_BRAND)}</ZZ_VEHICLE_BRAND>
      <ZZ_VEHICLE_ID>${escapeXml(sap.CRMD_CUSTOMER_H.ZZ_VEHICLE_ID)}</ZZ_VEHICLE_ID>
      <ZZ_OTHER_ISSUE_TXT>${escapeXml(sap.CRMD_CUSTOMER_H.ZZ_OTHER_ISSUE_TXT)}</ZZ_OTHER_ISSUE_TXT>
      <ZZ_GEO_LAT>${sap.CRMD_CUSTOMER_H.ZZ_GEO_LAT ?? ''}</ZZ_GEO_LAT>
      <ZZ_GEO_LONG>${sap.CRMD_CUSTOMER_H.ZZ_GEO_LONG ?? ''}</ZZ_GEO_LONG>
      <ZZ_GEO_SRID>${escapeXml(sap.CRMD_CUSTOMER_H.ZZ_GEO_SRID)}</ZZ_GEO_SRID>
      <ZZ_PII_SCRUBBED>${sap.CRMD_CUSTOMER_H.ZZ_PII_SCRUBBED}</ZZ_PII_SCRUBBED>
    </CRMD_CUSTOMER_H>
    <SKWF_DOCUMENTS>${docsXml}
    </SKWF_DOCUMENTS>
  </ServiceRequest>`;
}

export function getSingleSapCrmXml(report: IssueReport): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SAPCRMServiceRequests>${serializeSingleSapCrmXmlNode(report)}
</SAPCRMServiceRequests>`;
}

export function getSapCrmListXml(reports: IssueReport[]): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<SAPCRMServiceRequests>${reports.map((r) => serializeSingleSapCrmXmlNode(r)).join('')}
</SAPCRMServiceRequests>`;
}
