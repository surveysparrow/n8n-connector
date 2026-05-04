# N8N Integration - Architecture

## 1. Feature Information

### Description

The SurveySparrow n8n integration enables n8n users to automate survey distribution and contact management workflows directly from the n8n workflow automation platform. The integration provides action nodes for sharing surveys via Email, SMS, and WhatsApp channels with dynamic variable support, a contact creation action with custom property mapping, and a webhook-based trigger that fires when a survey receives a new response.

### Functional Requirements

**Feature Description:**

The integration provides the following core functionalities:

1. **Share Survey via Email**: Send a survey to a recipient via an existing email share channel, with optional variable injection for personalization

2. **Share Survey via SMS**: Send a survey to a recipient via an existing SMS share channel, with optional variable injection

3. **Share Survey via WhatsApp**: Send a survey to a recipient via an existing WhatsApp channel, with optional variable injection

4. **Create Contact**: Create a new contact in SurveySparrow with email, name, mobile, and custom properties

5. **New Response Trigger**: Start an n8n workflow automatically when a survey receives a new submission (real-time webhook)

### Dependencies

**Internal Dependencies:**

- SurveySparrow OAuth2 API (`https://integration.surveysparrow.com/o/oauth/token`)

- SurveySparrow REST API v3 endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v3/surveys` | GET | List surveys for dropdown selection |
| `/v3/channels?survey_id={id}&type={type}` | GET | List channels filtered by survey and type |
| `/v3/channels/{channel_id}` | PUT | Share survey via Email, SMS, or WhatsApp |
| `/v3/variables?survey_id={id}` | GET | List survey variables for dropdown |
| `/v3/contacts` | POST | Create a new contact |
| `/v3/webhooks` | POST | Register a webhook for new responses |
| `/v3/webhooks/{id}` | GET | Verify webhook existence |
| `/v3/webhooks/{id}` | DELETE | Remove a webhook |

**External Dependencies:**

- `n8n-workflow` (peer dependency): Node type interfaces, execution context, credential helpers
- `@n8n/node-cli` (dev): Build, lint, and package tooling
- `typescript` 5.9.x (dev): TypeScript compilation

### Expected Feature Additions (Future)

- NPS / CES / CSAT survey type–specific share actions
- Update Contact action
- Delete Contact action
- List Responses action with pagination
- Multiple contacts per share (batch send)
- Survey creation action

### Assumptions and Limitations

**Assumptions:**

- Users have a SurveySparrow account with OAuth2 access configured
- Surveys, channels (Email/SMS/WhatsApp), and variables are pre-configured in SurveySparrow before use
- n8n instance is accessible via a public URL for webhook delivery (or tunneled via ngrok for local development)

**Limitations:**

- One contact per share execution (batch contacts not supported in current version)
- Webhook test timeout is controlled by n8n platform (not configurable per-node)
- Variable names are loaded dynamically but custom properties for contacts require manual entry
- OAuth2 client credentials are embedded in the credential type (single-tenant)
- Token refresh is handled automatically by n8n's OAuth2 infrastructure

---

## 2. High-Level Architectural Details

### Architecture Impacts

**High-level design:**

The integration follows n8n's community node architecture pattern with a clear separation between credential management, action execution, trigger handling, and API transport:

```
┌─────────────────────────────────────────────────────────────────┐
│                     n8n Runtime (Node.js)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                   Community Node Package                    │  │
│  │               (n8n-nodes-surveysparrow)                     │  │
│  └────────────────────────────────────────────────────────────┘  │
│           │                    │                    │             │
│           ▼                    ▼                    ▼             │
│  ┌──────────────┐   ┌──────────────────┐   ┌──────────────┐     │
│  │  Credential  │   │   Action Node    │   │ Trigger Node │     │
│  │    Type      │   │                  │   │              │     │
│  │              │   │ ┌──────────────┐ │   │ - Webhook    │     │
│  │ - OAuth2     │   │ │   Channel    │ │   │   Lifecycle  │     │
│  │   Config     │   │ │  - Email     │ │   │ - Payload    │     │
│  │ - Token      │   │ │  - SMS       │ │   │   Transform  │     │
│  │   Exchange   │   │ │  - WhatsApp  │ │   │ - Survey     │     │
│  │ - Hidden     │   │ ├──────────────┤ │   │   Dropdown   │     │
│  │   Creds      │   │ │   Contact    │ │   │              │     │
│  │              │   │ │  - Create    │ │   │              │     │
│  └──────┬───────┘   │ └──────────────┘ │   └──────┬───────┘     │
│         │           │   Load Options:  │          │              │
│         │           │   - getSurveys   │          │              │
│         │           │   - getChannels  │          │              │
│         │           │   - getVariables │          │              │
│         │           └────────┬─────────┘          │              │
│         │                    │                     │              │
│         └────────────────────┼─────────────────────┘              │
│                              │                                    │
│                              ▼                                    │
│                    ┌──────────────────┐                           │
│                    │  Transport Layer │                           │
│                    │  (shared/        │                           │
│                    │   transport.ts)  │                           │
│                    │                  │                           │
│                    │ - apiRequest()   │                           │
│                    │ - apiRequestAll  │                           │
│                    │   Items()        │                           │
│                    └────────┬─────────┘                           │
│                             │                                     │
└─────────────────────────────┼─────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SurveySparrow   │
                    │   REST API v3    │
                    │                  │
                    │ api.surveysparrow│
                    │     .com         │
                    └──────────────────┘
```

**Project Structure:**

```
n8n-nodes-starter/
├── credentials/
│   └── SurveySparrowOAuth2Api.credentials.ts   # OAuth2 credential type
├── icons/
│   ├── surveysparrow.svg                       # Light-mode icon (credential)
│   └── surveysparrow.dark.svg                  # Dark-mode icon (credential)
├── nodes/SurveySparrow/
│   ├── SurveySparrow.node.ts                   # Action node (share + contact)
│   ├── SurveySparrow.node.json                 # Codex metadata (action node)
│   ├── SurveySparrowTrigger.node.ts            # Webhook trigger node
│   ├── SurveySparrowTrigger.node.json          # Codex metadata (trigger)
│   ├── surveysparrow.svg                       # Light-mode icon (nodes)
│   ├── surveysparrow.dark.svg                  # Dark-mode icon (nodes)
│   └── shared/
│       └── transport.ts                        # API request helpers
├── package.json                                # Package config + node registry
├── tsconfig.json                               # TypeScript configuration
└── docs/
    └── EN-N8N-Integration-Architecture.md      # This document
```

### Data Flow Diagrams

**OAuth2 Authentication Flow:**

```
User Opens n8n Credential UI
           │
           ▼
    Click "Connect my account"
           │
           ├─► n8n reads embedded OAuth2 config
           │   (clientId, clientSecret, authUrl, scopes — all hidden)
           │
           ├─► Redirect to SurveySparrow Authorization
           │   GET https://app.surveysparrow.com/o/oauth/auth
           │       ?client_id={embedded}
           │       &response_type=code
           │       &redirect_uri={n8n_callback}
           │       &scope=view_survey manage_survey view_contacts manage_contacts
           │
           ├─► User authorizes on SurveySparrow
           │
           ├─► Redirect back to n8n with authorization code
           │
           ├─► n8n exchanges code for tokens
           │   POST https://integration.surveysparrow.com/o/oauth/token
           │       client_id={embedded}
           │       client_secret={embedded}
           │       code={auth_code}
           │       grant_type=authorization_code
           │       (sent in POST body, not Basic Auth header)
           │
           └─► Access token + refresh token stored in n8n credential store
```

**Share Survey Flow (Email / SMS / WhatsApp):**

```
n8n Workflow Execution Starts
           │
           ▼
    Load Survey Dropdown
           │
           ├─► GET /v3/surveys (paginated, all pages)
           │   Response: { data: [{ id, name }, ...], has_next_page }
           │
           ▼
    User Selects Survey
           │
           ▼
    Load Channel Dropdown (filtered by type)
           │
           ├─► GET /v3/channels?survey_id={id}&type={EMAIL|SMS|WHATSAPP}
           │   Response: { data: [{ id, name }, ...], has_next_page }
           │
           ▼
    User Selects Channel
           │
           ▼
    Load Variable Dropdown (optional)
           │
           ├─► GET /v3/variables?survey_id={id}
           │   Response: { data: [{ name }, ...], has_next_page }
           │
           ▼
    User Fills Contact + Variables
           │
           ▼
    Execute API Call
           │
           ├─► PUT /v3/channels/{channel_id}
           │   Body: {
           │     "survey_id": 12345,
           │     "contacts": [{ "email": "user@example.com" }],
           │     "variables": { "name": "John", "company": "Acme" }
           │   }
           │
           └─► Response returned to workflow output
```

**Create Contact Flow:**

```
n8n Workflow Execution Starts
           │
           ▼
    User Fills Contact Fields
           │
           ├─► Email (optional)
           ├─► Name (optional)
           ├─► Mobile (optional)
           └─► Custom Properties (optional, key-value pairs)
           │
           ▼
    Validation
           │
           ├─► At least one of email/mobile must be present
           │   (throws NodeOperationError if both empty)
           │
           ▼
    Execute API Call
           │
           ├─► POST /v3/contacts
           │   Body: {
           │     "email": "user@example.com",
           │     "name": "John Doe",
           │     "mobile": "+15551234567",
           │     "customProp1": "value1"
           │   }
           │
           └─► Response returned to workflow output
```

**New Response Trigger — Webhook Lifecycle Flow:**

```
Workflow Activated (Published)
           │
           ▼
    checkExists()
           │
           ├─► Read webhookId from node static data
           │
           ├─► If no stored ID → return false → proceed to create()
           │
           ├─► If stored ID exists:
           │   ├─► GET /v3/webhooks/{storedId}
           │   │
           │   ├─► If 200 OK → return true (webhook exists, skip creation)
           │   │
           │   └─► If 404/error → clear stale ID → return false → proceed to create()
           │
           ▼
    create()
           │
           ├─► Get n8n webhook URL from runtime
           │
           ├─► POST /v3/webhooks
           │   Body: {
           │     "name": "n8n webhook",
           │     "url": "https://<n8n-host>/webhook/<path>",
           │     "survey_id": 12345,
           │     "http_method": "POST"
           │   }
           │
           ├─► Store webhook ID in node static data
           │
           └─► Webhook registered ✓

    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Survey Response Submitted in SurveySparrow
           │
           ▼
    SurveySparrow POSTs to n8n webhook URL
           │
           ▼
    webhook() handler
           │
           ├─► Parse incoming payload
           │   { submission, questions, surveyName, resultLink }
           │
           ├─► Transform: flatten questions + answers
           │   For each question:
           │     key = "<question text> ID:<question_id>"
           │     value = answer.answer (or answer.otherTxt if other=true)
           │
           ├─► Add metadata:
           │     submissionId, surveyName, resultLink
           │
           └─► Output to downstream workflow nodes

    ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─

Workflow Deactivated (Unpublished)
           │
           ▼
    delete()
           │
           ├─► Read webhookId from node static data
           │
           ├─► Clear local state immediately
           │   (prevents stale references regardless of API result)
           │
           ├─► DELETE /v3/webhooks/{storedId}
           │   (errors caught silently — webhook may already be gone)
           │
           └─► Webhook removed ✓
```

---

## 3. Low-Level Design Details

### Service Designs

#### 3.1 Transport Layer (nodes/SurveySparrow/shared/transport.ts)

**Overview:**

Provides shared authenticated HTTP request utilities used by both the action node and trigger node.

**Purpose and Responsibilities:**

- Execute authenticated API requests to SurveySparrow REST API v3
- Handle pagination for list endpoints
- Attach OAuth2 bearer token automatically via n8n credential helpers

**Interfaces and Data Contracts:**

| Function | Input | Output | Description |
|----------|-------|--------|-------------|
| `surveySparrowApiRequest` | `method, path, body?, qs?` | `IDataObject` | Single authenticated API call |
| `surveySparrowApiRequestAllItems` | `method, path, body?, qs?` | `IDataObject[]` | Paginated API call, returns all items |

**Configuration:**

| Parameter | Value |
|-----------|-------|
| Base URL | `https://api.surveysparrow.com` |
| Credential Name | `surveySparrowOAuth2Api` |
| Content-Type | `application/json` |
| Page Size | 100 items per page |
| Pagination Key | `has_next_page` (boolean) |

**Dependencies:** `n8n-workflow` (`IHttpRequestOptions`, `httpRequestWithAuthentication`)

#### 3.2 Credential Type (credentials/SurveySparrowOAuth2Api.credentials.ts)

**Overview:**

Defines the OAuth2 credential configuration. All fields are hidden from the user — they see only a "Connect my account" button.

**Purpose and Responsibilities:**

- Configure OAuth2 Authorization Code flow
- Embed client credentials (hidden from user)
- Set scopes and endpoint URLs

**Configuration:**

| Property | Type | Value |
|----------|------|-------|
| `grantType` | hidden | `authorizationCode` |
| `clientId` | hidden | Pre-configured client ID |
| `clientSecret` | hidden | Pre-configured client secret |
| `authUrl` | hidden | `https://app.surveysparrow.com/o/oauth/auth` |
| `accessTokenUrl` | hidden | `https://integration.surveysparrow.com/o/oauth/token` |
| `scope` | hidden | `view_survey manage_survey view_contacts manage_contacts` |
| `authentication` | hidden | `body` (credentials sent in POST body, not Basic Auth header) |

**Dependencies:** `n8n-workflow` (`ICredentialType`, extends `oAuth2Api`)

#### 3.3 Action Node (nodes/SurveySparrow/SurveySparrow.node.ts)

**Overview:**

Handles all non-trigger operations: sharing surveys via channels and creating contacts.

**Purpose and Responsibilities:**

- Render dynamic dropdowns for surveys, channels, and variables
- Build and execute API payloads for share and contact operations
- Handle per-item execution with error isolation

**Resources and Operations:**

| Resource | Operation | API Call | Description |
|----------|-----------|----------|-------------|
| Channel | `shareEmail` | `PUT /v3/channels/{id}` | Share survey via email channel |
| Channel | `shareSms` | `PUT /v3/channels/{id}` | Share survey via SMS channel |
| Channel | `shareWhatsApp` | `PUT /v3/channels/{id}` | Share survey via WhatsApp channel |
| Contact | `create` | `POST /v3/contacts` | Create a new contact |

**Load Options (Dynamic Dropdowns):**

| Method | API Call | Depends On | Description |
|--------|----------|------------|-------------|
| `getSurveys` | `GET /v3/surveys` | — | All surveys |
| `getEmailChannels` | `GET /v3/channels?type=EMAIL` | `surveyId` | Email channels for survey |
| `getSmsChannels` | `GET /v3/channels?type=SMS` | `surveyId` | SMS channels for survey |
| `getWhatsAppChannels` | `GET /v3/channels?type=WHATSAPP` | `surveyId` | WhatsApp channels for survey |
| `getVariables` | `GET /v3/variables` | `surveyId` | Variables defined in survey |

**User-Facing Fields per Operation:**

| Operation | Field | Type | Required | Source |
|-----------|-------|------|----------|--------|
| Share Email | Survey Name | Dropdown | Yes | `getSurveys` |
| Share Email | Email Share | Dropdown | Yes | `getEmailChannels` |
| Share Email | Contact Email | Text | Yes | User input |
| Share Email | Variables | Name dropdown + Value text | No | `getVariables` |
| Share SMS | Survey Name | Dropdown | Yes | `getSurveys` |
| Share SMS | SMS Share | Dropdown | Yes | `getSmsChannels` |
| Share SMS | Contact Mobile | Text | Yes | User input |
| Share SMS | Variables | Name dropdown + Value text | No | `getVariables` |
| Share WhatsApp | Survey Name | Dropdown | Yes | `getSurveys` |
| Share WhatsApp | WhatsApp Channel | Dropdown | Yes | `getWhatsAppChannels` |
| Share WhatsApp | Contact Mobile | Text | Yes | User input |
| Share WhatsApp | Variables | Name dropdown + Value text | No | `getVariables` |
| Create Contact | Email | Text | No* | User input |
| Create Contact | Name | Text | No | User input |
| Create Contact | Mobile | Text | No* | User input |
| Create Contact | Custom Properties | Name text + Value text | No | User input |

\* At least one of Email or Mobile is required.

**Dependencies:** `transport.ts`, `n8n-workflow` (`IExecuteFunctions`, `ILoadOptionsFunctions`, `NodeOperationError`)

#### 3.4 Trigger Node (nodes/SurveySparrow/SurveySparrowTrigger.node.ts)

**Overview:**

Webhook-based trigger that starts a workflow when a survey receives a new response.

**Purpose and Responsibilities:**

- Register/verify/delete webhooks on SurveySparrow via lifecycle hooks
- Receive and transform incoming submission payloads
- Provide survey dropdown for configuration

**Interfaces and Data Contracts:**

| Method | Type | Description |
|--------|------|-------------|
| `checkExists()` | Lifecycle | Verify webhook still exists via `GET /v3/webhooks/{id}` |
| `create()` | Lifecycle | Register webhook via `POST /v3/webhooks` |
| `delete()` | Lifecycle | Remove webhook via `DELETE /v3/webhooks/{id}` |
| `webhook()` | Handler | Receive and transform incoming POST payload |
| `getSurveys()` | Load Option | Populate survey dropdown |

**Webhook Registration Payload:**

```json
{
  "name": "n8n webhook",
  "url": "https://<n8n-host>/webhook/<workflow-path>",
  "survey_id": 12345,
  "http_method": "POST"
}
```

**Incoming Webhook Payload Transformation:**

| Input Field | Output Key | Description |
|-------------|------------|-------------|
| `questions[].question` + `questions[].id` | `"<question text> ID:<id>"` | Flattened question-answer pairs |
| `submission.answers[].answer` | (value for matched question) | Answer value |
| `submission.answers[].otherTxt` | (value if `other === true`) | "Other" text response |
| `submission.id` | `submissionId` | Submission identifier |
| `surveyName` | `surveyName` | Survey name |
| `resultLink` | `resultLink` | Link to submission result |

**Dependencies:** `transport.ts`, `n8n-workflow` (`IHookFunctions`, `IWebhookFunctions`)

---

## 4. Sequence Diagrams

### Share Survey via Email

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│  n8n    │     │ Action  │     │Transport │     │SurveyS-  │
│ Runtime │     │  Node   │     │  Layer   │     │ parrow   │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬─────┘
     │               │               │                 │
     │ loadOptions   │               │                 │
     │ (getSurveys)  │               │                 │
     │──────────────>│               │                 │
     │               │ apiRequestAll │                 │
     │               │ Items()       │                 │
     │               │──────────────>│ GET /v3/surveys │
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │<──────────────│               │                 │
     │               │               │                 │
     │ loadOptions   │               │                 │
     │ (getEmail     │               │                 │
     │  Channels)    │               │                 │
     │──────────────>│               │                 │
     │               │ apiRequestAll │                 │
     │               │ Items()       │                 │
     │               │──────────────>│ GET /v3/channels│
     │               │               │ ?type=EMAIL     │
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │<──────────────│               │                 │
     │               │               │                 │
     │ loadOptions   │               │                 │
     │ (getVariables)│               │                 │
     │──────────────>│               │                 │
     │               │ apiRequestAll │                 │
     │               │ Items()       │                 │
     │               │──────────────>│GET /v3/variables│
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │<──────────────│               │                 │
     │               │               │                 │
     │ execute()     │               │                 │
     │──────────────>│               │                 │
     │               │               │                 │
     │               │ Build payload │                 │
     │               │ { survey_id,  │                 │
     │               │   contacts,   │                 │
     │               │   variables } │                 │
     │               │               │                 │
     │               │ apiRequest()  │                 │
     │               │──────────────>│PUT /v3/channels │
     │               │               │  /{channel_id}  │
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │<──────────────│               │                 │
     │               │               │                 │
```

### New Response Trigger — Webhook Lifecycle

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│  n8n    │     │ Trigger │     │Transport │     │SurveyS-  │
│ Runtime │     │  Node   │     │  Layer   │     │ parrow   │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬─────┘
     │               │               │                 │
     │ Workflow      │               │                 │
     │ Activated     │               │                 │
     │──────────────>│               │                 │
     │               │               │                 │
     │               │ checkExists() │                 │
     │               │───────────────│                 │
     │               │               │                 │
     │               │ Read stored   │                 │
     │               │ webhookId     │                 │
     │               │───────────────│                 │
     │               │               │                 │
     │               │ apiRequest()  │                 │
     │               │──────────────>│GET /v3/webhooks │
     │               │               │  /{storedId}    │
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │               │               │                 │
     │               │ (if not found)│                 │
     │               │ create()      │                 │
     │               │───────────────│                 │
     │               │               │                 │
     │               │ apiRequest()  │                 │
     │               │──────────────>│POST /v3/webhooks│
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │               │               │                 │
     │               │ Store webhook │                 │
     │               │ ID in static  │                 │
     │               │ data          │                 │
     │<──────────────│               │                 │
     │               │               │                 │
     │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
     │               │               │                 │
     │               │               │   Submission    │
     │               │               │   Completed     │
     │               │               │<────────────────│
     │               │  POST to n8n  │                 │
     │               │  webhook URL  │                 │
     │               │<──────────────│                 │
     │               │               │                 │
     │               │ webhook()     │                 │
     │               │ Parse payload │                 │
     │               │ Transform     │                 │
     │               │ questions +   │                 │
     │               │ answers       │                 │
     │               │───────────────│                 │
     │               │               │                 │
     │ Workflow      │               │                 │
     │ continues     │               │                 │
     │<──────────────│               │                 │
     │               │               │                 │
     │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
     │               │               │                 │
     │ Workflow      │               │                 │
     │ Deactivated   │               │                 │
     │──────────────>│               │                 │
     │               │               │                 │
     │               │ delete()      │                 │
     │               │ Clear local   │                 │
     │               │ state first   │                 │
     │               │───────────────│                 │
     │               │               │                 │
     │               │ apiRequest()  │                 │
     │               │──────────────>│DELETE /v3/      │
     │               │               │webhooks/{id}    │
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │<──────────────│               │                 │
     │               │               │                 │
```

### Create Contact

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌──────────┐
│  n8n    │     │ Action  │     │Transport │     │SurveyS-  │
│ Runtime │     │  Node   │     │  Layer   │     │ parrow   │
└────┬────┘     └────┬────┘     └────┬─────┘     └────┬─────┘
     │               │               │                 │
     │ execute()     │               │                 │
     │──────────────>│               │                 │
     │               │               │                 │
     │               │ Validate:     │                 │
     │               │ email or      │                 │
     │               │ mobile present│                 │
     │               │───────────────│                 │
     │               │               │                 │
     │               │ Build payload │                 │
     │               │ { email, name,│                 │
     │               │   mobile,     │                 │
     │               │   ...custom } │                 │
     │               │               │                 │
     │               │ apiRequest()  │                 │
     │               │──────────────>│POST /v3/contacts│
     │               │               │────────────────>│
     │               │               │<────────────────│
     │               │<──────────────│                 │
     │<──────────────│               │                 │
     │               │               │                 │
```

---

## 5. Non-Functional Requirements

### Performance

**Impact:**

- **Share Operations:** Single API call per contact per execution. Latency depends on SurveySparrow API response time (typically 200–500ms).

- **Dropdown Loading:** Survey and channel lists are fetched with full pagination (100 items per page). For accounts with many surveys/channels, initial load may take 1–2 seconds.

- **Webhook Trigger:** Zero-latency model — SurveySparrow pushes data to n8n in real-time when a submission occurs. No polling overhead.

- **Webhook Lifecycle:** `checkExists()` adds one GET call per workflow activation to verify the webhook is still registered on SurveySparrow's side.

### Scalability

**Design Considerations:**

- Pagination for all list endpoints (100 per page, auto-traverses all pages)
- Per-item execution loop in action node — n8n can feed multiple items through a single node
- Webhook model scales independently of n8n polling intervals
- Node static data (per-node scope) ensures webhook IDs don't conflict across workflows

### Security

- OAuth2 client credentials are embedded in the credential type with `type: 'hidden'` — never exposed in the UI
- Access tokens are stored in n8n's encrypted credential store
- Token refresh is handled automatically by n8n's built-in OAuth2 infrastructure
- No secrets are logged or included in workflow execution data
- Webhook URLs are unique per workflow and generated by n8n's runtime

### Maintainability

**Code Organization:**

| File | Lines | Responsibility |
|------|-------|----------------|
| `transport.ts` | ~75 | API request utilities (single responsibility) |
| `SurveySparrowOAuth2Api.credentials.ts` | ~69 | Credential configuration |
| `SurveySparrow.node.ts` | ~536 | Action node (resources, operations, loadOptions, execute) |
| `SurveySparrowTrigger.node.ts` | ~198 | Trigger node (webhook lifecycle, payload transform) |

**Conventions:**

- TypeScript with strict types from `n8n-workflow`
- All API calls routed through the shared transport layer
- `continueOnFail()` support for graceful error handling in workflows
- Consistent `IDataObject` usage for API payloads and responses

---

## 6. Testing Strategies

### Test Cases to Cover

1. **Unit Tests:**
   - Variable name-to-value mapping from fixedCollection
   - Contact validation (email or mobile required)
   - Webhook payload transformation (questions + answers flattening)
   - Custom property merging into contact body

2. **Integration Tests:**
   - OAuth2 token exchange and refresh
   - Survey list pagination
   - Channel filtering by type
   - Share execution (Email, SMS, WhatsApp)
   - Contact creation with custom properties
   - Webhook registration, verification, and deletion

3. **End-to-End Tests:**
   - Full workflow: Trigger → process submission → share to another contact
   - Workflow activate → submit survey → verify trigger fires → deactivate → verify webhook deleted

---

## Appendix

### API Endpoints

**SurveySparrow REST API v3:**

- Base URL: `https://api.surveysparrow.com`
- Authentication: OAuth 2.0 Bearer Token

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v3/surveys` | GET | List all surveys (paginated) |
| `/v3/channels?survey_id={id}&type={type}` | GET | List channels for a survey, filtered by type |
| `/v3/channels/{channel_id}` | PUT | Share survey via channel (send to contacts) |
| `/v3/variables?survey_id={id}` | GET | List variables defined in a survey |
| `/v3/contacts` | POST | Create a new contact |
| `/v3/webhooks` | POST | Register a new webhook |
| `/v3/webhooks/{id}` | GET | Get webhook details |
| `/v3/webhooks/{id}` | DELETE | Delete a webhook |

**SurveySparrow OAuth2:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/o/oauth/auth` | GET | Authorization URL (redirect) |
| `/o/oauth/token` | POST | Token exchange and refresh |

### n8n Node Registry (package.json)

```json
{
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/SurveySparrowOAuth2Api.credentials.js"
    ],
    "nodes": [
      "dist/nodes/SurveySparrow/SurveySparrow.node.js",
      "dist/nodes/SurveySparrow/SurveySparrowTrigger.node.js"
    ]
  }
}
```

### Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| 400 | Bad Request — invalid payload | Check required fields (email format, mobile E.164, survey_id) |
| 401 | Unauthorized — expired token | n8n auto-refreshes; if persistent, re-authenticate |
| 404 | Not Found — invalid resource ID | Verify survey, channel, or webhook ID exists |
| 409 | Conflict — duplicate contact | Contact with same email/mobile already exists |
| 429 | Rate limit exceeded | Configure n8n retry settings on the node |
| 500 | Internal server error | Check SurveySparrow status; retry later |
