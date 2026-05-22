# n8n Workflow Modification Guide — Conversation Stage Tracking

## Overview

The dashboard now tracks where each client is in the bot's sales conversation funnel. The bot needs to call a Supabase RPC endpoint at specific moments to update the client's stage and store BMI data.

---

## API Endpoint

```
POST https://<YOUR_PROJECT>.supabase.co/rest/v1/rpc/update_client_stage
```

### Headers (same for all calls)

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `apikey` | `<YOUR_SUPABASE_ANON_KEY>` |
| `Authorization` | `Bearer <YOUR_SUPABASE_SERVICE_ROLE_KEY>` |

### Body Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `p_platform_user_id` | string | ✅ | The user's platform ID (Facebook PSID, Instagram IGSID, etc.) |
| `p_channel_id` | UUID | ✅ | The channel UUID from the dashboard |
| `p_stage` | string | ✅ | One of: `first_contact`, `bmi_collected`, `testimonials_viewed`, `price_viewed`, `purchased` |
| `p_bmi_data` | JSON object | ❌ | Only needed for `bmi_collected` stage: `{"weight": 87, "height": 175, "age": 30, "bmi": 28.4}` |

### Response

```json
// Success
{"success": true, "client_id": "uuid-here", "stage": "bmi_collected"}

// Error — contact not found
{"success": false, "error": "Contact not found"}

// Error — CRM client not found
{"success": false, "error": "CRM client not found"}
```

---

## Where to Add HTTP Nodes in n8n

### Stage 1: `bmi_collected` — After BMI Calculation

**When:** The bot has collected weight, height, and age, and calculated the BMI.

**Add an HTTP Request node** right after the BMI calculation step:

```
Method: POST
URL: https://<PROJECT>.supabase.co/rest/v1/rpc/update_client_stage

Headers:
  Content-Type: application/json
  apikey: <ANON_KEY>
  Authorization: Bearer <SERVICE_ROLE_KEY>

Body (JSON):
{
  "p_platform_user_id": "{{ $json.sender_id }}",
  "p_channel_id": "<CHANNEL_UUID>",
  "p_stage": "bmi_collected",
  "p_bmi_data": {
    "weight": {{ $json.weight }},
    "height": {{ $json.height }},
    "age": {{ $json.age }},
    "bmi": {{ $json.bmi }}
  }
}
```

> **Note:** Replace `$json.sender_id`, `$json.weight`, etc. with the actual field names from your n8n workflow variables.

---

### Stage 2: `testimonials_viewed` — After Showing Testimonials

**When:** The bot sends testimonials/before-after images to the client.

**Add an HTTP Request node** right after the testimonials message node:

```
Method: POST
URL: https://<PROJECT>.supabase.co/rest/v1/rpc/update_client_stage

Body (JSON):
{
  "p_platform_user_id": "{{ $json.sender_id }}",
  "p_channel_id": "<CHANNEL_UUID>",
  "p_stage": "testimonials_viewed"
}
```

> No `p_bmi_data` needed for this stage.

---

### Stage 3: `price_viewed` — After Showing the Price/Offer

**When:** The bot sends the pricing message or offer details.

**Add an HTTP Request node** right after the pricing message node:

```
Method: POST
URL: https://<PROJECT>.supabase.co/rest/v1/rpc/update_client_stage

Body (JSON):
{
  "p_platform_user_id": "{{ $json.sender_id }}",
  "p_channel_id": "<CHANNEL_UUID>",
  "p_stage": "price_viewed"
}
```

---

### Stage 4: `purchased` — After Successful Purchase

**When:** The client confirms purchase / payment is received / order is created.

**Add an HTTP Request node** at the end of the purchase confirmation flow:

```
Method: POST
URL: https://<PROJECT>.supabase.co/rest/v1/rpc/update_client_stage

Body (JSON):
{
  "p_platform_user_id": "{{ $json.sender_id }}",
  "p_channel_id": "<CHANNEL_UUID>",
  "p_stage": "purchased"
}
```

---

## How to Get the Values

### `p_platform_user_id`
This is the sender's platform ID that your webhook already receives. It's usually called:
- `sender.id` (Facebook Messenger)
- `sender_id` or `from.id` (Telegram)
- The same ID stored in the `contacts.platform_user_id` column

### `p_channel_id`
This is the UUID of the channel in the dashboard. You can find it by:
1. Going to **Channel Management** in the dashboard
2. Clicking **Configure** on the channel
3. The UUID is in the URL: `/channels/<THIS_UUID>/settings`

You can store this as a **static variable** or **environment variable** in n8n since it doesn't change per message.

---

## n8n Node Configuration (Step by Step)

### 1. Add an HTTP Request Node

- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://<PROJECT>.supabase.co/rest/v1/rpc/update_client_stage`

### 2. Authentication Tab

- **Authentication:** None (we use headers)

### 3. Headers Tab

Add these 3 headers:

| Name | Value |
|------|-------|
| `Content-Type` | `application/json` |
| `apikey` | `eyJ...` (your Supabase anon key) |
| `Authorization` | `Bearer eyJ...` (your Supabase service_role key) |

### 4. Body Tab

- **Body Content Type:** JSON
- **Specify Body:** Using JSON
- Paste the JSON body for the specific stage (see examples above)

### 5. Settings Tab

- **Continue On Fail:** ✅ Enable this so the bot flow doesn't break if the CRM update fails
- **Timeout:** 10000 (10 seconds)

---

## Workflow Diagram

```
User Message
    │
    ▼
[Webhook Receive]
    │
    ▼
[AI Process Message]
    │
    ├── Bot collects weight/height/age ──► [HTTP: stage = bmi_collected + bmi_data]
    │
    ├── Bot sends testimonials ──────────► [HTTP: stage = testimonials_viewed]
    │
    ├── Bot sends price ─────────────────► [HTTP: stage = price_viewed]
    │
    └── Client purchases ────────────────► [HTTP: stage = purchased]
```

---

## Testing

### Quick Test via n8n

1. Create a manual workflow with just an HTTP Request node
2. Use a known `platform_user_id` from your contacts
3. Use the channel UUID from the dashboard
4. Send a test call:

```json
{
  "p_platform_user_id": "1234567890",
  "p_channel_id": "your-channel-uuid-here",
  "p_stage": "bmi_collected",
  "p_bmi_data": {"weight": 80, "height": 170, "age": 28, "bmi": 27.7}
}
```

5. Check the response — should return `{"success": true, ...}`
6. Verify in the dashboard: go to Clients → find the client → check their tags for `stage:bmi_collected`

### Quick Test via Supabase SQL Editor

```sql
SELECT * FROM public.update_client_stage(
  '1234567890',           -- platform_user_id
  'your-channel-uuid',    -- channel_id
  'bmi_collected',        -- stage
  '{"weight": 80, "height": 170, "age": 28, "bmi": 27.7}'::jsonb  -- bmi_data
);
```

---

## Important Notes

- **Stages only go forward** — the function allows setting any stage, but the analytics funnel assumes forward progression. Don't set `first_contact` after `bmi_collected`.
- **BMI data is only needed once** — send `p_bmi_data` only with the `bmi_collected` stage. Other stages don't need it.
- **Tags are auto-updated** — each stage update adds a `stage:xxx` tag to the client for easy filtering in the client list.
- **Continue On Fail** — always enable this on the HTTP nodes so the bot continues even if the CRM call fails.
- **The `first_contact` stage** is set automatically when a new CRM client is created — no n8n call needed for this one.
