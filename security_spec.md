# Firestore Security Specification - SteerSafe Driving Admin

This document defines the data invariants, threat model via twelve bypass payloads, and tests verifying permissions for SteerSafe's backend entities.

## 1. Data Invariants

1. **Self-Consistency**:
   - Location IDs, School IDs, and Cohort IDs must conform to expected format constraints and must not be injected with junk data (preventing resource exhaustion / denial of wallet).
2. **Access Control**:
   - Only successfully authenticated users are permitted to perform read or write operations (`request.auth != null`).
3. **Data Quality**:
   - Every entity write (creation or update) must be run through the corresponding `isValid[Entity]()` helper validating key types, sizes, and structure.

## 2. Dirty Dozen Bypass Payloads

The following payloads represent unauthorized structures designed to break system laws (e.g. setting custom statuses, spoofing identity, injecting huge strings):

1. **Junk ID Poisoning**: Trying to create a location with structured ID containing malicious 1.5KB string (`locationId = "a".repeat(1500)`).
2. **Owner Spoofing on Create**: An attacker trying to register a student and binding it to a non-existent cohort or setting arbitrary administrative flags.
3. **Ghost Fields Addition (Shadow Update)**: Attempting to update a trainer document by injecting an unapproved field `isAdmin: true` into the request.
4. **Illegal Status Transition**: Client attempting to transition class status directly or bypass validator.
5. **Time Spoofing (Non-Server Time)**: Forcing custom local payload timestamp for `createdAt` during student creation instead of `request.time`.
6. **Excessive Array Injection**: Submitting an availability days list containing 50 elements to exhaust query indexes.
7. **Cross-Tenant State Modification**: Modifying slot statuses without permission or setting them to invalid enumerations (e.g., `status = "SuperBooked"`).
8. **Malicious Empty String Injection**: Setting name to `""` (empty string) bypassing visual presence requirements.
9. **PII Blanket Scraping Query Bypass**: A client querying emails of students without correct ownership filters.
10. **Admin Spoofing via Metadata**: Editing own account roles bypassing master database references.
11. **Age Inconsistency Playloads**: Injecting under-18 values with an age set to 35.
12. **Parent Information Omission for Teen**: Supplying an under-18 student profile without parentName or contact information keys.

## 3. Test Runner Concept

A standalone tester file would verify with `firebase/rules-unit-testing` that each target route fails on invalid credentials or malformed payloads, keeping our system bulletproof.
