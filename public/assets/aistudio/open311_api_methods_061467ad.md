# Open311 GeoReport v2 API Methods

This document details all 7 API methods for the **Open311 GeoReport v2** specification, including request parameters, response fields, descriptions, notes, and requirements.

---

## Overview of API Methods

1. [GET Service List](#71-get-service-list)
2. [GET Service Definition](#72-get-service-definition)
3. [POST Service Request](#73-post-service-request)
4. [GET service_request_id from a token](#74-get-service_request_id-from-a-token)
5. [GET Service Requests](#75-get-service-requests)
6. [GET Service Request](#76-get-service-request)
7. [Errors](#77-errors)

---

## 7.1 GET Service List

**Purpose:** Provide a list of acceptable 311 service request types and their associated service codes. These request types can be unique to the city/jurisdiction.  
**URL:** `https://[API endpoint]/services.[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  
**Formats:** XML (JSON available if denoted by Service Discovery)

### Required Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `jurisdiction_id` | Unique identifier for the city/jurisdiction | Only required if the endpoint serves multiple jurisdictions |

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `services` | Root container element for service list | Container element |
| `service` | Individual service request type record | Child element of `services` |
| `service_code` | The unique identifier for the service request type | Unique key string |
| `service_name` | The human-readable name of the service request type | Short text label |
| `description` | A brief description of the service request type | Text explanation |
| `metadata` | Determines whether there are additional form fields for this service type | Possible values: `true`, `false`. If `true`, client must call Service Definition method. |
| `type` | Service request processing type | Possible values: `realtime` (ID returned immediately), `batch` (token returned), `blackbox` (no ID returned). |
| `keywords` | A comma-separated list of tags or keywords to help users identify the request type | Provides synonyms of the `service_name` and `group` |
| `group` | A category to group this service type within | Allows grouping several service request types under one category (e.g., "sanitation") |

---

## 7.2 GET Service Definition

**Purpose:** Define attributes associated with a service code. These attributes can be unique to the city/jurisdiction.  
**Conditional:** Yes – Only necessary if the Service selected has `metadata` set to `true` in `GET Services` response.  
**URL:** `https://[API endpoint]/services/[service_code].[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  
**Formats:** XML (JSON available if denoted by Service Discovery)

### Required Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_code` | The unique identifier for the service request type | Specified in the main URL path |
| `jurisdiction_id` | Unique identifier for the city/jurisdiction | Only required if the endpoint serves multiple jurisdictions |

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_definition` | Root container element for service definition | Container element |
| `service_code` | Unique identifier for the service | Returns the `service_code` submitted for this call |
| `attributes` | Container element for custom service attributes | Container element |
| `attribute` | Individual attribute element | Child of `attributes` |
| `variable` | Indicates if user input is needed | Possible values: `true` (user input needed), `false` (informational only inside description) |
| `code` | A unique identifier for the attribute | Unique key string |
| `datatype` | Denotes the type of field used for user input | Options: `string`, `number`, `datetime`, `text`, `singlevaluelist`, `multivaluelist` |
| `required` | Indicates whether the attribute value must be submitted | Options: `true`, `false` |
| `datatype_description` | Description of the datatype to help user provide input | Optional guidance text |
| `order` | Sort order that attributes will be presented to the user | Any positive integer not used for other attributes in the same `service_code` |
| `description` | Description of the attribute field with instructions | Text instructions for the user |
| `values` | Container element for options list | Used when `datatype` is `singlevaluelist` or `multivaluelist` |
| `value` | Individual option item | Child of `values` |
| `key` | Unique identifier associated with an option | Analogous to HTML `<option>` value attribute |
| `name` | Human-readable title of an option | Analogous to inner text node of HTML `<option>` |

---

## 7.3 POST Service Request

**Purpose:** Create service requests.  
**URL:** `https://[API endpoint]/requests.[format]`  
**HTTP Method:** `POST`  
**Requires API Key:** Yes  
**Format Sent:** `application/x-www-form-urlencoded`  
**Formats Returned:** XML (JSON available if denoted by Service Discovery)

### Required Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_code` | The service code for the issue type | Obtained from `GET Service List` method |
| `location parameter` | Location details for the request | Must submit at least one of: (`lat` & `long`), `address_string`, or `address_id` |
| `jurisdiction_id` | Unique identifier for the city/jurisdiction | Required if endpoint serves multiple jurisdictions |
| `attribute` | Key/value responses based on Service Definitions | Format: `attribute[code]=value`. Required if `service_code` has required attributes in Service Definition. |

### Optional Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `lat` | Latitude using WGS84 projection | Required if no `address_string` or `address_id` provided. Must be sent together with `long`. |
| `long` | Longitude using WGS84 projection | Required if no `address_string` or `address_id` provided. Must be sent together with `lat`. |
| `address_string` | Human-entered address or location description | Required if no `lat`/`long` or `address_id` provided. Written from most specific to most general unit. |
| `address_id` | Internal address ID from master address repository | Required if no `lat`/`long` or `address_string` provided |
| `email` | Email address of the submitter | Optional contact info |
| `device_id` | Unique device ID submitting the request | Typically used for mobile apps (Android/iOS device identifiers) |
| `account_id` | Unique user account ID of submitter | Optional account identifier |
| `first_name` | Given name of submitter | Optional contact info |
| `last_name` | Family name of submitter | Optional contact info |
| `phone` | Phone number of submitter | Optional contact info |
| `description` | Full description of request or report | Free-form text, up to 4,000 characters. May contain line breaks, no HTML or code. |
| `media_url` | URL to media associated with request (e.g., image) | URL to media photo/file feed |

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Individual request submission response | Child element of `service_requests` |
| `service_request_id` | Unique ID of the service request created | Not returned if `token` is returned |
| `token` | Temporary token identifier | Returned for batch processing; use to call `GET service_request_id from a token`. Not returned if `service_request_id` is returned. |
| `service_notice` | Information about expected fulfillment action | May not be returned |
| `account_id` | Unique user account ID of submitter | May not be returned |

---

## 7.4 GET service_request_id from a token

**Purpose:** Get the `service_request_id` from a temporary token.  
**Conditional:** Yes – Only necessary if response from `POST Service Request` contains a `token`.  
**URL:** `https://[API endpoint]/tokens/[token_id].[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  
**Formats:** XML (JSON available if denoted by Service Discovery)

### Required Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `token` | Temporary token identifier | Specified in main URL path. Obtained from `POST Service Request`. |
| `jurisdiction_id` | Unique identifier for city/jurisdiction | Required if endpoint serves multiple jurisdictions |

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Individual token resolution response | Child of `service_requests` |
| `service_request_id` | Unique ID for the created service request | Can be used to call `GET Service Request` |
| `token` | Token ID used to make this call | Returns submitted token |

---

## 7.5 GET Service Requests

**Purpose:** Query the current status of multiple service requests.  
**URL:** `https://[API endpoint]/requests.[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  
**Formats:** XML (JSON available if denoted by Service Discovery)  
**Response Volume:** Default limit is 90 days or first 1,000 requests (whichever is smaller).

### Required Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `jurisdiction_id` | Unique identifier for city/jurisdiction | Required if endpoint serves multiple jurisdictions |

### Optional Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_request_id` | Comma-delimited list of service request IDs | Overrides all other query arguments |
| `service_code` | Specify service type by unique service code ID | Defaults to all service codes if omitted; can be comma-delimited list |
| `start_date` | Earliest datetime to include in search | ISO 8601 / W3 format (e.g., `2010-01-01T00:00:00Z`). Max range of 90 days with `end_date`. |
| `end_date` | Latest datetime to include in search | ISO 8601 / W3 format. Max range of 90 days with `start_date`. Defaults to most recent 90 days. |
| `status` | Search requests by status | Options: `open`, `closed`. Defaults to all statuses. |

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Individual service request item | Child of `service_requests` |
| `service_request_id` | Unique ID of the service request | String identifier |
| `status` | Current status of service request | Options: `open` (reported), `closed` (resolved) |
| `status_notes` | Details or explanations regarding status change | May not be returned |
| `service_name` | Human-readable name of service request type | String label |
| `service_code` | Unique identifier for service request type | String code |
| `description` | Full description of request/report submitted | Max 4,000 characters, no HTML |
| `agency_responsible` | Agency responsible for fulfilling request | May not be returned |
| `service_notice` | Action expected to fulfill the request | May not be returned |
| `requested_datetime` | Date and time request was created | Returned in ISO 8601 / W3 format |
| `updated_datetime` | Date and time request was last modified | Returned in ISO 8601 / W3 format |
| `expected_datetime` | Date and time request is expected to be fulfilled | May not be returned |
| `address` | Human-readable address / location description | Specific to general geographic units |
| `address_id` | Internal address ID | Master address repository key |
| `zipcode` | Postal code of location | String |
| `lat` | Latitude coordinate | WGS84 projection |
| `long` | Longitude coordinate | WGS84 projection |
| `media_url` | URL to media associated with request | Image/media file URL |

---

## 7.6 GET Service Request

**Purpose:** Query the current status of an individual service request.  
**URL:** `https://[API endpoint]/requests/[service_request_id].[format]`  
**HTTP Method:** `GET`  
**Requires API Key:** No  
**Formats:** XML (JSON available if denoted by Service Discovery)

### Required Arguments

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_request_id` | Unique ID of the service request | Specified in main URL path |
| `jurisdiction_id` | Unique identifier for city/jurisdiction | Required if endpoint serves multiple jurisdictions |

### Optional Arguments

*None*

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `service_requests` | Root container element | Container element |
| `request` | Individual service request details | Child of `service_requests` |
| `service_request_id` | Unique ID of the service request | String |
| `status` | Current status of service request | Options: `open`, `closed` |
| `status_notes` | Status change explanation / extra details | May not be returned |
| `service_name` | Human-readable service name | String |
| `service_code` | Unique identifier for service type | String |
| `description` | Full description of submitted issue | Max 4,000 characters |
| `agency_responsible` | Responsible agency | May not be returned |
| `service_notice` | Notice regarding fulfillment | May not be returned |
| `requested_datetime` | Date/time request created | ISO 8601 / W3 format |
| `updated_datetime` | Date/time request last modified | ISO 8601 / W3 format |
| `expected_datetime` | Expected fulfillment date/time | May not be returned |
| `address` | Human-readable address | String |
| `address_id` | Internal address repository ID | String |
| `zipcode` | Postal code | String |
| `lat` | Latitude coordinate | WGS84 projection |
| `long` | Longitude coordinate | WGS84 projection |
| `media_url` | URL to associated media | String URL |

---

## 7.7 Errors

**Purpose:** Standard error response structure for API requests.  
**HTTP Status Codes:** `400` (Bad Request / General Error), `403` (Forbidden / Invalid API Key), `404` (Not Found).

### Response Fields

| Field Name | Description | Notes & Requirements |
| :--- | :--- | :--- |
| `errors` | Root container element for errors | Container element |
| `error` | Individual error item | Child element of `errors` |
| `code` | Error code representing error type | Should generally match HTTP status code |
| `description` | Human-readable description of error | Intended for display to user |

### General Error HTTP Codes

- `400` - Bad Request: Parameter missing or invalid request structure.
- `403` - Forbidden: Missing or invalid `api_key`.
- `404` - Not Found: Specified resource (`jurisdiction_id`, `service_code`, `service_request_id`, or `token`) not found.
