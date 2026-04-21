# Document Generation API

A generic Node.js + Express API for generating `.docx` files from Docxtemplater templates. The API is template-agnostic: clients send a template name plus a `data` object, and the service renders whatever placeholders and loops the template defines. Built on the standard Docxtemplater Node flow of loading a `.docx`, rendering tags from a data object, and exporting a buffer.[1][2]

## Features

- Generic `POST /generate-document` endpoint that accepts `{ template, data }` and passes `data` directly to Docxtemplater for rendering.[2]
- `GET /templates` endpoint to list available `.docx` templates from the templates directory.
- `GET /templates/:template/tags` endpoint to inspect a template and return a human-readable summary of scalar fields and loop fields using Docxtemplater's inspect capabilities.[3][4]
- Docker support with `Dockerfile`, `.dockerignore`, and `compose.yaml`, following common Docker practices like excluding unnecessary files from the build context and using Compose for environment variables and local bind mounts.[5][6][7]

## Project Structure

```text
doc-gen-service/
├── Dockerfile
├── .dockerignore
├── compose.yaml
├── .env
├── package.json
├── package-lock.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── env.js
│   ├── routes/
│   │   ├── generateDocument.js
│   │   └── templates.js
│   ├── services/
│   │   ├── documentService.js
│   │   └── templateService.js
│   └── utils/
│       └── filename.js
├── templates/
└── output/
```

## Requirements

- Node.js 20+
- npm
- Docker and Docker Compose plugin, if running the containerized version. Docker Compose uses `compose.yaml` in the project directory and supports environment files and bind mounts for local development.[8][7]

## Environment Variables

Create a `.env` file in the project root with the following values:

```env
PORT=8000
TEMPLATES_DIR=templates
OUTPUT_DIR=output
```

### Variables

| Variable | Example | Purpose |
|---|---|---|
| `PORT` | `8000` | Port the Express server listens on. |
| `TEMPLATES_DIR` | `templates` | Relative directory containing `.docx` template files. |
| `OUTPUT_DIR` | `output` | Relative directory where generated documents are written. |

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create the environment file:

```bash
cp .env.example .env
```

If there is no `.env.example` yet, create `.env` manually using the variables above.

3. Make sure your templates directory exists and contains at least one `.docx` template, for example:

```text
templates/master_service_agreement_template.docx
```

4. Start the API:

```bash
npm run dev
```

If your app has only a start script, use:

```bash
npm start
```

## Docker Setup

The Docker version mounts `./templates` and `./output` into the container so templates and generated files remain on your machine instead of being baked into the container filesystem. Docker build guidance recommends minimizing build context and Compose supports `.env` files and bind mounts for this setup.[5][6][7]

### Build and run

```bash
docker compose up --build
```

### Stop containers

```bash
docker compose down
```

`docker compose down` stops and removes the containers and networks created by Compose, while `docker compose down -v` also removes attached volumes.[9]

## API Endpoints

### `GET /health`

Health check endpoint.

Example:

```bash
curl http://localhost:8000/health
```

Expected response:

```json
{
  "ok": true
}
```

### `GET /templates`

Lists available `.docx` templates in the configured templates directory.

Example:

```bash
curl http://localhost:8000/templates
```

### `GET /templates/:template/tags`

Returns a readable summary of the template's scalar placeholders and repeating loop fields. Docxtemplater's inspect tooling exposes structured tag information that can be transformed into a field summary for payload building.[3][10][4]

Example:

```bash
curl http://localhost:8000/templates/master_service_agreement_template/tags
```

Optional raw debug output:

```bash
curl "http://localhost:8000/templates/master_service_agreement_template/tags?raw=1"
```

### `POST /generate-document`

Renders a `.docx` file from the specified template using the provided `data` object. Docxtemplater resolves placeholders and loops directly from the object passed into `render(...)`, so the JSON keys must match the template tag names exactly.[2][11]

## Request Format

```json
{
  "template": "template_name_without_extension",
  "data": {
    "some_field": "some value",
    "some_loop": [
      {
        "child_field": "value"
      }
    ]
  }
}
```

### Rules

- If the template contains `{client_name}`, send `data.client_name`.
- If the template contains `{#line_items}{description}{/line_items}`, send `data.line_items` as an array of objects.
- If a template contains multiple loops, each loop key must exist under `data` with the exact matching name.[2][11]

## Sample Contract Request

This example matches a contract-style template such as `master_service_agreement_template.docx`, including scalar fields and multiple repeating table rows.

```bash
curl -X POST http://localhost:8000/generate-document \
  -H "Content-Type: application/json" \
  -d @payload.json
```

Example `payload.json`:

```json
{
  "template": "master_service_agreement_template",
  "data": {
    "effective_date": "2026-04-12",
    "provider_legal_name": "Northstar Digital Solutions Inc.",
    "provider_jurisdiction": "Ontario",
    "provider_address": "151 King Street West, Suite 2200, Toronto, ON M5H 1J9",
    "client_legal_name": "Acme Growth Partners Ltd.",
    "client_jurisdiction": "Delaware",
    "client_address": "350 Fifth Avenue, 59th Floor, New York, NY 10118",
    "provider_contact_name": "James Rich",
    "provider_contact_title": "Lead Software Consultant",
    "provider_contact_email": "James@example.com",
    "client_contact_name": "Melissa Grant",
    "client_contact_title": "Director of Operations",
    "client_contact_email": "melissa.grant@acmegrowth.com",
    "provider_notice_address": "legal@northstar.example.com",
    "client_notice_address": "legal@acmegrowth.com",
    "sow_number": "SOW-2026-014",
    "project_name": "Client Document Automation Platform",
    "project_description": "Provider will design, implement, test, and deliver a document generation API and template workflow for Client commercial operations team, including local template rendering, contract generation, milestone tables, fee schedules, and deployment documentation.",
    "project_start_date": "2026-04-15",
    "project_end_date": "2026-06-30",
    "delivery_deadline": "2026-06-30",
    "currency": "USD",
    "payment_terms": "Net 15 from invoice date",
    "late_fee_clause": "1.5% per month on overdue undisputed amounts",
    "deposit_required": "Yes",
    "deposit_amount": "$8,000",
    "maximum_contract_value": "$42,500",
    "subtotal": "$38,000",
    "tax_total": "$4,500",
    "grand_total": "$42,500",
    "confidentiality_period": "5 years after termination",
    "dpa_included": "Yes",
    "ip_ownership": "Client owns final deliverables upon full payment; Provider retains pre-existing materials and know-how",
    "warranty_period": "30 days from final acceptance",
    "liability_cap": "Fees paid under this Agreement in the 12 months preceding the claim",
    "termination_notice_period": "30 days written notice",
    "governing_law": "Ontario, Canada",
    "dispute_venue": "Toronto, Ontario",
    "provider_signatory_name": "James Rich",
    "provider_signatory_title": "Lead Software Consultant",
    "provider_signature_date": "2026-04-12",
    "client_signatory_name": "Melissa Grant",
    "client_signatory_title": "Director of Operations",
    "client_signature_date": "2026-04-12",
    "milestones": [
      {
        "name": "Discovery and Template Audit",
        "description": "Review existing Word templates, identify placeholder schema, and finalize MVP rendering approach.",
        "due_date": "2026-04-22",
        "amount": "$6,500"
      },
      {
        "name": "Core Rendering Engine",
        "description": "Implement local document generation, output file handling, and baseline error validation.",
        "due_date": "2026-05-06",
        "amount": "$12,000"
      },
      {
        "name": "Advanced Contract Tables",
        "description": "Add repeating table support for milestones, deliverables, team roles, assumptions, and fee schedules.",
        "due_date": "2026-05-27",
        "amount": "$11,500"
      }
    ],
    "deliverables": [
      {
        "deliverable_id": "D-01",
        "description": "Express API with /generate-document endpoint",
        "owner": "Provider",
        "acceptance_criteria": "Endpoint returns valid generated .docx from approved template payload"
      },
      {
        "deliverable_id": "D-02",
        "description": "Template authoring guide for business users",
        "owner": "Provider",
        "acceptance_criteria": "Guide explains placeholders, loops, and table row setup in Word"
      }
    ],
    "team_members": [
      {
        "name": "James Rich",
        "role": "Lead Engineer",
        "allocation": "60%"
      },
      {
        "name": "Maya Chen",
        "role": "Project Manager",
        "allocation": "20%"
      }
    ],
    "assumptions": [
      {
        "type": "Assumption",
        "detail": "Client will provide final approved templates and sample content before development starts."
      },
      {
        "type": "Dependency",
        "detail": "Client stakeholders will review milestone outputs within 3 business days of submission."
      }
    ],
    "fee_items": [
      {
        "item": "Architecture and planning",
        "quantity": "1",
        "unit_price": "$5,000",
        "tax": "$650",
        "line_total": "$5,650"
      },
      {
        "item": "API and rendering engine development",
        "quantity": "1",
        "unit_price": "$18,000",
        "tax": "$2,340",
        "line_total": "$20,340"
      }
    ]
  }
}
```

## Response Example

```json
{
  "success": true,
  "filename": "master_service_agreement_template-2026-04-20T21-30-00-000Z.docx",
  "path": "output/master_service_agreement_template-2026-04-20T21-30-00-000Z.docx"
}
```

## Authoring Templates

Docxtemplater loops depend on the actual tag names and structure inside the Word document. For example, a loop written as `{#milestones}...{/milestones}` expects an array at `data.milestones`, and table loops must be authored correctly inside Word rows for repeated rows to render as intended.[11][3]

Practical rules:
- Keep scalar placeholders simple, for example `{client_name}`.
- Use arrays for loop blocks, for example `{#line_items}` ... `{/line_items}`.[11]
- When using table rows, place loop tags in the row structure correctly so Docxtemplater can repeat the row.

## Troubleshooting

### `Template not found`

Make sure the `.docx` file exists in the configured templates directory and the request uses the template name without the `.docx` extension.

### Tables render empty

This usually means one of two things:
- the JSON keys do not match the loop names in the template, or
- the Word table loop tags were authored incorrectly.[11]

### `req.body` is undefined

Make sure Express JSON parsing is enabled before the routes with:

```js
app.use(express.json());
```

### Large curl payloads are annoying

For large requests, put the JSON into a file such as `payload.json` and send it with:

```bash
curl -X POST http://localhost:8000/generate-document \
  -H "Content-Type: application/json" \
  --data @payload.json
```
