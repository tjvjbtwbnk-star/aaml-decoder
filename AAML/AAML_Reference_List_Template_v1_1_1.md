# AAML Reference List Template
**Version 1.1.1**

---

## Overview

This document is the Reference List for [CASE NAME]. It maps all case documents to their identifiers, aliases, and metadata for use with AAML.

**This Reference List is OPTIONAL.** See "Alternative: Document YAML Headers" below.

**Core Principle:** This Reference List contains NO production numbers (C-1, CL-1, etc.). Production numbers are assigned automatically by the production engine based on document order within each category.

**Instructions:**
- Each document has a YAML frontmatter block with required and optional fields
- The `id` / `uid` field must be unique across all documents (4 characters recommended)
- The `aliases` field allows natural-language references (e.g., "the contract")
- Documents are listed in the order they should be numbered in production
- The production engine assigns numbers based on this order

**LLM Usage:**
- This Reference List will be provided to LLMs at runtime
- LLMs use the `uid`, `aliases`, or filenames to create symbolic references
- LLMs never use or see production numbers

---

## Alternative: Document YAML Headers

Instead of maintaining a separate Reference List, you can embed metadata directly in each source document. This is ideal for smaller cases or simpler workflows.

**YAML Header Format (at top of each document file):**

```yaml
---
uid: 3E39
title: "Letter from Claimant to Respondent re Site Access"
date: 2024-03-15
type: exhibit
party: claimant
aliases:
  - site access letter
  - march letter
---
```

**Required Fields:**

| Field | Description |
|-------|-------------|
| `uid` | Unique identifier (4 characters recommended) |
| `title` | Display title as it appears in footnotes |
| `type` | `exhibit`, `authority`, `witness`, `expert`, `procedural` |

**Optional Fields:**

| Field | Description |
|-------|-------------|
| `party` | `claimant` or `respondent` |
| `date` | Document date (YYYY-MM-DD) |
| `citation` | Full legal citation (for authorities) |
| `aliases` | Alternative names for easy referencing |

**File Organization:**

Store documents in designated folders:
- `exhibits/` — Fact exhibits
- `authorities/` — Legal authorities
- `witness/` — Witness statements
- `experts/` — Expert reports
- `procedural/` — Procedural documents

The production engine scans these folders, reads YAML headers, and builds the reference index automatically.

**Filename-Based References:**

The simplest referencing method: copy-paste the filename.

```markdown
The Respondent admitted the delay. [[Letter from Respondent re Site Access.pdf|p. 2]]
```

The production engine finds the file by name and reads its metadata from the YAML header. Users don't need to remember IDs or aliases.

---

## When to Use a Reference List vs. Document Headers

| Approach | Best For |
|----------|----------|
| **Reference List** | Large cases (50+ documents), explicit ordering control, documents without embedded headers |
| **Document Headers** | Smaller cases, simpler workflow, documents already tagged at intake |
| **Hybrid** | Reference List for complex document types, headers for straightforward exhibits |

---

## Fact Exhibits

### Construction Contract
```yaml
id: contract-2018
type: exhibit
party: claimant
title: Construction Contract
date: 2018-03-01
file: exhibits/construction-contract.pdf
aliases:
  - contract
  - the contract
  - main contract
```
*Production engine will assign: C-1*

---

### Site Access Request
```yaml
id: site-access-req
type: exhibit
party: claimant
title: Request for Site Access
date: 2024-03-01
file: exhibits/site-access-request.pdf
aliases:
  - site access request
  - access request
```
*Production engine will assign: C-2*

---

### March Email
```yaml
id: march-email-2024
type: exhibit
party: claimant
title: Email re Site Access
date: 2024-03-15
file: exhibits/march-email.pdf
aliases:
  - march email
  - site access email
```
*Production engine will assign: C-3*

---

### Respondent's Letter
```yaml
id: resp-letter-apr
type: exhibit
party: respondent
title: Letter from Ministry re Permits
date: 2024-04-10
file: exhibits/ministry-letter.pdf
aliases:
  - ministry letter
  - respondent letter
```
*Production engine will assign: R-1*

---

## Legal Authorities

### Tecmed v. Mexico
```yaml
id: tecmed-award
type: authority
party: claimant
title: Técnicas Medioambientales Tecmed S.A. v. United Mexican States
citation: ICSID Case No. ARB(AF)/00/2, Award (29 May 2003)
file: authorities/tecmed-v-mexico.pdf
aliases:
  - tecmed
  - tecmed v mexico
  - tecmed award
```
*Production engine will assign: CL-1*

---

### VCLT Article 31
```yaml
id: vclt-art31
type: authority
party: claimant
title: Vienna Convention on the Law of Treaties
citation: Art. 31, 1155 U.N.T.S. 331 (23 May 1969)
file: authorities/vclt.pdf
aliases:
  - vclt
  - vienna convention
  - vclt article 31
```
*Production engine will assign: CL-2*

---

### CMS v. Argentina
```yaml
id: cms-award
type: authority
party: respondent
title: CMS Gas Transmission Company v. Argentine Republic
citation: ICSID Case No. ARB/01/8, Award (12 May 2005)
file: authorities/cms-v-argentina.pdf
aliases:
  - cms
  - cms v argentina
  - cms award
```
*Production engine will assign: RL-1*

---

## Witness Statements

### John Smith Statement
```yaml
id: smith-ws
type: witness
party: claimant
title: Witness Statement of John Smith
date: 2024-06-15
file: witness/smith-statement.pdf
aliases:
  - smith
  - smith statement
  - john smith
```
*Production engine will assign: CWS-1*

---

### Jane Doe Statement
```yaml
id: doe-ws
type: witness
party: respondent
title: Witness Statement of Jane Doe
date: 2024-07-01
file: witness/doe-statement.pdf
aliases:
  - doe
  - doe statement
  - jane doe
```
*Production engine will assign: RWS-1*

---

## Expert Reports

### Dr. Anderson Report
```yaml
id: anderson-er
type: expert
party: claimant
title: Expert Report of Dr. Robert Anderson
date: 2024-06-20
expertise: Construction Engineering
file: experts/anderson-report.pdf
aliases:
  - anderson
  - anderson report
  - dr anderson
```
*Production engine will assign: CER-1*

---

### Prof. Martinez Report
```yaml
id: martinez-er
type: expert
party: respondent
title: Expert Report of Prof. Maria Martinez
date: 2024-07-05
expertise: International Law
file: experts/martinez-report.pdf
aliases:
  - martinez
  - martinez report
  - prof martinez
```
*Production engine will assign: RER-1*

---

## Procedural Documents

### Procedural Orders

#### Procedural Order No. 1
```yaml
id: po1
type: procedural
subtype: order
title: Procedural Order No. 1
date: 2024-02-01
file: procedural/po1.pdf
aliases:
  - po1
  - procedural order 1
  - first procedural order
```
*Production engine will assign: PO-1*

---

### Submissions

#### Claimant's Memorial
```yaml
id: memorial
type: procedural
subtype: submission
party: claimant
title: Claimant's Memorial
date: 2024-08-01
file: submissions/memorial.pdf
aliases:
  - memorial
  - claimant memorial
  - claimant's memorial
```
*Production engine will assign: (Memorial)*

---

#### Respondent's Counter-Memorial
```yaml
id: counter-memorial
type: procedural
subtype: submission
party: respondent
title: Respondent's Counter-Memorial
date: 2024-10-01
file: submissions/counter-memorial.pdf
aliases:
  - counter-memorial
  - counter memorial
  - respondent counter-memorial
```
*Production engine will assign: (Counter-Memorial)*

---

### Correspondence

#### Letter to Tribunal - Extension Request
```yaml
id: ext-request-letter
type: procedural
subtype: correspondence
title: Claimant's Request for Extension of Time
date: 2024-07-15
from: Claimant's Counsel
to: The Tribunal
file: correspondence/extension-request.pdf
aliases:
  - extension request
  - time extension letter
```
*Production engine will assign: Letter-001*

---

## Figures

### Site Plan
```yaml
id: fig-site-plan
type: figure
title: Site Plan (Rev. 3)
file: figures/site-plan.png
caption: Site plan showing access gates and laydown area
source: [[contract-2018|Appendix B]]
```
*Production engine will assign: Figure 1*

---

### Project Timeline
```yaml
id: fig-timeline
type: figure
title: Project Timeline
file: figures/timeline.png
caption: Timeline of key events from 2018-2024
```
*Production engine will assign: Figure 2*

---

## Tables

### Delay Events Summary
```yaml
id: tbl-delay-summary
type: table
title: Summary of Delay Events
```

| Date | Event | Cause | Impact (Days) |
|------|-------|-------|---------------|
| 2019-01-15 | Permit delay | Respondent | +14 |
| 2019-02-02 | Access restriction | Respondent | +9 |
| 2019-03-10 | Weather event | Force majeure | +3 |

*Production engine will assign: Table 1*

---

### Damages Summary
```yaml
id: tbl-damages
type: table
title: Summary of Claimed Damages
```

| Category | Amount (USD) | Basis |
|----------|--------------|-------|
| Direct costs | 1,500,000 | [[anderson-er\|Section 5]] |
| Lost profits | 3,200,000 | [[anderson-er\|Section 6]] |
| Interest | 450,000 | [[anderson-er\|Section 7]] |

*Production engine will assign: Table 2*

---

## Field Reference

### Required Fields (All Documents)

| Field | Description |
|-------|-------------|
| `id` | Unique identifier (alphanumeric, hyphens, underscores) |
| `type` | `exhibit`, `authority`, `witness`, `expert`, `procedural`, `figure`, `table` |
| `title` | Human-readable title |

### Optional Fields

| Field | Description | Applicable Types |
|-------|-------------|------------------|
| `party` | `claimant` or `respondent` | All except figures/tables |
| `date` | Document date (ISO 8601: YYYY-MM-DD) | All |
| `file` | Path to source file | All |
| `citation` | Full legal citation | authority |
| `expertise` | Field of expertise | expert |
| `subtype` | `order`, `submission`, `correspondence` | procedural |
| `from` / `to` | Sender/recipient | procedural (correspondence) |
| `caption` | Figure/table caption | figure, table |
| `source` | Source reference (using symbolic IDs) | figure, table |
| `aliases` | List of alternative identifiers | All |

---

## Production Number Assignment Rules

The production engine assigns numbers based on:

1. **Document order** within each category in this Reference List
2. **Party designation** for exhibits, authorities, witnesses, and experts
3. **Type-specific prefixes**:
   - Claimant exhibits: C-1, C-2, C-3, ...
   - Respondent exhibits: R-1, R-2, R-3, ...
   - Claimant authorities: CL-1, CL-2, CL-3, ...
   - Respondent authorities: RL-1, RL-2, RL-3, ...
   - Claimant witnesses: CWS-1, CWS-2, ...
   - Respondent witnesses: RWS-1, RWS-2, ...
   - Claimant experts: CER-1, CER-2, ...
   - Respondent experts: RER-1, RER-2, ...
   - Procedural orders: PO-1, PO-2, ...
   - Correspondence: Letter-001, Letter-002, ...
   - Figures: Figure 1, Figure 2, ...
   - Tables: Table 1, Table 2, ...

---

## LLM Integration Notes

When this Reference List is provided to an LLM:

1. **The LLM sees only symbolic identifiers and aliases** – no production numbers
2. **The LLM creates references using `id` or `aliases`** – e.g., `[[contract|cl. 8.3]]` or `[[tecmed|para. 154]]`
3. **The LLM never uses production numbers** – it doesn't see them and doesn't need them
4. **The production engine assigns numbers during conversion** – based on document order in this list

**Example Workflow:**

```yaml
# What's in the Reference List:
### Construction Contract
---
id: contract-2018
type: exhibit
party: claimant
title: Construction Contract
date: 2018-03-01
aliases:
  - contract
  - the contract
---

# How LLMs reference this document:
[[contract]]
[[contract|cl. 8.3]]
[[contract-2018|p. 5]]

# How LLMs DO NOT reference this:
C-1  ❌
Exhibit C-1  ❌
[^1]: C-1, cl. 8.3  ❌

# What the production engine produces:
"The Contract required access.¹"
"_______________"
"¹ Exhibit C-1, cl. 8.3."
```

---

## Validation Notes

1. **Ordering**: Documents are numbered based on their order in this list
2. **Aliases**: Case-insensitive; "The Contract" matches "the contract"
3. **IDs**: Must be unique across ALL document types
4. **Production Engine**: Will error on duplicate IDs or undefined references
5. **Production Numbers**: Are NEVER in the source Reference List – assigned automatically

---

## Template Usage Instructions

### Option A: Using a Reference List

To create a Reference List for your case:

1. **Replace document headings** with descriptive titles (not C-1, C-2, etc.)
2. **Assign unique UIDs** (4 characters recommended) to each document
3. **Add meaningful aliases** that LLMs and humans will naturally use
4. **Order documents** as you want them numbered in production
5. **Do NOT add production numbers** – they're auto-generated

The italic notes like "*Production engine will assign: C-1*" are for human reference only and can be removed from the final Reference List.

### Option B: Using Document YAML Headers

To skip the Reference List and use embedded headers:

1. **Add YAML headers** to the top of each source document
2. **Include required fields**: `uid`, `title`, `type`
3. **Store documents** in designated folders (`exhibits/`, `authorities/`, etc.)
4. **Reference by filename** or UID in your AAML text

The production engine will scan the folders and build the reference index automatically.

### Option C: Hybrid Approach

Use both methods:
- Reference List for document types requiring explicit ordering
- Document headers for straightforward exhibits

The Reference List takes precedence where entries exist.

---

## JSON Export (Advanced)

For programmatic access or integration with case management systems, document metadata can be exported to JSON:

```json
{
  "documents": [
    {
      "uid": "3E39",
      "title": "Letter from Claimant to Respondent re Site Access",
      "date": "2024-03-15",
      "type": "exhibit",
      "party": "claimant",
      "aliases": ["site access letter", "march letter"],
      "file": "exhibits/Letter from Claimant to Respondent re Site Access.pdf"
    }
  ]
}
```

YAML headers and JSON are interchangeable for the same metadata.

---

*End of Reference List Template v1.1.1*
