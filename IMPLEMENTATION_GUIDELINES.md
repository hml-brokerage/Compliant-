# Implementation Guidelines - Compliant Insurance Platform

## Overview

This document provides comprehensive guidelines for implementing the Compliant Insurance Tracking Platform features in a phased approach. The implementation is broken down into distinct Pull Requests (PRs) to ensure manageable, reviewable, and testable code changes.

## Table of Contents

1. [General Guidelines](#general-guidelines)
2. [PR #2: Core Infrastructure](#pr-2-core-infrastructure)
3. [PR #3: AI & Document Processing](#pr-3-ai--document-processing)
4. [PR #4: COI Workflow](#pr-4-coi-workflow)
5. [PR #5: External Integrations](#pr-5-external-integrations)
6. [PR #6: Communication & Monitoring](#pr-6-communication--monitoring)
7. [PR #7: Admin Tools & Portals](#pr-7-admin-tools--portals)
8. [Testing Requirements](#testing-requirements)
9. [Security Considerations](#security-considerations)
10. [Code Quality Standards](#code-quality-standards)

---

## General Guidelines

### Development Principles

1. **Type Safety First**: Use TypeScript strictly with no `any` types
2. **API-First Design**: Define OpenAPI/Swagger specs before implementation
3. **Test-Driven Development**: Write tests before or alongside implementation
4. **Security by Default**: Implement security controls from the start
5. **Performance Considerations**: Consider scalability and performance impacts
6. **Documentation**: Update docs with each feature addition

### Code Structure

```
packages/
├── backend/
│   ├── src/
│   │   ├── modules/           # Feature modules
│   │   ├── common/            # Shared utilities
│   │   ├── config/            # Configuration
│   │   └── main.ts
│   └── prisma/
│       └── schema.prisma      # Database schema
├── frontend/
│   ├── app/                   # Next.js App Router pages
│   ├── components/            # Reusable components
│   ├── lib/                   # Utilities and hooks
│   └── types/                 # TypeScript types
└── shared/
    └── src/                   # Shared types and validators
```

### Commit Convention

Follow Conventional Commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation updates
- `test:` - Test additions or updates
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

### PR Requirements

Each PR must include:
- [ ] Feature implementation
- [ ] Unit tests (minimum 80% coverage)
- [ ] Integration tests where applicable
- [ ] API documentation updates
- [ ] Database migrations (if schema changes)
- [ ] Environment variable documentation
- [ ] README updates
- [ ] Security review checklist

---

## PR #2: Core Infrastructure

**Goal**: Establish foundational services required by all other features.

### Features to Implement

#### 1. Enhanced Authentication System

**Backend (NestJS)**:
- Implement JWT with refresh token rotation
- Add session management with Redis
- Support for password reset flow
- Two-factor authentication (2FA) support
- Rate limiting on auth endpoints

**Files to Create/Modify**:
```
packages/backend/src/modules/auth/
├── auth.controller.ts
├── auth.service.ts
├── strategies/
│   ├── jwt.strategy.ts
│   ├── jwt-refresh.strategy.ts
│   └── local.strategy.ts
├── guards/
│   ├── jwt-auth.guard.ts
│   ├── roles.guard.ts
│   └── 2fa.guard.ts
└── dto/
    ├── login.dto.ts
    ├── refresh-token.dto.ts
    ├── reset-password.dto.ts
    └── verify-2fa.dto.ts
```

**Database Schema**:
```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  expiresAt DateTime
  createdAt DateTime @default(now())
  revoked   Boolean  @default(false)
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  ipAddress String?
  userAgent String?
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

**Environment Variables**:
```env
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
REDIS_URL=redis://localhost:6379
SESSION_EXPIRATION=30d
```

**Testing Requirements**:
- Unit tests for AuthService methods
- E2E tests for login/logout/refresh flows
- Test token expiration and renewal
- Test rate limiting
- Test 2FA workflow

#### 2. Email Service Integration

**Backend Implementation**:
- Email service abstraction layer
- Support for multiple providers (SendGrid, AWS SES, SMTP)
- Email templates using Handlebars
- Queue system for reliable delivery
- Email tracking and logging

**Files to Create**:
```
packages/backend/src/modules/email/
├── email.module.ts
├── email.service.ts
├── email.processor.ts
├── dto/
│   ├── send-email.dto.ts
│   └── email-template.dto.ts
├── templates/
│   ├── welcome.hbs
│   ├── password-reset.hbs
│   ├── insurance-expiring.hbs
│   └── policy-deficiency.hbs
└── providers/
    ├── sendgrid.provider.ts
    ├── ses.provider.ts
    └── smtp.provider.ts
```

**Database Schema**:
```prisma
model EmailLog {
  id          String   @id @default(cuid())
  to          String
  from        String
  subject     String
  template    String
  status      EmailStatus
  sentAt      DateTime?
  errorMsg    String?
  metadata    Json?
  createdAt   DateTime @default(now())
}

enum EmailStatus {
  PENDING
  SENT
  FAILED
  BOUNCED
}
```

**Environment Variables**:
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=
AWS_SES_REGION=
AWS_SES_ACCESS_KEY=
AWS_SES_SECRET_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@compliant.com
```

**Testing Requirements**:
- Mock email providers in tests
- Test template rendering
- Test queue processing
- Test delivery retry logic
- Test error handling

#### 3. File Upload Service

**Backend Implementation**:
- Multi-provider support (S3, Azure Blob, Local)
- File type validation
- Virus scanning integration
- Thumbnail generation for images
- File metadata extraction
- Secure signed URLs for downloads

**Files to Create**:
```
packages/backend/src/modules/files/
├── files.module.ts
├── files.service.ts
├── files.controller.ts
├── dto/
│   ├── upload-file.dto.ts
│   └── file-metadata.dto.ts
├── providers/
│   ├── s3.provider.ts
│   ├── azure-blob.provider.ts
│   └── local.provider.ts
└── interceptors/
    ├── file-upload.interceptor.ts
    └── file-validation.interceptor.ts
```

**Database Schema**:
```prisma
model File {
  id              String   @id @default(cuid())
  filename        String
  originalName    String
  mimeType        String
  size            Int
  path            String
  url             String?
  thumbnailUrl    String?
  uploadedBy      String
  user            User     @relation(fields: [uploadedBy], references: [id])
  virusScanned    Boolean  @default(false)
  virusScanResult String?
  metadata        Json?
  createdAt       DateTime @default(now())
  
  @@index([uploadedBy])
}
```

**Environment Variables**:
```env
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=
AWS_S3_REGION=
AWS_S3_ACCESS_KEY=
AWS_S3_SECRET_KEY=
AZURE_STORAGE_CONNECTION_STRING=
AZURE_STORAGE_CONTAINER=
LOCAL_STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,doc,docx
VIRUS_SCAN_ENABLED=true
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

**Testing Requirements**:
- Test file upload with different providers
- Test file type validation
- Test file size limits
- Test virus scanning integration
- Test thumbnail generation
- Test signed URL generation

#### 4. Session Management

**Backend Implementation**:
- Redis-based session storage
- Session lifecycle management
- Device tracking
- Session revocation
- Active session listing

**Files to Create**:
```
packages/backend/src/modules/sessions/
├── sessions.module.ts
├── sessions.service.ts
├── sessions.controller.ts
└── dto/
    ├── session.dto.ts
    └── revoke-session.dto.ts
```

**Frontend Implementation**:
- Session timeout handling
- Auto-refresh before expiration
- Multi-tab synchronization
- Logout from all devices

**Testing Requirements**:
- Test session creation and validation
- Test session expiration
- Test concurrent sessions
- Test session revocation
- Test multi-device scenarios

---

## PR #3: AI & Document Processing

**Goal**: Implement intelligent document processing capabilities for insurance certificates.

### Features to Implement

#### 1. Adobe PDF Services Integration

**Backend Implementation**:
- PDF text extraction
- PDF form field detection
- PDF validation
- PDF compression and optimization
- PDF conversion (PDF to images)

**Files to Create**:
```
packages/backend/src/modules/pdf/
├── pdf.module.ts
├── pdf.service.ts
├── dto/
│   ├── extract-pdf-text.dto.ts
│   └── validate-pdf.dto.ts
└── interfaces/
    └── pdf-metadata.interface.ts
```

**Environment Variables**:
```env
ADOBE_CLIENT_ID=
ADOBE_CLIENT_SECRET=
ADOBE_ORGANIZATION_ID=
```

**Testing Requirements**:
- Test PDF text extraction accuracy
- Test form field detection
- Test PDF validation
- Mock Adobe API in tests

#### 2. OpenAI/Claude Integration

**Backend Implementation**:
- LLM provider abstraction
- Insurance document analysis
- Policy data extraction
- Document classification
- Natural language queries
- Prompt template management

**Files to Create**:
```
packages/backend/src/modules/ai/
├── ai.module.ts
├── ai.service.ts
├── providers/
│   ├── openai.provider.ts
│   └── claude.provider.ts
├── prompts/
│   ├── extract-insurance-data.prompt.ts
│   ├── classify-document.prompt.ts
│   └── validate-coverage.prompt.ts
└── dto/
    ├── analyze-document.dto.ts
    └── extract-data.dto.ts
```

**Database Schema**:
```prisma
model AIAnalysis {
  id                String   @id @default(cuid())
  documentId        String
  provider          String   // openai, claude
  model             String   // gpt-4, claude-3-opus
  prompt            String
  response          Json
  tokensUsed        Int
  cost              Float
  processingTime    Int      // milliseconds
  confidence        Float?
  extractedData     Json?
  createdAt         DateTime @default(now())
  
  @@index([documentId])
  @@index([createdAt])
}
```

**Environment Variables**:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
AI_MODEL=gpt-4
AI_TEMPERATURE=0.2
AI_MAX_TOKENS=2000
```

**Testing Requirements**:
- Mock AI provider responses
- Test prompt templates
- Test extraction accuracy with sample documents
- Test error handling for API failures
- Test cost tracking

#### 3. Auto-Extraction System

**Backend Implementation**:
- Automated insurance data extraction
- Named Entity Recognition (NER) for insurance terms
- Date parsing and normalization
- Coverage amount extraction
- Policy number detection
- Insurer identification

**Files to Create**:
```
packages/backend/src/modules/extraction/
├── extraction.module.ts
├── extraction.service.ts
├── extractors/
│   ├── policy-number.extractor.ts
│   ├── coverage-amount.extractor.ts
│   ├── dates.extractor.ts
│   ├── insurer.extractor.ts
│   └── named-insured.extractor.ts
└── dto/
    ├── extraction-result.dto.ts
    └── validate-extraction.dto.ts
```

**Database Schema**:
```prisma
model ExtractionResult {
  id              String   @id @default(cuid())
  documentId      String
  extractionType  String
  extractedData   Json
  confidence      Float
  needsReview     Boolean  @default(false)
  reviewedBy      String?
  reviewedAt      DateTime?
  corrections     Json?
  createdAt       DateTime @default(now())
  
  @@index([documentId])
  @@index([needsReview])
}
```

**Frontend Implementation**:
- Document upload with preview
- Real-time extraction progress
- Extraction result review interface
- Manual correction capabilities
- Confidence score visualization

**Testing Requirements**:
- Test extraction with various insurance certificate formats
- Test accuracy with ground truth dataset
- Test confidence scoring
- Test manual correction workflow
- Load testing for concurrent extractions

---

## PR #4: COI Workflow

**Goal**: Implement Certificate of Insurance review and approval workflow.

### Features to Implement

#### 1. Review System

**Backend Implementation**:
- COI submission workflow
- Review queue management
- Assignment rules
- Review history tracking
- Status transitions

**Files to Create**:
```
packages/backend/src/modules/coi-review/
├── coi-review.module.ts
├── coi-review.service.ts
├── coi-review.controller.ts
├── dto/
│   ├── submit-review.dto.ts
│   ├── assign-reviewer.dto.ts
│   └── review-decision.dto.ts
└── entities/
    └── coi-review.entity.ts
```

**Database Schema**:
```prisma
model COIReview {
  id                String         @id @default(cuid())
  contractorId      String
  contractor        Contractor     @relation(fields: [contractorId], references: [id])
  documentId        String
  submittedBy       String
  submitter         User           @relation("Submitter", fields: [submittedBy], references: [id])
  assignedTo        String?
  reviewer          User?          @relation("Reviewer", fields: [assignedTo], references: [id])
  status            ReviewStatus
  priority          Priority       @default(NORMAL)
  dueDate           DateTime?
  submittedAt       DateTime       @default(now())
  reviewedAt        DateTime?
  decision          ReviewDecision?
  notes             String?
  deficiencies      Deficiency[]
  history           ReviewHistory[]
  
  @@index([contractorId])
  @@index([status])
  @@index([assignedTo])
  @@index([dueDate])
}

enum ReviewStatus {
  PENDING
  IN_REVIEW
  APPROVED
  REJECTED
  REQUIRES_CHANGES
}

enum Priority {
  LOW
  NORMAL
  HIGH
  URGENT
}

enum ReviewDecision {
  APPROVED
  REJECTED
  CONDITIONAL_APPROVAL
}
```

**Frontend Implementation**:
- Review queue dashboard
- Document viewer with annotation
- Review form
- Status indicators
- Filtering and sorting

**Testing Requirements**:
- Test review queue management
- Test assignment logic
- Test status transitions
- Test notification triggers
- E2E workflow tests

#### 2. Approval System

**Backend Implementation**:
- Multi-level approval workflow
- Approval delegation
- Approval history
- Conditional approvals
- Auto-approval rules

**Files to Create**:
```
packages/backend/src/modules/approvals/
├── approvals.module.ts
├── approvals.service.ts
├── approvals.controller.ts
├── rules/
│   └── auto-approval-rules.ts
└── dto/
    ├── approval-request.dto.ts
    └── approval-decision.dto.ts
```

**Database Schema**:
```prisma
model Approval {
  id            String          @id @default(cuid())
  reviewId      String
  review        COIReview       @relation(fields: [reviewId], references: [id])
  approverId    String
  approver      User            @relation(fields: [approverId], references: [id])
  decision      ApprovalDecision
  comments      String?
  conditions    String?
  approvedAt    DateTime        @default(now())
  
  @@index([reviewId])
  @@index([approverId])
}

enum ApprovalDecision {
  APPROVED
  REJECTED
  DELEGATED
}

model ApprovalRule {
  id              String   @id @default(cuid())
  name            String
  description     String?
  conditions      Json
  action          String
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Testing Requirements**:
- Test approval workflow
- Test delegation
- Test auto-approval rules
- Test conditional approvals
- Test approval history

#### 3. Deficiency Management

**Backend Implementation**:
- Deficiency tracking
- Deficiency categorization
- Resolution workflow
- Reminder system
- Deficiency templates

**Files to Create**:
```
packages/backend/src/modules/deficiencies/
├── deficiencies.module.ts
├── deficiencies.service.ts
├── deficiencies.controller.ts
├── templates/
│   └── deficiency-templates.ts
└── dto/
    ├── create-deficiency.dto.ts
    ├── resolve-deficiency.dto.ts
    └── deficiency-template.dto.ts
```

**Database Schema**:
```prisma
model Deficiency {
  id                String            @id @default(cuid())
  reviewId          String
  review            COIReview         @relation(fields: [reviewId], references: [id])
  category          DeficiencyCategory
  severity          Severity
  description       String
  requiredAction    String
  dueDate           DateTime
  status            DeficiencyStatus  @default(OPEN)
  resolvedBy        String?
  resolver          User?             @relation(fields: [resolvedBy], references: [id])
  resolvedAt        DateTime?
  resolutionNotes   String?
  reminders         Reminder[]
  createdAt         DateTime          @default(now())
  updatedAt         DateTime          @updatedAt
  
  @@index([reviewId])
  @@index([status])
  @@index([dueDate])
}

enum DeficiencyCategory {
  COVERAGE_AMOUNT
  EXPIRED_POLICY
  MISSING_ENDORSEMENT
  INCORRECT_NAMED_INSURED
  MISSING_ADDITIONAL_INSURED
  CERTIFICATE_HOLDER
  OTHER
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

enum DeficiencyStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  WAIVED
}

model Reminder {
  id              String      @id @default(cuid())
  deficiencyId    String
  deficiency      Deficiency  @relation(fields: [deficiencyId], references: [id])
  sentTo          String
  recipient       User        @relation(fields: [sentTo], references: [id])
  sentAt          DateTime    @default(now())
  acknowledged    Boolean     @default(false)
  
  @@index([deficiencyId])
}
```

**Frontend Implementation**:
- Deficiency list view
- Deficiency creation form
- Resolution tracking
- Deficiency templates picker
- Reminder management

**Testing Requirements**:
- Test deficiency creation
- Test resolution workflow
- Test reminder system
- Test deficiency templates
- Test status transitions

---

## PR #5: External Integrations

**Goal**: Integrate with external services for enhanced functionality.

### Features to Implement

#### 1. NYC DOB API Integration

**Backend Implementation**:
- DOB business lookup
- License verification
- Violation history retrieval
- Complaint history
- Certificate of insurance filing

**Files to Create**:
```
packages/backend/src/modules/integrations/nyc-dob/
├── nyc-dob.module.ts
├── nyc-dob.service.ts
├── nyc-dob.controller.ts
├── dto/
│   ├── lookup-business.dto.ts
│   ├── verify-license.dto.ts
│   └── file-coi.dto.ts
└── interfaces/
    └── dob-response.interface.ts
```

**Database Schema**:
```prisma
model DOBRecord {
  id                String   @id @default(cuid())
  contractorId      String
  contractor        Contractor @relation(fields: [contractorId], references: [id])
  licenseNumber     String
  businessName      String
  licenseType       String
  licenseStatus     String
  expirationDate    DateTime?
  violations        Json?
  complaints        Json?
  lastVerified      DateTime @default(now())
  
  @@index([contractorId])
  @@index([licenseNumber])
}
```

**Environment Variables**:
```env
NYC_DOB_API_KEY=
NYC_DOB_API_URL=https://data.cityofnewyork.us/resource/
NYC_DOB_CACHE_TTL=3600
```

**Testing Requirements**:
- Mock DOB API responses
- Test license verification
- Test data parsing
- Test error handling
- Test rate limiting

#### 2. Google Places API Integration

**Backend Implementation**:
- Business address validation
- Business information enrichment
- Geocoding
- Address autocomplete
- Business verification

**Files to Create**:
```
packages/backend/src/modules/integrations/google-places/
├── google-places.module.ts
├── google-places.service.ts
├── google-places.controller.ts
├── dto/
│   ├── validate-address.dto.ts
│   ├── geocode.dto.ts
│   └── place-details.dto.ts
└── interfaces/
    └── place.interface.ts
```

**Database Schema**:
```prisma
model PlaceVerification {
  id              String   @id @default(cuid())
  contractorId    String
  contractor      Contractor @relation(fields: [contractorId], references: [id])
  placeId         String
  name            String
  address         String
  phone           String?
  website         String?
  businessStatus  String
  rating          Float?
  userRatingsTotal Int?
  verified        Boolean  @default(false)
  verifiedAt      DateTime @default(now())
  
  @@index([contractorId])
  @@index([placeId])
}
```

**Environment Variables**:
```env
GOOGLE_PLACES_API_KEY=
GOOGLE_PLACES_CACHE_TTL=86400
```

**Frontend Implementation**:
- Address autocomplete input
- Business verification badge
- Map integration
- Place details display

**Testing Requirements**:
- Mock Google Places API
- Test address validation
- Test autocomplete
- Test geocoding
- Test place details retrieval

---

## PR #6: Communication & Monitoring

**Goal**: Implement comprehensive communication and monitoring systems.

### Features to Implement

#### 1. Messaging System

**Backend Implementation**:
- Internal messaging
- Message threads
- Read receipts
- File attachments
- Message search
- Notifications

**Files to Create**:
```
packages/backend/src/modules/messaging/
├── messaging.module.ts
├── messaging.service.ts
├── messaging.controller.ts
├── messaging.gateway.ts (WebSocket)
├── dto/
│   ├── send-message.dto.ts
│   ├── message-thread.dto.ts
│   └── mark-read.dto.ts
└── entities/
    ├── message.entity.ts
    └── thread.entity.ts
```

**Database Schema**:
```prisma
model MessageThread {
  id            String    @id @default(cuid())
  subject       String?
  participants  User[]    @relation("ThreadParticipants")
  messages      Message[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastMessageAt DateTime?
  
  @@index([updatedAt])
}

model Message {
  id          String        @id @default(cuid())
  threadId    String
  thread      MessageThread @relation(fields: [threadId], references: [id])
  senderId    String
  sender      User          @relation(fields: [senderId], references: [id])
  content     String        @db.Text
  attachments Json?
  readBy      MessageRead[]
  createdAt   DateTime      @default(now())
  
  @@index([threadId])
  @@index([senderId])
  @@index([createdAt])
}

model MessageRead {
  id        String   @id @default(cuid())
  messageId String
  message   Message  @relation(fields: [messageId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  readAt    DateTime @default(now())
  
  @@unique([messageId, userId])
  @@index([userId])
}
```

**Frontend Implementation**:
- Message inbox interface
- Real-time message updates (WebSocket)
- Message composition
- Thread view
- Attachment handling

**Testing Requirements**:
- Test message sending
- Test real-time updates
- Test read receipts
- Test message search
- Test file attachments

#### 2. Notification System

**Backend Implementation**:
- Multi-channel notifications (email, in-app, SMS)
- Notification preferences
- Notification templates
- Notification scheduling
- Notification history

**Files to Create**:
```
packages/backend/src/modules/notifications/
├── notifications.module.ts
├── notifications.service.ts
├── notifications.controller.ts
├── notifications.gateway.ts
├── channels/
│   ├── email.channel.ts
│   ├── in-app.channel.ts
│   └── sms.channel.ts
├── templates/
│   └── notification-templates.ts
└── dto/
    ├── send-notification.dto.ts
    └── notification-preferences.dto.ts
```

**Database Schema**:
```prisma
model Notification {
  id            String             @id @default(cuid())
  userId        String
  user          User               @relation(fields: [userId], references: [id])
  type          NotificationType
  title         String
  message       String             @db.Text
  data          Json?
  channels      NotificationChannel[]
  read          Boolean            @default(false)
  readAt        DateTime?
  actionUrl     String?
  createdAt     DateTime           @default(now())
  
  @@index([userId, read])
  @@index([createdAt])
}

enum NotificationType {
  POLICY_EXPIRING
  REVIEW_ASSIGNED
  APPROVAL_REQUIRED
  DEFICIENCY_CREATED
  MESSAGE_RECEIVED
  SYSTEM_ALERT
}

enum NotificationChannel {
  EMAIL
  IN_APP
  SMS
}

model NotificationPreference {
  id        String                @id @default(cuid())
  userId    String                @unique
  user      User                  @relation(fields: [userId], references: [id])
  settings  Json                  // { POLICY_EXPIRING: ['EMAIL', 'IN_APP'], ... }
  createdAt DateTime              @default(now())
  updatedAt DateTime              @updatedAt
}
```

**Environment Variables**:
```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_ENABLED=true
```

**Frontend Implementation**:
- Notification center
- Real-time notification updates
- Notification preferences page
- Notification badges
- Mark as read functionality

**Testing Requirements**:
- Test notification delivery across channels
- Test notification preferences
- Test real-time updates
- Test notification history
- Mock external services (Twilio)

#### 3. Expiring Policy Alerts

**Backend Implementation**:
- Policy expiration tracking
- Automated alert scheduling
- Escalation rules
- Alert history
- Customizable alert thresholds

**Files to Create**:
```
packages/backend/src/modules/policy-alerts/
├── policy-alerts.module.ts
├── policy-alerts.service.ts
├── policy-alerts.scheduler.ts
├── dto/
│   ├── alert-config.dto.ts
│   └── alert-history.dto.ts
└── rules/
    └── escalation-rules.ts
```

**Database Schema**:
```prisma
model PolicyAlert {
  id                String       @id @default(cuid())
  policyId          String
  policy            InsuranceDocument @relation(fields: [policyId], references: [id])
  alertType         AlertType
  severity          Severity
  daysUntilExpiry   Int
  sentTo            String[]
  sentAt            DateTime     @default(now())
  acknowledged      Boolean      @default(false)
  acknowledgedBy    String?
  acknowledgedAt    DateTime?
  
  @@index([policyId])
  @@index([sentAt])
}

enum AlertType {
  EXPIRING_SOON_30
  EXPIRING_SOON_14
  EXPIRING_SOON_7
  EXPIRED
}

model AlertConfig {
  id              String   @id @default(cuid())
  organizationId  String
  alertThresholds Json     // { 30: ['EMAIL'], 14: ['EMAIL', 'SMS'], 7: ['EMAIL', 'SMS', 'IN_APP'] }
  escalationRules Json
  enabled         Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

**Testing Requirements**:
- Test alert scheduling
- Test alert generation
- Test escalation rules
- Test alert delivery
- Test acknowledgment workflow

---

## PR #7: Admin Tools & Portals

**Goal**: Implement administrative interfaces and portal systems.

### Features to Implement

#### 1. Admin Management Interface

**Backend Implementation**:
- User management
- Role management
- Permission management
- System configuration
- Audit logging
- Analytics dashboard

**Files to Create**:
```
packages/backend/src/modules/admin/
├── admin.module.ts
├── admin.service.ts
├── admin.controller.ts
├── dto/
│   ├── manage-user.dto.ts
│   ├── manage-role.dto.ts
│   └── system-config.dto.ts
└── guards/
    └── admin.guard.ts
```

**Database Schema**:
```prisma
model AuditLog {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  action      String
  resource    String
  resourceId  String?
  changes     Json?
  ipAddress   String?
  userAgent   String?
  timestamp   DateTime @default(now())
  
  @@index([userId])
  @@index([resource, resourceId])
  @@index([timestamp])
}

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  updatedBy String
  admin     User     @relation(fields: [updatedBy], references: [id])
  updatedAt DateTime @updatedAt
}

model Role {
  id          String       @id @default(cuid())
  name        String       @unique
  description String?
  permissions Permission[]
  users       User[]
  createdAt   DateTime     @default(now())
}

model Permission {
  id          String   @id @default(cuid())
  name        String   @unique
  resource    String
  action      String
  description String?
  roles       Role[]
  
  @@unique([resource, action])
}
```

**Frontend Implementation** (`packages/frontend/app/admin/`):
- User management table
- Role editor
- Permission matrix
- System settings
- Audit log viewer
- Analytics dashboard

**Testing Requirements**:
- Test user CRUD operations
- Test role management
- Test permission enforcement
- Test audit logging
- Test system configuration

#### 2. General Contractor (GC) Portal

**Backend Implementation**:
- GC-specific endpoints
- Contractor management
- Project management
- COI tracking
- Compliance dashboard
- Report generation

**Files to Create**:
```
packages/backend/src/modules/gc-portal/
├── gc-portal.module.ts
├── gc-portal.service.ts
├── gc-portal.controller.ts
├── dto/
│   ├── gc-dashboard.dto.ts
│   ├── contractor-compliance.dto.ts
│   └── project-status.dto.ts
└── reports/
    ├── compliance-report.ts
    └── expiration-report.ts
```

**Frontend Implementation** (`packages/frontend/app/gc-portal/`):
```
gc-portal/
├── dashboard/
│   └── page.tsx
├── contractors/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── projects/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── compliance/
│   └── page.tsx
└── reports/
    └── page.tsx
```

**Features**:
- Dashboard with compliance metrics
- Contractor list with status indicators
- Project timeline view
- Compliance reporting
- Bulk COI download
- Alert management

**Testing Requirements**:
- Test GC dashboard data
- Test contractor management
- Test project tracking
- Test report generation
- E2E portal workflows

#### 3. Broker Portal

**Backend Implementation**:
- Broker-specific endpoints
- Client management
- Policy tracking
- Renewal reminders
- Commission tracking
- Client communication

**Files to Create**:
```
packages/backend/src/modules/broker-portal/
├── broker-portal.module.ts
├── broker-portal.service.ts
├── broker-portal.controller.ts
├── dto/
│   ├── broker-dashboard.dto.ts
│   ├── client-management.dto.ts
│   └── policy-tracking.dto.ts
└── reports/
    └── commission-report.ts
```

**Database Schema**:
```prisma
model Broker {
  id              String     @id @default(cuid())
  userId          String     @unique
  user            User       @relation(fields: [userId], references: [id])
  licenseNumber   String     @unique
  agency          String
  phone           String
  email           String
  clients         Client[]
  commissions     Commission[]
  createdAt       DateTime   @default(now())
  
  @@index([licenseNumber])
}

model Client {
  id            String     @id @default(cuid())
  brokerId      String
  broker        Broker     @relation(fields: [brokerId], references: [id])
  contractorId  String     @unique
  contractor    Contractor @relation(fields: [contractorId], references: [id])
  policies      Policy[]
  notes         String?
  createdAt     DateTime   @default(now())
  
  @@index([brokerId])
}

model Policy {
  id              String     @id @default(cuid())
  clientId        String
  client          Client     @relation(fields: [clientId], references: [id])
  policyNumber    String     @unique
  policyType      String
  carrier         String
  premium         Float
  effectiveDate   DateTime
  expirationDate  DateTime
  status          PolicyStatus
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  
  @@index([clientId])
  @@index([expirationDate])
}

enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING_RENEWAL
}

model Commission {
  id            String   @id @default(cuid())
  brokerId      String
  broker        Broker   @relation(fields: [brokerId], references: [id])
  policyId      String
  amount        Float
  percentage    Float
  paidAt        DateTime?
  status        CommissionStatus
  createdAt     DateTime @default(now())
  
  @@index([brokerId])
}

enum CommissionStatus {
  PENDING
  PAID
  CANCELLED
}
```

**Frontend Implementation** (`packages/frontend/app/broker-portal/`):
```
broker-portal/
├── dashboard/
│   └── page.tsx
├── clients/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── policies/
│   ├── page.tsx
│   └── [id]/
│       └── page.tsx
├── renewals/
│   └── page.tsx
└── commissions/
    └── page.tsx
```

**Features**:
- Broker dashboard with client overview
- Client management interface
- Policy tracking and renewal management
- Commission tracking
- Client communication tools
- Report generation

**Testing Requirements**:
- Test broker dashboard
- Test client management
- Test policy tracking
- Test renewal workflow
- Test commission calculations
- E2E portal workflows

---

## Testing Requirements

### Unit Testing

**Coverage Requirements**:
- Minimum 80% code coverage
- 100% coverage for critical business logic
- All services must have comprehensive unit tests
- All DTOs must be validated

**Testing Tools**:
- Jest for JavaScript/TypeScript testing
- Supertest for API endpoint testing
- React Testing Library for component tests

**Test Structure**:
```typescript
describe('ServiceName', () => {
  let service: ServiceName;
  let mockDependency: MockType<Dependency>;

  beforeEach(async () => {
    // Setup
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      // Act
      // Assert
    });

    it('should handle error case', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### Integration Testing

**Areas to Test**:
- API endpoint workflows
- Database operations
- External service integrations
- Authentication flows
- File upload/download

**Test Database**:
- Use separate test database
- Reset database between tests
- Use transactions for test isolation

### End-to-End Testing

**Tools**:
- Playwright or Cypress for E2E tests

**Critical Workflows to Test**:
1. User registration and login
2. Contractor creation and management
3. COI upload and review
4. Approval workflow
5. Notification delivery
6. Report generation

### Performance Testing

**Load Testing**:
- Use k6 or Artillery
- Test concurrent users
- Test API response times
- Test database query performance

**Benchmarks**:
- API response time < 200ms (p95)
- Page load time < 2s
- Database queries < 100ms
- File upload < 5s (10MB file)

---

## Security Considerations

### Authentication & Authorization

- [ ] Implement strong password requirements
- [ ] Enable rate limiting on auth endpoints
- [ ] Implement account lockout after failed attempts
- [ ] Use secure JWT with short expiration
- [ ] Implement refresh token rotation
- [ ] Validate all inputs
- [ ] Use RBAC for authorization
- [ ] Implement session timeout

### Data Protection

- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS/TLS for all communications
- [ ] Implement proper CORS configuration
- [ ] Sanitize user inputs
- [ ] Use parameterized queries (Prisma)
- [ ] Implement file upload validation
- [ ] Scan uploaded files for viruses
- [ ] Use signed URLs for file downloads

### API Security

- [ ] Implement rate limiting
- [ ] Use API keys for external services
- [ ] Validate request payloads
- [ ] Implement request size limits
- [ ] Use CSRF protection
- [ ] Implement API versioning
- [ ] Log security events
- [ ] Monitor for suspicious activity

### Compliance

- [ ] GDPR compliance for data handling
- [ ] SOC 2 compliance considerations
- [ ] Data retention policies
- [ ] Right to deletion
- [ ] Data export capabilities
- [ ] Audit logging
- [ ] Privacy policy implementation

---

## Code Quality Standards

### TypeScript Standards

```typescript
// Use strict mode
"strict": true,
"strictNullChecks": true,
"noImplicitAny": true,

// No any types
// Bad
const data: any = await fetchData();

// Good
interface FetchDataResponse {
  id: string;
  name: string;
}
const data: FetchDataResponse = await fetchData();

// Use proper typing for functions
// Bad
function processData(data) {
  return data.map(item => item.value);
}

// Good
function processData(data: DataItem[]): number[] {
  return data.map(item => item.value);
}
```

### Code Organization

```typescript
// Group imports
// 1. External packages
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// 2. Internal modules
import { CreateUserDto } from './dto/create-user.dto';

// 3. Types/Interfaces
import { User } from '@prisma/client';

// Use dependency injection
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
}

// Keep functions small and focused
// Bad - too many responsibilities
async function createUserAndSendEmail(userData) {
  const user = await db.user.create(userData);
  await sendEmail(user.email);
  await createAuditLog('user_created', user.id);
  return user;
}

// Good - single responsibility
async function createUser(userData: CreateUserDto): Promise<User> {
  return await this.prisma.user.create({ data: userData });
}
```

### Error Handling

```typescript
// Use custom exceptions
throw new NotFoundException(`User with ID ${id} not found`);
throw new BadRequestException('Invalid input data');
throw new UnauthorizedException('Invalid credentials');

// Implement global exception filter
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // Handle and log exceptions
  }
}

// Use try-catch for async operations
async function processDocument(fileId: string): Promise<void> {
  try {
    const file = await this.fileService.getFile(fileId);
    await this.pdfService.extractText(file);
  } catch (error) {
    this.logger.error(`Failed to process document ${fileId}`, error);
    throw new InternalServerErrorException('Document processing failed');
  }
}
```

### Logging

```typescript
// Use structured logging
import { Logger } from '@nestjs/common';

export class MyService {
  private readonly logger = new Logger(MyService.name);

  async processData(id: string) {
    this.logger.log(`Processing data for ID: ${id}`);
    
    try {
      // Process
      this.logger.debug(`Data processed successfully for ID: ${id}`);
    } catch (error) {
      this.logger.error(
        `Failed to process data for ID: ${id}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

### Documentation

```typescript
/**
 * Service for managing user accounts
 * Handles user creation, authentication, and profile management
 */
@Injectable()
export class UserService {
  /**
   * Creates a new user account
   * @param createUserDto - User creation data
   * @returns Created user object
   * @throws BadRequestException if email already exists
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Implementation
  }
}
```

### Frontend Standards

```typescript
// Use TypeScript with React
interface UserCardProps {
  user: User;
  onEdit: (userId: string) => void;
}

export function UserCard({ user, onEdit }: UserCardProps) {
  return (
    <div>
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user.id)}>Edit</button>
    </div>
  );
}

// Use React Query for data fetching
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.getAll(),
  });
}

// Implement proper error boundaries
export class ErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    // Log error
  }

  render() {
    // Render fallback UI
  }
}
```

---

## Environment Setup

### Required Environment Variables

Create `.env` files in each package:

**packages/backend/.env**:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/compliant_dev

# JWT
JWT_SECRET=your-jwt-secret-minimum-32-characters
JWT_REFRESH_SECRET=your-refresh-secret-minimum-32-characters
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
REDIS_URL=redis://localhost:6379

# Email
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@compliant.com

# File Storage
STORAGE_PROVIDER=s3
AWS_S3_BUCKET=compliant-files
AWS_S3_REGION=us-east-1
AWS_S3_ACCESS_KEY=your-access-key
AWS_S3_SECRET_KEY=your-secret-key

# External APIs
ADOBE_CLIENT_ID=your-adobe-client-id
ADOBE_CLIENT_SECRET=your-adobe-client-secret
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_PLACES_API_KEY=your-google-api-key
NYC_DOB_API_KEY=your-dob-api-key

# Twilio
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890

# Application
NODE_ENV=development
PORT=3001
API_VERSION=v1
CORS_ORIGIN=http://localhost:3000
```

**packages/frontend/.env.local**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_ENV=development
```

---

## Deployment Checklist

Before deploying each PR to production:

### Code Quality
- [ ] All tests passing
- [ ] Code coverage meets requirements (80%+)
- [ ] No linting errors
- [ ] TypeScript strict mode enabled
- [ ] No console.log statements in production code

### Security
- [ ] Security audit passed
- [ ] No hardcoded secrets
- [ ] Environment variables documented
- [ ] HTTPS enabled
- [ ] Rate limiting implemented
- [ ] Input validation implemented

### Documentation
- [ ] API documentation updated
- [ ] README updated
- [ ] Environment variables documented
- [ ] Migration guide provided (if needed)

### Database
- [ ] Migrations created and tested
- [ ] Database backup taken
- [ ] Rollback plan documented
- [ ] Indexes added for performance

### Monitoring
- [ ] Health check endpoint working
- [ ] Logging configured
- [ ] Error tracking enabled (Sentry)
- [ ] Performance monitoring enabled

### Performance
- [ ] Load testing completed
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Caching implemented where needed

---

## Rollback Procedures

If issues are discovered after deployment:

1. **Immediate Actions**:
   - Notify team via communication channel
   - Assess severity and impact
   - Decide: fix forward or rollback

2. **Rollback Steps**:
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   
   # Rollback database migrations
   npx prisma migrate resolve --rolled-back <migration-name>
   
   # Redeploy
   npm run deploy
   ```

3. **Post-Rollback**:
   - Verify system functionality
   - Notify stakeholders
   - Document incident
   - Plan fix and re-deployment

---

## Support and Resources

### Documentation
- NestJS: https://docs.nestjs.com
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- Zod: https://zod.dev

### Team Communication
- Daily standups for progress updates
- PR reviews within 24 hours
- Weekly sprint planning
- Retrospectives after each PR merge

### Getting Help
- Create GitHub issues for bugs
- Use Discussions for questions
- Tag relevant team members in PRs
- Escalate blockers immediately

---

## Conclusion

This implementation guide provides a structured approach to building the Compliant Insurance Platform. Each PR builds upon the previous, creating a solid foundation for an enterprise-grade application.

**Key Principles**:
- 🎯 Focus on quality over speed
- 🔒 Security is not optional
- 📝 Documentation is code
- 🧪 Test everything
- 🤝 Collaborate and communicate

Follow these guidelines to ensure consistent, maintainable, and secure code across all implementations.
