# VantaPrompt

Placeholder overview for the Agentic AI Data Loss Prevention (AI-DLP) platform.
VantaPrompt: AI Data Loss Prevention Platform

## 🚨 The Critical Need for AI-DLP

### The New Attack Vector: Prompt Injection
Traditional security focused on protecting data at rest and in transit. Now we face a new threat: **data exfiltration through AI prompts**. Malicious actors can craft prompts to extract sensitive information from AI systems that have access to confidential data.

### Why Traditional DLP Isn't Enough
- **Context Blindness**: Legacy DLP tools can't understand the semantic meaning of prompts
- **AI-Native Threats**: New attack vectors like prompt injection, jailbreaking, and data poisoning
- **Real-Time Processing**: AI interactions happen in milliseconds—detection must be instantaneous
- **Intent Analysis**: Need to understand not just what data is present, but what the user intends to do with it

## 🏦 Banking Platform Security: The Ultimate Test Case

### High-Stakes Environment
Banking platforms represent the most critical use case for AI-DLP:
- **Customer PII**: Names, SSNs/IC numbers, account numbers, transaction histories
- **Financial Records**: Credit scores, loan applications, investment portfolios
- **Regulatory Compliance**: SOX, PCI DSS, GDPR, CCPA, local data residency requirements
- **Real-Time Decisions**: Fraud detection, loan approvals, trading algorithms

### Unique Banking Vulnerabilities

#### 1. **Customer Service AI Exposure**
```
Risky Prompt: "Show me account details for customer John Smith to help with his complaint"
Safe Prompt: "What are our general policies for handling customer complaints?"
```

#### 2. **Internal Process Automation**
```
Dangerous: AI with access to loan databases being prompted to "export all declined applications from last month"
Secure: Controlled access with specific, validated query templates
```

#### 3. **Regulatory Reporting Risks**
- AI systems generating compliance reports could be manipulated to hide violations
- Audit trail corruption through prompt-based data modification

---

## 🔐 Context Engineering Security: Technical Specification

VantaPrompt enforces a defense-in-depth pipeline that guarantees only safe, purpose-limited context reaches any LLM.

### ⭐ Method 1 — Local Pre-Filter (Sensitive Data Stripping)
A local detection engine runs in your backend before any third-party model call.

Detectors:
- Regex and structured pattern matchers
- Heuristics + keyword clusters (e.g., "SSN", "IC", "PAN", "account #", "password")
- Entropy checks (detect secrets/keys)
- Compression signatures (indicative of pasted dumps)
- Hash detection (SHA-1/256, MD5)
- PII detectors: email, IC/SSN, phone, passport, mailing address

This layer blocks, by default:
- IC/SSN, credit cards (PAN), passwords, emails, customer names
- Internal URLs/tokens, AWS/GCP/Azure keys, bearer/JWT tokens
- SQL queries with live data, confidential filenames, file contents
- Anything that can identify a person or expose confidential systems

Behavior: - If detected ➜ Block immediately and DO NOT send anything to external LLM - Return a policy event with redaction summary and audit ID - Optionally notify security via webhook (SIEM/SOAR)

Banking policy presets:
- PCI: Mask PAN to first-6/last-4; block full PAN; block CVV/CVC
- KYC/AML: Block national IDs, passports, full address
- Trading: Block order IDs, positions, blotter exports

Performance & tuning:
- Deterministic pass in <5ms per request with compiled regex sets
- False positives managed via allowlist (e.g., "account" as product name) and scoped policies per role/tenant

### ⭐ Method 2 — Send a Transformed Version, Not the Original
When user intent is legitimate but includes sensitive tokens, VantaPrompt transforms input into a safe, semantically equivalent template.

Example
User prompt:
```
Customer John Lim (IC: 960101-14-5533) wants to reset his password.
```
Transformed (before LLM):
```
<USER_REQUEST>
Customer <NAME> (<IC_NUMBER>) wants to reset their <ACCOUNT_DATA>.
</USER_REQUEST>
```
Guarantees:
- No real names, IC numbers, account data leave your server
- LLM still receives full semantic structure for reasoning
- All replacements carry type tags (<NAME>, <IC_NUMBER>, <ACCOUNT_DATA>) for contextual answers without leakage

Implementation notes:
- Tokenization rules map detected entities to canonical tags
- Redaction keeps character class and length hints when useful (e.g., PAN **** **** **** 1234)
- Downstream outputs are post-processed to ensure no rehydration of sensitive context

### ⭐ Method 3 — Use a Local / On-Prem LLM for Safety Checking
For zero data egress environments (banks, regulated fintech):
- Recommended models: Llama 3.1 8B, Mistral Nemo 12B, Qwen 2.5 Coder 7B
- Deployment: on-prem GPU/CPU nodes or VPC-isolated inference servers
- Benefits: nothing leaves the environment, LLM-level reasoning for nuanced safety checks, $0 marginal cost once deployed, full auditability

Typical use:
- Run Method 1 (deterministic) ➜ if borderline or requires reasoning, escalate to on-prem safety LLM ➜ decide block/sanitize/pass

---

## 🧭 Data Flow and API Contracts

### Three-Layer Defense (Operationalized)
1) Input Validation (Local Pre-Filter)
2) Context Monitoring (Access scope + purpose check)
3) Output Filtering (Redaction + policy conformance)

### Validation Endpoint
`POST /prompt/validate`
Request:
```
{
  "workspaceId": "...",
  "userId": "...",
  "role": "agent|csr|analyst",
  "prompt": "string",
  "purpose": "customer_support|fraud_review|reg_reporting",
  "llmRoute": "external|onprem"
}
```
Response (examples):
- Blocked
```
{ "status": "blocked", "reason": ["PII:IC_NUMBER","Secrets:AWS_KEY"], "auditId": "..." }
```
- Sanitized
```
{ "status": "sanitized", "prompt": "<USER_REQUEST>Customer <NAME> ...</USER_REQUEST>", "tags": ["PII","ACCOUNT_DATA"], "auditId": "..." }
```
- Pass-through
```
{ "status": "pass", "prompt": "original or minimally redacted", "auditId": "..." }
```

### Output Filter
- Scans LLM responses for re-introduced PII
- Redacts or blocks and attaches `auditId` linkage to input event

### Audit & Compliance
- Immutable logs (hash-chained), role, purpose, policy version, and decision
- Data retention per jurisdiction (e.g., 90 days EU, 180 days US) with configurable purging

---

## 🏦 Banking-Specific Controls (Context + Policy)
- Role-Based Prompt Permissions: only CSR roles can reference customer context; analysts cannot export bulk data
- Purpose Limitation: prompts must declare purpose; bulk extraction blocked unless whitelisted workflow
- Anti-Exfiltration Patterns: detect enumerations (e.g., "list all customers with balance > $X"), page-through prompts, SQL dumps
- Data Locality: EU customer prompts routed to EU on-prem safety LLM; zero cross-region egress
- PCI/PII Defaults: PAN and IC/SSN classified as Tier-0 (block); partial masked allowed only within secure templates
- Audit-Ready by Design: every decision is reproducible with policy snapshot and detector versions

---

## 💰 Business Impact

### Risk Mitigation
- Prevent data breaches by stopping exfiltration at the edge
- Satisfy PCI, GDPR, SOX evidence with immutable audits
- Preserve customer trust and reduce regulatory exposure

### Operational Efficiency
- Safe AI adoption without slowing teams
- Automated, real-time compliance gates
- Faster incident response via precise, explainable decisions

---