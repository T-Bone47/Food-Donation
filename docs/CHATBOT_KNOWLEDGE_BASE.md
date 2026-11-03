# FoodShare AI Chatbot — Knowledge Base & RAG Architecture

## 1. Knowledge Base Philosophy

In safety-critical domains such as food donation, logistics, and public health, hallucinated policies or inaccurate shelf-life recommendations can lead to foodborne illness or operational failures.

The **FoodShare Knowledge Base** implements a curated, bounded retrieval paradigm:
1. **Verified Single Source of Truth**: All procedural guidance (food standards, volunteer safety, claim rules, NGO receipt verification) is sourced from validated operational documents.
2. **Zero Synthetic Hallucinations**: When a query cannot be answered by grounded knowledge passages or backend tools, the system explicitly refuses or clarifies rather than inventing rules.
3. **Deterministic Retrieval**: In-memory BM25 indexing guarantees deterministic scoring, sub-millisecond retrieval, and zero external vector database dependencies.

---

## 2. Passage Data Structure & Schema

Each curated knowledge passage conforms to the following schema defined in [`chatbot_api/knowledge_base.py`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/chatbot_api/knowledge_base.py):

```python
{
    "id": str,               # Unique slug identifier (e.g. 'kb_food_guidelines')
    "title": str,            # Human-readable title
    "role_affinity": str,    # Target role: 'donor', 'volunteer', 'ngo', 'admin', 'general'
    "category": str,         # Domain category (e.g., 'guidelines', 'operations', 'policy')
    "content": str,          # Grounded operational text (Markdown formatted)
    "sources": List[str]     # Source documents / policy sections
}
```

---

## 3. Catalog of Curated Knowledge Passages

The knowledge base currently comprises 13 authoritative passages covering the entire donation lifecycle:

| Passage ID | Title | Affinity | Category | Primary Policy Topics |
| :--- | :--- | :--- | :--- | :--- |
| `kb_platform_overview` | Platform Purpose & Roles | `general` | overview | Core mission, connecting donors, volunteers, NGOs, reducing waste. |
| `kb_donor_guide` | Donor Guide & Listing Steps | `donor` | guide | Creating listings, packaging, temperature rules, pickup windows. |
| `kb_food_guidelines` | Food Safety & Eligibility Standards | `donor` | safety | Acceptable foods, prohibited items (raw meats, expired dairy), packaging. |
| `kb_volunteer_guide` | Volunteer Operations & Task Lifecycle| `volunteer`| operations | Claiming tasks, pickup protocol, delivery verification, OTP confirmation. |
| `kb_ngo_guide` | NGO Receipt & Verification Process | `ngo` | operations | Onboarding, inspection upon arrival, digital receipting, storage capacity. |
| `kb_admin_guide` | Administrator Monitoring & Governance| `admin` | operations | User suspension, audit logging, system health, dispute escalation. |
| `kb_donation_lifecycle` | Donation State Machine & Statuses | `general` | lifecycle | Canonical transitions: AVAILABLE -> CLAIMED -> PICKED_UP -> DELIVERED. |
| `kb_expiry_deadlines` | Timezone & Expiration Protocols | `general` | safety | Local timezone conversion, automatic expiration, urgent pickup windows. |
| `kb_notifications` | Notification & Alert Matrix | `general` | notifications | Real-time alerts for claims, pickups, cancellations, and delivery events. |
| `kb_privacy_security` | Privacy, Security & Data Boundaries | `general` | security | Role-based data isolation, HMAC token verification, no PII exposure. |
| `kb_dispute_resolution`| Exception Handling & Escalation | `general` | support | No-show donors, spoiled food rejection, closed NGO delivery protocols. |
| `kb_faq` | Frequently Asked Questions | `general` | faq | Common onboarding, tax receipts, vehicle types, service hours. |
| `kb_cancellation_policy`| Cancellation & Reassignment Rules | `general` | policy | Permitted cancellation windows (prior to pickup only), auto-reassignment. |

---

## 4. In-Memory BM25 Retrieval Engine

### 4.1 Tokenization & Linguistic Normalization
Implemented in [`chatbot_api/retriever.py`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/chatbot_api/retriever.py):
1. **Case Normalization**: All incoming text is converted to lowercase.
2. **Punctuation & Noise Stripping**: Non-alphanumeric characters are stripped.
3. **Stop-Word Removal**: Standard English functional stop words (`the`, `is`, `at`, `which`, `on`, `and`, `a`, etc.) are removed to focus on semantic content terms.

### 4.2 Okapi BM25 Mathematical Formulation
For a user query $Q$ with terms $q_1, q_2, \dots, q_n$, the BM25 relevance score for document $D$ is computed as:

$$\text{Score}(D, Q) = \sum_{i=1}^{n} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

Where:
* $f(q_i, D)$ is the frequency of query term $q_i$ in document $D$.
* $|D|$ is the length of document $D$ in words.
* $\text{avgdl}$ is the average document length across the 13 curated passages.
* $k_1 = 1.5$ regulates term frequency saturation.
* $b = 0.75$ controls document length normalization.
* $\text{IDF}(q_i)$ is the Robertson-Spärck Jones inverse document frequency:
  $$\text{IDF}(q_i) = \ln\left(\frac{N - n(q_i) + 0.5}{n(q_i) + 0.5} + 1\right)$$

### 4.3 Context-Aware Role Boosting
When a query is processed for an authenticated user with role $R$:
$$\text{Score}_{\text{final}}(D, Q) = \begin{cases} \text{Score}(D, Q) \times 1.25 & \text{if } D.\text{role\_affinity} = R \\ \text{Score}(D, Q) & \text{otherwise} \end{cases}$$

This ensures that when a volunteer asks "How do I claim?", the volunteer procedures receive priority over donor or administrator guidelines.

### 4.4 Relevance Thresholding & Hallucination Avoidance
* A minimum score threshold of **$0.50$** is enforced.
* If all retrieved passages fall below $0.50$ and the intent is not a platform tool or greeting:
  - The system triggers an out-of-domain refusal.
  - The model does not attempt to extrapolate or fabricate facts.

---

## 5. Source Attribution & Citations

Every grounded response includes verified source metadata returned in the JSON payload under `sources`:

```json
"sources": [
  {
    "id": "kb_food_guidelines",
    "title": "Food Safety & Eligibility Standards",
    "category": "safety",
    "score": 2.14
  }
]
```

The frontend displays these source references, enabling users to trace guidance directly to platform policies.

---

## 6. Maintenance & Knowledge Update SOP

1. **Adding a Passage**:
   - Create a new entry in `KNOWLEDGE_BASE_RAW` in [`chatbot_api/knowledge_base.py`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/chatbot_api/knowledge_base.py).
   - Ensure explicit `role_affinity` (`donor`, `volunteer`, `ngo`, `admin`, or `general`).
   - Run `python -m unittest test_evaluation.py` to verify that all 18 evaluation tests pass without regression.
2. **Modifying Existing Guidance**:
   - Update text in the relevant passage.
   - Update `last_updated` timestamp.
   - The in-memory BM25 index recomputes inverted indices and IDF weights automatically on application boot.

