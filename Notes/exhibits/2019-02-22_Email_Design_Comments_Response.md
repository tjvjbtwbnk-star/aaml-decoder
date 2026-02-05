---
uid: VSXE
title: "Email from Dr. Wilhelm Braun to Emilia Kowalska re Response to design review comments - Batch 1, 2019-02-22"
date: 2019-02-22
type: exhibit
party: claimant
aliases:
  - response design review
  - february email
---

# EMAIL

**From:** Dr. Wilhelm Braun <w.braun@spcc-jv.com>  
**To:** Emilia Kowalska <e.kowalska@dpi.at>  
**Cc:** Dr. Heinrich Weber <h.weber@dpi.at>; Dragan Kostić <d.kostic@beu.bd>  
**Date:** 22 February 2019, 17:30  
**Subject:** Response to design review comments - Batch 1

Dear Emilia,

Thank you for the comprehensive review of our Basic Design documents - Batch 1. We have been working through your 74 comments systematically over the past 10 days and have made good progress.

I wanted to send you an interim update on our approach to addressing the comments, ahead of our formal resubmission on 5 March.

**Overall Approach:**

We have categorized our responses as follows:
- **Accepted** - we will incorporate the comment as requested
- **Accepted with clarification** - we will incorporate the comment but with some modification or interpretation
- **Requires discussion** - we need further input from you or BEU before finalizing our response
- **Not accepted** - we believe the comment is not applicable (very few in this category)

**Status Summary:**

| Category | Total Comments | Accepted | Accepted with Clarification | Requires Discussion | Not Accepted |
|----------|----------------|----------|---------------------------|-----------------------|---------------|
| A (Major) | 16 | 8 | 5 | 3 | 0 |
| B (Minor) | 40 | 32 | 6 | 2 | 0 |
| C (Observations) | 18 | N/A | N/A | N/A | N/A |
| **TOTAL** | **74** | **40** | **11** | **5** | **0** |

**Principal Comments - Our Response:**

Let me outline our approach to the major Category A comments:

**Comment A-1 (Ambient Design Temperature):**

**Response: Accepted with clarification**

You're quite right that our 30°C design point needs better justification. We have obtained 20 years of hourly temperature data from Szohôd meteorological station (15 km from site) and performed statistical analysis.

Our findings:
- 2% exceedance temperature (exceeded 175 hours/year): 32.1°C
- Maximum recorded: 37.4°C (July 2012)
- 99th percentile: 30.8°C

We will revise our design basis to use **32°C as the design ambient temperature** for equipment sizing. This is a standard industry approach (2% exceedance).

We will also provide performance degradation curves from 15°C to 40°C showing guaranteed output and efficiency at various ambient temperatures. The plant will be capable of operation at temperatures up to 40°C, but with reduced output.

**Impact:** This change affects heat exchanger sizing, air intake systems, and cooling system design. We are updating Batches 2, 3, and 4 accordingly. The cooling system may be slightly larger than initially proposed, but this is manageable within our design envelope.

**Comments A-3, A-4, A-5 (Performance Guarantee Test Conditions):**

**Response: Accepted**

We agree these sections were not sufficiently clear. We will completely revise Section 3 of SPCC-PR-008 to:

1. Define three distinct condition sets:
   - **ISO base conditions** (15°C/1013 mbar/60% RH) - for reference only
   - **Site reference conditions** (20°C/996 mbar/60% RH) - for specification and baseline performance statements
   - **Actual test conditions** - whatever conditions prevail during testing

2. Provide guaranteed values at both ISO and site reference conditions

3. Define tolerance bands for testing:
   - Ambient temperature: ±3°C (stable over test period)
   - Barometric pressure: ±5 mbar
   - Relative humidity: ±10%

4. Provide detailed correction methodology per ISO 2314, validated by TurboMach AG

5. Define acceptable deviation from reference conditions: test valid if corrected performance is within ±2% of guaranteed value

We have been coordinating with TurboMach on the correction methodology and they have confirmed their agreement with our approach.

**Comment A-2 (Fuel Gas Specification):**

**Response: Accepted - Resolved by BEU clarification**

This comment has been largely resolved by BEU's letter ref. BEU/SPCC/2019/0003-TEC (8 Feb) which provided the necessary fuel gas data.

We will incorporate the HHV range (39.5 ±0.8 MJ/Nm³) and Wobbe Index range (48.5-50.5 MJ/Nm³) into our design basis.

We will also add a section on off-specification gas, stating:
- Plant will operate on gas within the specified ranges
- If gas falls outside specification, plant output and efficiency may be affected
- BEU is responsible for gas quality per Contract; SPCC is not liable for performance degradation due to off-spec gas

**Comment A-7 (HRSG Supplementary Firing):**

**Response: Requires discussion**

This is one of the items where we need further input from BEU.

The Contract Specification mentions "supplementary firing capability" but does not state:
- What is the required firing duty? (Our preliminary design is based on 150 MW thermal, approximately 20% boost)
- What is the intended operating regime? (Continuous? Peak shaving? Emergency?)
- What is the acceptable efficiency penalty?

**Our position:** Supplementary firing significantly affects HRSG cost and complexity, and has an efficiency penalty (reduces combined cycle efficiency from ~58.5% to ~54% when firing). 

**We need to understand BEU's operational requirement.** Is this:
- A firm requirement (must have supplementary firing)?
- An option (nice to have, but not essential)?
- A legacy requirement that can be deleted?

Could you and Dragan please clarify BEU's position on this? It would be helpful to have a short meeting to discuss the operational rationale and required capabilities.

**Comment A-8, A-9 (Cooling System Selection and Details):**

**Response: Requires discussion**

You've raised valid questions about the hybrid cooling tower configuration.

**Background:** We selected hybrid (wet/dry) cooling for the following reasons:
1. Water conservation: Reduces consumption by ~40% compared to full wet cooling
2. Plume abatement: Eliminates visible plume in winter (important given proximity to residential areas)
3. Flexibility: Can operate in full-wet, full-dry, or hybrid modes depending on conditions

**Cost comparison:**
- Hybrid tower: ~EUR 18 million
- Full wet tower: ~EUR 12 million
- Full dry tower: ~EUR 35 million

**Operating strategy:**
- Summer (ambient >20°C): Hybrid mode (mix of wet/dry)
- Winter (ambient <10°C): Primarily dry mode (avoids plume)
- Intermediate: Optimized for efficiency

**Water consumption:**
- Hybrid: ~180,000 m³/year
- Full wet: ~300,000 m³/year
- Full dry: ~0 m³/year (but performance penalty)

**Acoustic analysis:** We have conducted preliminary acoustic assessment. Results show:
- Sound power level: 98 dB(A) at 1m from tower
- At nearest residential area (800m): 45 dB(A) (below Bordurian limit of 50 dB(A) for industrial areas at night)
- Acoustic attenuators may be required; included in design

We will provide a more detailed cooling system selection study in the revised submission, including the information you've requested.

**Question for you:** Do you want this as part of the basic design documents, or as a separate technical memorandum?

**Items Requiring Your Input:**

There are a few comments where we need clarification from you or BEU:

**Comment B-18 (SPCC-PR-005):** You ask for "tolerance" on gas turbine exhaust temperature. The issue is that TurboMach specifies this as "615°C typical at ISO conditions" but the actual value varies with load, ambient temperature, and fuel properties. We can provide a range (e.g., 600-630°C) or a formula relating exhaust temperature to operating conditions. Which would you prefer?

**Comment B-23 (SPCC-PR-006):** You question the HRSG warranty period (2 years vs. standard 1 year). This is a specific requirement in our TurboMach/CoolTech contract package. The 2-year warranty is valuable for BEU as it covers the initial operating period. Should we explain this in the design basis or just note it?

**Meeting to Discuss?**

Given that we have 5 items still requiring discussion (3 Category A, 2 Category B), would it be helpful to have a short technical coordination meeting next week to resolve these before we finalize the revised submission?

I'm available Tuesday 26 Feb or Thursday 28 Feb if that works for you. We could cover the outstanding items in 2-3 hours.

**Revised Submission - 5 March:**

We remain on track to submit the revised documents on 5 March as required. The revised package will include:

1. **Revised documents** (all 9 documents, marked Rev B with revision clouds showing changes)
2. **Comment Response Matrix** (detailed response to each of your 74 comments)
3. **Supporting analyses** (temperature statistics, performance curves, cooling system study, etc.)

We are working hard to address your comments comprehensively and believe the revised submission will be significantly improved as a result of your review.

Thank you again for the thorough and constructive review. It's helping us refine the design and ensure we have a solid basis for the detailed engineering phase.

Best regards,

**Dr. Wilhelm Braun**  
Engineering Manager  
Syldavian Power Construction Consortium  
Mobile: +49 172 345 6789  
Email: w.braun@spcc-jv.com
