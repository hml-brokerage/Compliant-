# Email System & Automatic Link Creation - Test Documentation

## Overview
This document provides comprehensive documentation of the email system, automatic link creation, and notification workflows implemented in the Compliant Platform.

## 1. Email Service Implementation

### Email Service Configuration
**Location**: `packages/backend/src/modules/email/email.service.ts`

The EmailService uses nodemailer with Microsoft 365 SMTP configuration:
- Host: `smtp.office365.com`
- Port: `587` (STARTTLS)
- Authentication: Username/Password from environment variables
- TLS: Secure with minimum TLSv1.2

### Environment Variables Required
```bash
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-password
FRONTEND_URL=http://localhost:3000
```

## 2. Automated Email Types

### 2.1 Welcome Email for Subcontractors
**Trigger**: When a new subcontractor account is created
**Recipients**: Subcontractor email
**Contains**:
- Welcome message
- Account activation link with reset token
- Password setup instructions
- Next steps (set password → log in → add broker → broker uploads COI)

**Automatic Link Generation**:
```typescript
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
```

### 2.2 Welcome Email for Brokers
**Trigger**: When a broker account is created
**Recipients**: Broker email
**Contains**:
- Welcome message with subcontractor name
- Account activation link with reset token
- Broker responsibilities outline
- Instructions for uploading policies

**Automatic Link Generation**:
```typescript
const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
```

### 2.3 Compliance Confirmation Email
**Trigger**: When COI is approved and all documents are compliant
**Recipients**: GC, Subcontractor, and Broker
**Contains**:
- Compliance status: ✓ COMPLIANT
- Project details
- Subcontractor information
- Confirmation message

### 2.4 Non-Compliance Alert Email
**Trigger**: When COI is rejected or issues are found
**Recipients**: GC, Subcontractor, and Broker
**Contains**:
- Alert status: ⚠️ NON-COMPLIANT
- Reason for non-compliance
- Action required for each party
- Urgency notification

### 2.5 Document Upload Notification
**Trigger**: When broker uploads new COI documents
**Recipients**: Admin/Manager email
**Contains**:
- Notification of new upload
- Subcontractor and project details
- Upload type (first-time or renewal)
- Review link with automatic URL generation

**Automatic Link Generation**:
```typescript
const reviewLink = `${process.env.FRONTEND_URL}/admin/coi-reviews`;
```

## 3. Hold Harmless Agreement - Automatic Signature Links

### 3.1 Automatic Generation Workflow
**Location**: `packages/backend/src/modules/hold-harmless/hold-harmless.service.ts`

**Trigger**: Automatically when COI status changes to ACTIVE

**Workflow**:
1. System auto-generates hold harmless agreement
2. Auto-fills project address, GC info, owner's entity, additional insureds
3. Generates unique signature token for subcontractor
4. Sends signature link to subcontractor email
5. After sub signs, generates GC token and sends link to GC
6. After GC signs, notifies all parties

### 3.2 Subcontractor Signature Link Email
**Trigger**: Automatically after hold harmless generation
**Recipients**: Subcontractor email
**Contains**:
- Notification of pending signature
- Login link to access agreement
- Instructions to review and sign

**Automatic Link Generation**:
```typescript
const signatureUrl = `${process.env.FRONTEND_URL}/subcontractor/hold-harmless/${holdHarmless.id}`;
```

**Security Token Generation**:
```typescript
private generateSignatureToken(): string {
  return randomBytes(32).toString("hex"); // 64-character hex token
}
```

### 3.3 GC Signature Link Email
**Trigger**: Automatically after subcontractor signs
**Recipients**: GC email
**Contains**:
- Notification of ready-to-sign agreement
- Login link to access agreement
- Confirmation that subcontractor has signed

**Automatic Link Generation**:
```typescript
const gcSignatureUrl = `${process.env.FRONTEND_URL}/gc/hold-harmless/${holdHarmless.id}`;
```

### 3.4 Resend Signature Link
**Endpoint**: `POST /api/hold-harmless/{id}/resend/{party}`
**Functionality**: Allows resending signature links to SUB or GC
**Parameters**:
- `id`: Hold harmless agreement ID
- `party`: "SUB" or "GC"

## 4. Automatic Link Types Summary

### Password Reset Links
- **Format**: `/reset-password?token={uniqueToken}`
- **Expiry**: 24 hours
- **Use**: Account activation and password reset

### Signature Links (Authenticated)
- **Subcontractor**: `/subcontractor/hold-harmless/{agreementId}`
- **GC**: `/gc/hold-harmless/{agreementId}`
- **Security**: Requires authentication, uses session-based access

### Review Links
- **Admin COI Review**: `/admin/coi-reviews`
- **Use**: Quick access for administrators to review pending documents

## 5. Email Template Features

### Professional Styling
- Responsive design with max-width 600px
- Color-coded by recipient type:
  - Subcontractor: Purple (#7c3aed)
  - Broker: Green (#10b981)
  - Admin: Blue (#3b82f6)
  - Alerts: Red (#dc2626)

### Accessibility
- Both HTML and plain text versions
- Clear call-to-action buttons
- Fallback links for button failures

### Security
- Links include secure tokens
- Time-limited access
- TLS encryption for email transmission

## 6. Testing Email Functionality

### Prerequisites
1. Configure SMTP environment variables
2. Ensure backend server is running
3. Have test email addresses ready

### Test Scenarios

#### Test 1: Subcontractor Welcome Email
```bash
# Create new subcontractor via API
POST /api/contractors
{
  "name": "Test Subcontractor",
  "email": "test@example.com",
  "type": "SUBCONTRACTOR"
}
# Check email inbox for welcome message with password reset link
```

#### Test 2: Hold Harmless Signature Flow
```bash
# 1. Approve COI (triggers auto-generation)
PATCH /api/generated-coi/{id}/review
{
  "status": "ACTIVE"
}
# 2. Check subcontractor email for signature link
# 3. Complete subcontractor signature
# 4. Check GC email for signature link
# 5. Complete GC signature
# 6. Verify completion emails sent to all parties
```

#### Test 3: Document Upload Notification
```bash
# Upload COI as broker
PATCH /api/generated-coi/{id}/upload
{
  "policies": [...],
  "coiDocument": "..."
}
# Check admin email for review notification
```

#### Test 4: Compliance Alerts
```bash
# Approve COI
PATCH /api/generated-coi/{id}/review { "status": "ACTIVE" }
# Check emails to GC, Sub, and Broker for compliance confirmation

# Reject COI
PATCH /api/generated-coi/{id}/review { "status": "DEFICIENT", "reason": "..." }
# Check emails to GC, Sub, and Broker for non-compliance alert
```

## 7. Console Monitoring

### Email Sending Logs
The EmailService logs all email operations:
- ✓ Success: "Email sent successfully: {messageId}"
- ✗ Failure: "Failed to send email: {error}"

### Hold Harmless Logs
- "Hold harmless already exists for COI {id}, skipping generation"
- "Program does not require hold harmless for COI {id}"
- Token generation and link creation logged for debugging

## 8. Error Handling

### Email Failures
- Non-blocking: System continues operation even if email fails
- Logged errors for administrator review
- Retry capability through resend endpoints

### Link Generation Failures
- Validation of environment variables
- Fallback to localhost for development
- Clear error messages in logs

## 9. API Endpoints for Testing

### Email-Related Endpoints
- `POST /api/auth/forgot-password` - Triggers password reset email
- `POST /api/contractors` - Triggers welcome emails
- `PATCH /api/generated-coi/{id}/review` - Triggers compliance/alert emails
- `PATCH /api/generated-coi/{id}/upload` - Triggers notification emails

### Hold Harmless Endpoints
- `POST /api/hold-harmless/auto-generate/{coiId}` - Manual trigger
- `GET /api/hold-harmless/{id}` - View agreement details
- `POST /api/hold-harmless/{id}/sign/subcontractor` - Sign as sub
- `POST /api/hold-harmless/{id}/sign/gc` - Sign as GC
- `POST /api/hold-harmless/{id}/resend/{party}` - Resend signature link
- `GET /api/hold-harmless/stats` - View statistics

## 10. Messaging System Architecture

### Email as Primary Messaging
The platform uses email as the primary messaging/notification system with:
- Real-time notifications on status changes
- Automatic reminders for pending actions
- Multi-party communication (GC, Sub, Broker, Admin)

### Future Messaging Enhancements
While the current implementation uses email-based messaging, the architecture supports:
- In-app notifications
- SMS notifications (via additional service)
- Webhook integrations
- Push notifications

## 11. Validation Checklist

- [x] Email service configured with SMTP
- [x] All email templates created and styled
- [x] Automatic link generation for all workflows
- [x] Hold harmless signature workflow implemented
- [x] Token-based security for sensitive links
- [x] Multi-party notifications (GC, Sub, Broker, Admin)
- [x] Error handling and logging
- [x] Resend capability for failed/missed emails
- [x] Plain text fallback for all HTML emails
- [x] Environment-based URL configuration

## 12. Screenshots Reference

Screenshots demonstrating email functionality would include:
1. Email service code implementation
2. Hold harmless auto-generation workflow
3. Signature link generation code
4. Email template rendering
5. API endpoint documentation in Swagger
6. Console logs showing email sending
7. Token generation and validation

---

**Last Updated**: 2026-01-18
**Status**: ✅ Fully Implemented and Documented
