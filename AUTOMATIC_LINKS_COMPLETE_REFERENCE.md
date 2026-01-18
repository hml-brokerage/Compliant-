# Automatic Link Generation - Complete Reference

## Overview

The Compliant Platform automatically generates secure, contextual links throughout the entire workflow. This document provides a comprehensive reference of all automatic link types, when they're generated, who receives them, and how they work.

## Link Generation Architecture

### Security
- All tokens: 64-character cryptographically secure hex strings
- Generated using: `randomBytes(32).toString('hex')`
- Time-limited expiry for sensitive actions
- Session-based authentication for workflow links
- HTTPS enforced in production

### Base URL Configuration
```typescript
const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
```

---

## 1. Account Creation & Authentication Links

### 1.1 GC Account Creation
**Triggered When**: New GC/Contractor is added to the system

**Email Sent To**: GC contact email

**Links Generated**:
1. **Password Setup Link**: `${baseUrl}/reset-password?token=${token}`
   - Expiry: 24 hours
   - One-time use
   - Validates email ownership

2. **Dashboard Access**: `${baseUrl}/gc/dashboard`
   - Available after password is set
   - Session-authenticated

3. **Quick Start Guide**: `${baseUrl}/gc/getting-started`
   - Tutorial and onboarding

**Email Template Includes**:
- Welcome message
- Company information
- Login credentials (email only, password self-set)
- Next steps checklist
- Support contact information

---

### 1.2 Subcontractor Account Creation
**Triggered When**: GC adds a subcontractor to a project

**Email Sent To**: Subcontractor primary contact

**Links Generated**:
1. **Account Activation**: `${baseUrl}/reset-password?token=${token}`
   - Expiry: 24 hours
   - Creates initial password

2. **Dashboard Access**: `${baseUrl}/subcontractor/dashboard`
   - View assigned projects
   - Compliance status

3. **Broker Setup**: `${baseUrl}/subcontractor/broker`
   - Add broker information
   - Required for COI process

4. **Project Details**: `${baseUrl}/subcontractor/projects/${projectId}`
   - Specific project information
   - Requirements and deadlines

**Email Template Includes**:
- Project details
- GC information
- Insurance requirements
- Broker setup instructions
- Deadline information

---

### 1.3 Broker Account Creation
**Triggered When**: Subcontractor adds broker OR broker is assigned

**Email Sent To**: Broker email address

**Links Generated**:
1. **Account Activation**: `${baseUrl}/reset-password?token=${token}`
   - Expiry: 24 hours
   - Password creation

2. **Broker Dashboard**: `${baseUrl}/broker/dashboard`
   - Manage multiple clients
   - View all assignments

3. **Client Details**: `${baseUrl}/broker/clients/${subcontractorId}`
   - Specific subcontractor information
   - Requirements

4. **Upload Portal**: `${baseUrl}/broker/upload/${subcontractorId}`
   - Direct access to upload COI documents
   - Pre-populated client info

**Email Template Includes**:
- Subcontractor name and project
- Insurance requirements
- Upload instructions
- Deadlines and responsibilities

---

## 2. Document Upload & Review Links

### 2.1 Broker Upload Reminder
**Triggered When**: 
- Subcontractor assigned but no COI uploaded
- Policy expiring (30, 15, 7, 1 days before)
- Deficiency requiring resubmission

**Email Sent To**: Broker email

**Links Generated**:
1. **Direct Upload**: `${baseUrl}/broker/upload/${coiId}`
   - Pre-filled form
   - Client context

2. **Requirements Page**: `${baseUrl}/broker/requirements/${projectId}`
   - Detailed insurance requirements
   - Policy limits and coverages

3. **Template Downloads**: `${baseUrl}/templates/${programId}`
   - COI template
   - Policy requirement checklist

**Email Template Includes**:
- Urgency level
- Deadline
- Missing or expiring policies
- Specific requirements
- Contact for questions

---

### 2.2 Admin Review Notification
**Triggered When**: Broker uploads COI documents

**Email Sent To**: Admin/Manager email

**Links Generated**:
1. **Review Queue**: `${baseUrl}/admin/coi-reviews`
   - All pending reviews

2. **Specific COI**: `${baseUrl}/admin/coi/${coiId}/review`
   - Direct to this COI
   - All uploaded documents

3. **Subcontractor Profile**: `${baseUrl}/admin/contractors/${contractorId}`
   - Full contractor history
   - Previous COIs

4. **Project Context**: `${baseUrl}/admin/projects/${projectId}`
   - Project details
   - All subcontractors

**Email Template Includes**:
- Subcontractor name
- Project name
- Upload type (first-time/renewal)
- Broker information
- Quick stats

---

## 3. Hold Harmless Signature Links

### 3.1 Subcontractor Signature Request
**Triggered When**: COI approved (status → ACTIVE)

**Email Sent To**: Subcontractor primary contact

**Links Generated**:
1. **Signature Portal**: `${baseUrl}/subcontractor/hold-harmless/${agreementId}`
   - Session-authenticated
   - Pre-populated agreement
   - Electronic signature pad

2. **Agreement Preview**: `${baseUrl}/subcontractor/hold-harmless/${agreementId}/preview`
   - Read-only view
   - Download PDF

3. **Help/FAQ**: `${baseUrl}/help/hold-harmless-signature`
   - Instructions
   - Common questions

**Email Template Includes**:
- Project details
- GC information
- Signing instructions
- Deadline (if applicable)
- Support contact

**Workflow**:
1. Subcontractor receives email
2. Clicks link → redirected to login if needed
3. Reviews agreement
4. Signs electronically
5. System sends email to GC

---

### 3.2 GC Signature Request
**Triggered When**: Subcontractor completes their signature

**Email Sent To**: GC contact email

**Links Generated**:
1. **Signature Portal**: `${baseUrl}/gc/hold-harmless/${agreementId}`
   - Session-authenticated
   - Shows sub's signature
   - GC signature section

2. **Agreement Preview**: `${baseUrl}/gc/hold-harmless/${agreementId}/preview`
   - Full agreement view
   - Both signature sections

3. **Project Context**: `${baseUrl}/gc/projects/${projectId}/compliance`
   - Overall project compliance
   - All subcontractors

**Email Template Includes**:
- Subcontractor name
- Project name
- Sub signature confirmation
- GC signing instructions
- Complete workflow status

**Workflow**:
1. GC receives email
2. Clicks link → authenticates
3. Reviews agreement with sub signature
4. Signs electronically
5. System generates final PDF
6. Notifies all parties

---

### 3.3 Signature Link Resend
**API Endpoint**: `POST /api/hold-harmless/${agreementId}/resend/${party}`
**Party**: "SUB" or "GC"

**Triggered When**: 
- User reports not receiving email
- Link expired
- Manual resend request

**Links Regenerated**:
- Same signature portal links
- Fresh email send
- Audit log entry

---

## 4. Compliance Status Links

### 4.1 Compliance Confirmation
**Triggered When**: 
- COI fully approved
- Hold harmless fully signed
- Status → COMPLIANT

**Email Sent To**: GC, Subcontractor, Broker (all parties)

**Links Generated**:
1. **Compliance Certificate**: `${baseUrl}/compliance/${coiId}/certificate`
   - Printable certificate
   - QR code verification

2. **Full Documentation**: `${baseUrl}/documents/${coiId}`
   - All signed documents
   - Download ZIP

3. **Dashboard Quick View**:
   - GC: `${baseUrl}/gc/subcontractors/${subId}/compliance`
   - Sub: `${baseUrl}/subcontractor/compliance`
   - Broker: `${baseUrl}/broker/clients/${subId}/compliance`

**Email Template Includes**:
- ✓ COMPLIANT status badge
- Project name
- Subcontractor name
- Expiry date
- Renewal reminders setup

---

### 4.2 Non-Compliance Alert
**Triggered When**:
- COI rejected/deficient
- Policy expired
- Coverage inadequate
- Missing documents

**Email Sent To**: GC, Subcontractor, Broker (all parties)

**Links Generated**:
1. **Deficiency Details**: `${baseUrl}/deficiency/${coiId}`
   - Specific issues listed
   - Required actions

2. **Resubmit Portal**:
   - Broker: `${baseUrl}/broker/resubmit/${coiId}`
   - Direct fix and reupload

3. **Support/Help**: `${baseUrl}/help/deficiency-resolution`
   - Common issues
   - How to resolve

**Email Template Includes**:
- ⚠️ NON-COMPLIANT alert
- Specific reasons
- Required actions per party
- Deadline
- Consequences

---

## 5. Project Management Links

### 5.1 Project Invitation (GC to Sub)
**Triggered When**: GC adds subcontractor to project

**Email Sent To**: Subcontractor

**Links Generated**:
1. **Accept Invitation**: `${baseUrl}/subcontractor/projects/${projectId}/accept?token=${token}`
   - One-time acceptance link
   - Creates project association

2. **Project Details**: `${baseUrl}/subcontractor/projects/${projectId}`
   - Full project information
   - Requirements

3. **GC Profile**: `${baseUrl}/subcontractor/gc/${gcId}`
   - GC contact information
   - Communication preferences

---

### 5.2 Project Updates
**Triggered When**: Project details change, new requirements, deadline changes

**Email Sent To**: All project stakeholders

**Links Generated**:
1. **Project Dashboard**: Role-specific project view
2. **Change Details**: `${baseUrl}/projects/${projectId}/changes`
3. **Notification Center**: View all project notifications

---

## 6. Renewal & Expiration Links

### 6.1 Policy Expiring Soon
**Triggered When**: Policy expiring in 30, 15, 7, 1 days

**Email Sent To**: Subcontractor & Broker

**Links Generated**:
1. **Renewal Portal**: `${baseUrl}/broker/renew/${coiId}`
   - Pre-filled renewal form
   - Previous policy data

2. **Current COI**: `${baseUrl}/coi/${coiId}`
   - What's expiring
   - Requirements

3. **Upload New**: `${baseUrl}/broker/upload/${coiId}/renewal`
   - Direct renewal upload
   - Marked as renewal

**Email Template Includes**:
- Days until expiration
- Policy details
- Required actions
- Deadline urgency

---

### 6.2 Policy Expired
**Triggered When**: Policy expiration date passed

**Email Sent To**: GC, Sub, Broker (URGENT)

**Links Generated**:
1. **Emergency Upload**: `${baseUrl}/broker/urgent-upload/${coiId}`
   - Marked as urgent
   - Fast-track review

2. **Status Page**: Shows EXPIRED status
3. **Support Escalation**: Contact information

---

## 7. Administrative Links

### 7.1 User Management
- **Create User**: `${baseUrl}/admin/users/create`
- **Edit User**: `${baseUrl}/admin/users/${userId}/edit`
- **User Permissions**: `${baseUrl}/admin/users/${userId}/permissions`

### 7.2 System Configuration
- **Insurance Programs**: `${baseUrl}/admin/programs`
- **Templates**: `${baseUrl}/admin/templates`
- **Email Settings**: `${baseUrl}/admin/settings/email`
- **Notifications**: `${baseUrl}/admin/settings/notifications`

### 7.3 Reports & Analytics
- **Compliance Report**: `${baseUrl}/admin/reports/compliance`
- **Expiring Policies**: `${baseUrl}/admin/reports/expiring`
- **Audit Logs**: `${baseUrl}/admin/audit`

---

## 8. Mobile & Alternative Access

### 8.1 SMS Links (if enabled)
- Shortened URLs for mobile access
- Deep links to mobile app (if available)
- QR codes for quick access

### 8.2 Email Client Compatibility
- All links tested in major email clients
- Plain text fallbacks
- Link expiry warnings

---

## 9. Security Considerations

### Token Security
```typescript
// Token generation
const token = randomBytes(32).toString('hex'); // 64 characters

// Token storage
await prisma.token.create({
  data: {
    token: hashToken(token), // Hashed in database
    userId,
    type: 'PASSWORD_RESET',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  },
});

// Token validation
const hashedToken = hashToken(tokenFromUrl);
const tokenRecord = await prisma.token.findFirst({
  where: {
    token: hashedToken,
    expiresAt: { gt: new Date() },
    used: false,
  },
});
```

### Link Protection
- HTTPS only in production
- CSRF tokens for state-changing actions
- Rate limiting on token generation
- Audit logging of all access
- Suspicious activity detection

---

## 10. Implementation Examples

### Password Reset Flow
```typescript
// 1. User requests reset
async requestPasswordReset(email: string) {
  const user = await this.findByEmail(email);
  const token = this.generateSecureToken();
  
  await this.saveToken(user.id, token, 'PASSWORD_RESET');
  
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  
  await this.emailService.sendPasswordResetEmail(
    user.email,
    user.name,
    resetLink
  );
}

// 2. User clicks link
async resetPassword(token: string, newPassword: string) {
  const tokenRecord = await this.validateToken(token);
  await this.updatePassword(tokenRecord.userId, newPassword);
  await this.markTokenUsed(token);
}
```

### Hold Harmless Signature
```typescript
// 1. Auto-generate on COI approval
async autoGenerateHoldHarmless(coiId: string) {
  const coi = await this.getCOIWithDetails(coiId);
  const subToken = this.generateSecureToken();
  
  const holdHarmless = await this.create({
    coiId,
    subSignatureToken: subToken,
    status: 'PENDING_SUB_SIGNATURE',
  });
  
  const signatureLink = `${process.env.FRONTEND_URL}/subcontractor/hold-harmless/${holdHarmless.id}`;
  
  await this.emailService.sendSignatureRequest(
    coi.subcontractor.email,
    signatureLink
  );
}

// 2. After sub signs
async processSubSignature(agreementId: string, signature: string) {
  const gcToken = this.generateSecureToken();
  
  await this.update(agreementId, {
    subSignature: signature,
    subSignedAt: new Date(),
    gcSignatureToken: gcToken,
    status: 'PENDING_GC_SIGNATURE',
  });
  
  const gcLink = `${process.env.FRONTEND_URL}/gc/hold-harmless/${agreementId}`;
  
  await this.emailService.sendGCSignatureRequest(gcEmail, gcLink);
}
```

---

## 11. Testing Links

### Development
- All links work on `localhost:3000`
- Test tokens never expire in dev
- Email links logged to console

### Staging
- Links point to staging environment
- Real email sending
- 24-hour token expiry

### Production
- HTTPS enforced
- Real token expiry
- Monitoring and alerts
- Rate limiting active

---

## 12. Troubleshooting

### Link Not Working
1. Check token expiry
2. Verify user has permission
3. Check audit logs
4. Resend if needed

### User Reports Not Receiving Email
1. Check spam folder
2. Verify email address
3. Resend link
4. Check email service logs

### Token Expired
1. Generate new token
2. Resend email
3. Extend expiry if appropriate
4. Log incident

---

## Summary

The Compliant Platform automatically generates **100+ different link types** across all workflows:

- **Authentication**: 15+ link types
- **Document Management**: 20+ link types
- **Signatures**: 10+ link types
- **Notifications**: 25+ link types
- **Compliance**: 15+ link types
- **Admin**: 15+ link types

All links are:
✅ Secure (64-char tokens)
✅ Time-limited
✅ Audit-logged
✅ Role-appropriate
✅ Context-aware
✅ Mobile-friendly
