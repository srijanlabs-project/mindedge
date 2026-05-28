# Security Specification - MINDEDGE

This document outlines the security architecture, data invariants, and threat modeling for the MINDEDGE platform's Firestore database.

## 1. Data Invariants

1. **User Role Integrity**: No user can modify their own `role` field after creation to prevent privilege escalation.
2. **PII Confidentiality**: Public users cannot read other users' private contact details (e.g. mobile relationship profile images for non-approved therapists).
3. **Student Profile Ownership**: A student profile can only be read/updated by the parent who created it (`parentId`), the student themselves (`studentId`), or an approved scheduling therapist.
4. **Therapist Approval Lock**: Only the system Admin can modify the `isApproved` flag of a therapist.
5. **Private Journals**: Student journal logs can ONLY be read and written by the student who runs it. Even parents or therapists cannot read these private journal entries directly to foster an open therapeutic path.
6. **Appointment State Rules**: Only therapists can update helper comments or session notes. Only the client or therapist involved can cancel appointments.
7. **Payment Verification**: Payments are system-confirmed. Clients cannot arbitrary mark a payment as successful or modify the transaction value.

## 2. The Dirty Dozen Threat Payloads

1. **Privilege Escalation**: Student user attempts to update their user profile role to `"admin"`.
2. **PII Data Scraping**: Anonymous user attempts to read list of all Parent contact emails.
3. **Unauthorized Student Onboarding**: Parent B attempts to update the student profile of Student A (belonging to Parent A).
4. **Self-Approval Attack**: Unapproved therapist attempts to set their own `isApproved` status to `true`.
5. **Spoofed Appointment Booking**: Student A attempts to book an appointment with `bookerId` set to Student B's UID.
6. **Counterfeit Payment Success**: Parent B attempts to falsify payment document status to `'success'` for a completed/pending session.
7. **Journal Snooping**: Therapist attempts to read Student A's private journal entry.
8. **Malicious ID Hijacking**: Attacker tries to inject a 10KB string as a user or student ID.
9. **Spam Blog Creation**: Student attempts to publishes a blog post (only approved therapists can publish blogs).
10. **Notification Spam**: Parent attempts to create a custom notification inside another parent's notification feed.
11. **Falsifying Appointment State**: Student tries to mark an appointment status as `"completed"` or update `"sessionNotes"`.
12. **Future Denial of Wallet (Size Limit Violation)**: Attacker attempts to post a 5MB blog or 2MB username to exhaust database storage blocks.

## 3. Threat Rule Enforcement Tests

The rules will enforce strict:
- Identity checks using `request.auth.uid`.
- Verification of emails using `request.auth.token.email_verified == true` (for real environment verification, we can allow standard signIn checks but we should safeguard real rules).
- Size limits: all strings must be bound below exact visual sizes.
- Content matching with standard regular expressions.
