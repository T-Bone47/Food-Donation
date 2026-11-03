# 06 — API Integration & Contract Matrix

## 1. Unified Contract Standards
- **Protocol:** HTTP/1.1 REST
- **Base URLs:**
  - Express API: `http://localhost:5000/api/v1`
  - Flask Chatbot: `http://localhost:5002`
- **Envelope Standard:**
  - Success: `{ "data": { ... }, "meta": { "requestId": "uuid" } }`
  - Error: `{ "error": { "code": "STRING", "message": "STRING" }, "meta": { "requestId": "uuid" } }`

## 2. Exhaustive Endpoint Specifications

| Route Path | Method | Auth Required | Request Body / Query | Expected Response Envelope |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | POST | None | `{ email, password }` | `{ data: { user, token } }` |
| `/demo/session` | POST | None | `{ role: "donor"\|"volunteer"\|"ngo"\|"admin" }` | `{ data: { user, token } }` |
| `/demo/reset` | POST | Demo Token | None | `{ data: { message } }` |
| `/donations` | POST | Donor | `{ title, food_category, quantity, unit, ... }` | `{ data: { donation } }` |
| `/donations/mine` | GET | Donor | `?status=&limit=&offset=` | `{ data: { donations: [] } }` |
| `/donations/available` | GET | Volunteer/NGO | `?limit=&offset=` | `{ data: { donations: [] } }` |
| `/donations/:id/claim` | POST | Volunteer | None | `{ data: { donation, assignment } }` |
| `/donations/:id/pickup` | POST | Volunteer | None | `{ data: { donation } }` |
| `/donations/:id/deliver`| POST | Volunteer | None | `{ data: { donation } }` |
| `/donations/:id/confirm`| POST | NGO | None | `{ data: { donation } }` |
| `/impact/donor` | GET | Donor | None | `{ data: { stats: { ... } } }` |
| `/impact/volunteer` | GET | Volunteer | None | `{ data: { stats: { ... } } }` |
| `/ngos/deliveries` | GET | NGO | None | `{ data: { deliveries: [] } }` |
| `/admin/stats` | GET | Admin | None | `{ data: { stats: { ... } } }` |
| `/admin/users` | GET | Admin | None | `{ data: { users: [] } }` |
| `/admin/audit-logs` | GET | Admin | None | `{ data: { logs: [] } }` |
| `/chat` (Port 5002) | POST | None / Bearer | `{ message, conversation_id }` | `{ response, conversation_id, sources }` |
| `/health` (Port 5002)| GET | None | None | `{ status: "healthy", service: "FoodShare Chatbot" }` |

