# Open311 GeoReport v2 API Specification

The GeoReport API v2 allows developers to build applications to both view and report non-emergency location-based issues (such as graffiti, potholes, and street cleaning) which government entities like cities are responsible for addressing.

---

## Table of Contents
1. [Status & Specification](#1-status--specification)
2. [Service Discovery](#2-service-discovery)
3. [Internationalization & Encoding](#3-internationalization--encoding)
   - [3.1 Date/time format](#31-datetime-format)
   - [3.2 Encoding](#32-encoding)
4. [Format Support](#4-format-support)
   - [4.1 XML Support](#41-xml-support)
   - [4.2 JSON Support](#42-json-support)
5. [Definitions](#5-definitions)
   - [5.1 jurisdiction_id](#51-jurisdiction_id)
   - [5.2 Optional Arguments](#52-optional-arguments)
6. [API Methods](#6-api-methods)
   - [6.1 GET Service List](#61-get-service-list)
   - [6.2 GET Service Definition](#62-get-service-definition)
   - [6.3 POST Service Request](#63-post-service-request)
   - [6.4 GET service_request_id from a token](#64-get-service_request_id-from-a-token)
   - [6.5 GET Service Requests](#65-get-service-requests)
   - [6.6 GET Service Request](#66-get-service-request)
   - [6.7 Errors](#67-errors)

---

## 1. Status & Specification

- **Status:** Stable. The GeoReport v2 Spec has been finalized, but documentation continues to be updated for clarity and verification of implementation compliance.
- **Servers:** Servers receive and manage service requests on behalf of a jurisdiction. A comprehensive list is maintained on the Open311 wiki.

---

## 2. Service Discovery

GeoReport v2 and subsequent Open311 APIs are required to have a standard service discovery file associated with them to provide routing between versions and types of APIs.

---

## 3. Internationalization & Encoding

### 3.1 Date/time format
All date/time fields must be formatted in a common subset of ISO 8601 as per the W3 note. Timezone information (either `Z` for UTC or an `HH:MM` offset) **must** be included.

*Examples:*
- `1994-11-05T08:15:30-05:00` (November 5, 1994, 8:15:30 am, US Eastern Standard Time)
- `1994-11-05T13:15:30Z` (Same instant in UTC)

### 3.2 Encoding
- **UTF-8** is required everywhere.
- All text returned by the service (XML, JSON, etc.) MUST be encoded as UTF-8 with appropriate HTTP headers and XML declaration (`encoding="UTF-8"`).
- All text received by the service from the client will be assumed to be UTF-8.

---

## 4. Format Support

XML is a required format; JSON is optional at the discretion of the API provider. Supported output formats are indicated through the Service Discovery `formats` field.

- **POST Service Request:** `Content-Type: application/x-www-form-urlencoded; charset=utf-8`
- **XML:** `Content-Type: text/xml; charset=utf-8`
- **JSON:** `Content-Type: application/json; charset=utf-8`

### 4.1 XML Support
- Content-Type: `text/xml`
- Output is schemaless and without a namespace declaration.
- Default XMLNS URI (if specified): `http://wiki.open311.org/GeoReport_v2`

### 4.2 JSON Support
- Content-Type: `application/json`
- JSON support is based on a programmatic mapping of the XML format using the Spark Convention.

---

## 5. Definitions

### 5.1 jurisdiction_id
Unique identifier for a city/jurisdiction to allow an API endpoint to distinguish multiple jurisdictions. Typically uses the jurisdiction's main website root URL (e.g., `sfgov.org` for San Francisco). Optional if the implementation serves only one jurisdiction.

### 5.2 Optional Arguments
Passing an empty optional argument or omitting it completely yields the same response. A `null` parameter is treated as equivalent to a non-declared parameter.

---

## 6. API Methods

### 6.1 GET Service List

**Purpose:** Provide a list of acceptable 311 service request types and their associated service codes.  
**URL:** `https://[API endpoint]/services.[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  

#### Required Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `jurisdiction_id` | Unique identifier for jurisdiction | Only required if endpoint serves multiple jurisdictions |

#### Response Fields
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `services` | Root container element | Container element |
| `service` | Individual service record | Child of `services` |
| `service_code` | Unique identifier for request type | String code |
| `service_name` | Human-readable name of service | String label |
| `description` | Brief description of service request type | Text explanation |
| `metadata` | Indicates if additional fields exist | Possible values: `true`, `false`. If `true`, call GET Service Definition. |
| `type` | Service request processing type | Possible values: `realtime`, `batch`, `blackbox` |
| `keywords` | Comma-separated list of tags/keywords | Synonyms for `service_name` and `group` |
| `group` | Category grouping for service type | e.g., "sanitation" |

#### Possible Errors
- `404` - `jurisdiction_id` provided was not found
- `400` - `jurisdiction_id` was not provided
- `400` - General service error

---

### 6.2 GET Service Definition

**Conditional:** Only necessary if `metadata` is `true` in `GET Service List` response.  
**Purpose:** Define attributes associated with a specific service code.  
**URL:** `https://[API endpoint]/services/[service_code].[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  

#### Required Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_code` | Unique identifier for service | Specified in URL path |
| `jurisdiction_id` | Unique identifier for jurisdiction | Required if endpoint serves multiple jurisdictions |

#### Response Fields
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_definition` | Root container element | Container element |
| `service_code` | Service code submitted for this call | String code |
| `attributes` | Container for custom attributes | Container element |
| `attribute` | Individual attribute element | Child of `attributes` |
| `variable` | Indicates if user input is needed | Possible values: `true`, `false` |
| `code` | Unique identifier for attribute | String key |
| `datatype` | Input field type | Options: `string`, `number`, `datetime`, `text`, `singlevaluelist`, `multivaluelist` |
| `required` | Indicates if field is required | Options: `true`, `false` |
| `datatype_description` | Description of datatype | Guidance text |
| `order` | Sort order for attributes | Positive integer (1 is shown first) |
| `description` | Instructions for the user | Text instructions |
| `values` | Options list container | Used for list datatypes |
| `value` | Option item | Child of `values` |
| `key` | Option identifier | Analogous to HTML `<option>` value |
| `name` | Human-readable option title | Analogous to inner text of `<option>` |

#### Possible Errors
- `404` - `service_code` or `jurisdiction_id` not found
- `400` - `service_code` or `jurisdiction_id` not provided
- `400` - General service error

---

### 6.3 POST Service Request

**Purpose:** Create service requests.  
**URL:** `https://[API endpoint]/requests.[format]`  
**HTTP Method:** `POST`  
**Requires API Key:** Yes  
**Format Sent:** `application/x-www-form-urlencoded`  

#### Required Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `jurisdiction_id` | Unique identifier for jurisdiction | Required if endpoint serves multiple jurisdictions |
| `service_code` | Obtained from GET Service List | String code |
| `location parameter` | Location details | Must submit one of: (`lat` & `long`), `address_string`, or `address_id` |
| `attribute` | Key/value attribute array | Format: `attribute[code]=value`. Required if service has required attributes. |

#### Optional Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `lat` | Latitude (WGS84) | Must send with `long`. Required if no `address_string` or `address_id`. |
| `long` | Longitude (WGS84) | Must send with `lat`. Required if no `address_string` or `address_id`. |
| `address_string` | Human-entered location address | Required if no `lat`/`long` or `address_id`. Written from specific to general. |
| `address_id` | Master address repository ID | Required if no `lat`/`long` or `address_string`. |
| `email` | Submitter email address | Optional contact info |
| `device_id` | Unique submitting device ID | Mobile app device identifier |
| `account_id` | Submitter user account ID | Optional account ID |
| `first_name` | Submitter given name | Optional contact info |
| `last_name` | Submitter family name | Optional contact info |
| `phone` | Submitter phone number | Optional contact info |
| `description` | Detailed request description | Up to 4,000 characters, no HTML |
| `media_url` | URL to associated media (e.g., photo) | Image or media feed URL |

#### Response Fields
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Response item | Child of `service_requests` |
| `service_request_id` | Created request ID | Omitted if `token` is returned |
| `token` | Temporary token identifier | Omitted if `service_request_id` is returned |
| `service_notice` | Action expected for request fulfillment | Optional response |
| `account_id` | Submitter user account ID | Optional response |

#### Possible Errors
- `404` - `service_code` or `jurisdiction_id` not found
- `400` - `service_code` or `jurisdiction_id` not provided
- `400` - General service error

---

### 6.4 GET service_request_id from a token

**Conditional:** Only necessary if `POST Service Request` returned a `token`.  
**Purpose:** Get `service_request_id` from a temporary token.  
**URL:** `https://[API endpoint]/tokens/[token_id].[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  

#### Required Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `token` | Temporary token identifier | Specified in URL path |
| `jurisdiction_id` | Unique identifier for jurisdiction | Required if endpoint serves multiple jurisdictions |

#### Response Fields
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Response item | Child of `service_requests` |
| `service_request_id` | Unique service request ID created | Used to call GET Service Request |
| `token` | Token ID used in call | Returns submitted token |

#### Possible Errors
- `404` - `jurisdiction_id` or `token` not found
- `400` - `jurisdiction_id` or `token` not provided
- `400` - General service error

---

### 6.5 GET Service Requests

**Purpose:** Query the status of multiple service requests.  
**URL:** `https://[API endpoint]/requests.[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  
**Response Limit:** Default max 90 days or first 1,000 requests.

#### Required Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `jurisdiction_id` | Unique identifier for jurisdiction | Required if endpoint serves multiple jurisdictions |

#### Optional Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_request_id` | Comma-delimited request IDs | Overrides all other search parameters |
| `service_code` | Filter by service code(s) | Defaults to all codes; comma-delimited list allowed |
| `start_date` | Search range start datetime | ISO 8601 / W3 format. Max 90-day range with `end_date`. |
| `end_date` | Search range end datetime | ISO 8601 / W3 format. Defaults to most recent 90 days. |
| `status` | Filter by status | Options: `open`, `closed`. Defaults to all. |

#### Response Fields
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Individual request item | Child of `service_requests` |
| `service_request_id` | Unique request ID | String ID |
| `status` | Status of request | Options: `open`, `closed` |
| `status_notes` | Details on status change | Optional response |
| `service_name` | Name of service request type | String label |
| `service_code` | Unique code of service type | String code |
| `description` | Request description submitted | Max 4,000 characters |
| `agency_responsible` | Responsible agency | Optional response |
| `service_notice` | Notice on expected action | Optional response |
| `requested_datetime` | Request creation date/time | ISO 8601 / W3 format |
| `updated_datetime` | Request last modified date/time | ISO 8601 / W3 format |
| `expected_datetime` | Expected fulfillment date/time | Optional response |
| `address` | Human-readable address | String location |
| `address_id` | Internal address ID | Master address repository key |
| `zipcode` | Location postal code | String |
| `lat` | Latitude coordinate | WGS84 projection |
| `long` | Longitude coordinate | WGS84 projection |
| `media_url` | Associated media URL | Media feed / image URL |

#### Possible Errors
- `404` - `jurisdiction_id` not found
- `400` - `jurisdiction_id` not provided
- `400` - General service error

---

### 6.6 GET Service Request

**Purpose:** Query the status of an individual service request.  
**URL:** `https://[API endpoint]/requests/[service_request_id].[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  

#### Required Arguments
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_request_id` | Unique request ID | Specified in URL path |
| `jurisdiction_id` | Unique identifier for jurisdiction | Required if endpoint serves multiple jurisdictions |

#### Optional Arguments
*None*

#### Response Fields
Same structure as individual request object returned in `GET Service Requests`.

#### Possible Errors
- `404` - `jurisdiction_id` or `service_request_id` not found
- `400` - `jurisdiction_id` or `service_request_id` not provided
- `400` - General service error

---

## 6.7 Errors

**Purpose:** Standard error response structure for API calls.

### Response Fields
| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `errors` | Root container element | Container element |
| `error` | Error record | Child of `errors` |
| `code` | Error type code | Generally matches HTTP status code |
| `description` | Human-readable error description | Meant for display to user |

### General Error HTTP Codes
- `400` - Bad Request (parameter missing, invalid structure, or reachable service error)
- `403` - Forbidden (missing or invalid `api_key`)
- `404` - Not Found (resource, jurisdiction, service code, request ID, or token not found)
