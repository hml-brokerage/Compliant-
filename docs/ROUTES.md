# Route Documentation

This document provides a comprehensive list of all routes in the Compliant Platform application.

## Frontend Routes

### Public Routes
- `/` - Landing/home page (redirects to dashboard if authenticated)
- `/login` - Authentication page

### Common Routes (All Roles)
- `/dashboard` - Role-based dashboard hub
- `/settings` - User settings and preferences

### Admin Routes
- `/admin/dashboard` - Admin-specific dashboard
- `/admin/general-contractors` - List of general contractors
- `/admin/general-contractors/[id]` - Contractor details page
- `/admin/general-contractors/[id]/projects/new` - Create project for specific contractor
- `/admin/contractors` - Contractors management (redirects to general-contractors)
- `/admin/contractors/new` - Create new contractor form
- `/admin/projects` - All projects management
- `/admin/projects/new` - Create new project form
- `/admin/programs` - Program management
- `/admin/coi-reviews` - COI document reviews
- `/admin/coi` - COI management
- `/admin/reports` - Administrative reports
- `/admin/users` - User management
- `/admin/settings` - Admin settings

### General Contractor (GC) Routes
- `/gc/dashboard` - GC-specific dashboard
- `/gc/projects` - List/browse GC projects
- `/gc/projects/[id]/subcontractors` - Subcontractors for specific project
- `/gc/subcontractors` - List all subcontractors
- `/gc/compliance` - Compliance tracking/reporting
- `/gc/reports` - GC reports dashboard

### Broker Routes
- `/broker/dashboard` - Broker-specific dashboard
- `/broker/upload` - Document upload entry
- `/broker/upload/[subId]` - Upload documents for specific subcontractor
- `/broker/sign/[id]` - Sign documents by ID
- `/broker/documents` - Browse documents
- `/broker/projects` - Projects overview
- `/broker/compliance` - Compliance view

### Subcontractor Routes
- `/subcontractor/dashboard` - Subcontractor-specific dashboard
- `/subcontractor/projects` - List assigned projects
- `/subcontractor/broker` - Broker information/documents
- `/subcontractor/compliance` - Compliance status
- `/subcontractor/documents` - Document repository

### Legacy/Generic Routes (May redirect to role-specific routes)
- `/contractors` - Contractors page (redirects based on role)
- `/projects` - Projects page
- `/documents` - Documents page
- `/coi` - Certificate of Insurance page
- `/compliance` - Compliance page
- `/programs` - Programs page
- `/users` - Users page

### Contractor Routes (Legacy - being replaced with subcontractor routes)
- `/contractor/dashboard` - Contractor dashboard
- `/contractor/projects` - Contractor projects
- `/contractor/documents` - Contractor documents
- `/contractor/compliance` - Contractor compliance

### Error Pages
- `/not-found` or `404` - Custom 404 page (auto-shown for invalid routes)
- `/error` - Global error boundary (auto-shown for runtime errors)

## Backend API Routes

All backend routes are prefixed with `/api` automatically by the API client.

### Authentication (`/auth`)
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get current user profile

### Users (`/users`)
- `GET /users` - List all users (with pagination and filters)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Contractors (`/contractors`)
- `GET /contractors` - List all contractors (with search and filters)
- `GET /contractors/:id` - Get contractor by ID
- `POST /contractors` - Create new contractor
- `PATCH /contractors/:id` - Update contractor
- `DELETE /contractors/:id` - Delete contractor

### Projects (`/projects`)
- `GET /projects` - List all projects (with pagination)
- `GET /projects/:id` - Get project by ID
- `GET /projects/contractor/:contractorId` - Get projects for specific contractor
- `POST /projects` - Create new project
- `PATCH /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project

### Programs (`/programs`)
- `GET /programs` - List all programs
- `GET /programs/:id` - Get program by ID
- `GET /programs/project/:projectId` - Get programs for specific project
- `POST /programs` - Create new program
- `PATCH /programs/:id` - Update program
- `DELETE /programs/:id` - Delete program

### Generated COI (`/generated-coi`)
- `GET /generated-coi` - List all generated COIs
- `GET /generated-coi/:id` - Get COI by ID
- `POST /generated-coi` - Create/generate new COI
- `PATCH /generated-coi/:id` - Update COI
- `PATCH /generated-coi/:id/approve` - Approve COI
- `PATCH /generated-coi/:id/reject` - Reject COI

### Hold Harmless (`/hold-harmless`)
- `GET /hold-harmless` - List all hold harmless agreements
- `GET /hold-harmless/:id` - Get agreement by ID
- `GET /hold-harmless/coi/:coiId` - Get agreement for specific COI
- `POST /hold-harmless` - Create new agreement
- `PATCH /hold-harmless/:id/sign` - Sign agreement

### Trades (`/trades`)
- `GET /trades` - List all trades
- `GET /trades/:id` - Get trade by ID
- `POST /trades` - Create new trade
- `PATCH /trades/:id` - Update trade
- `DELETE /trades/:id` - Delete trade

### Health Check (`/health`)
- `GET /health` - Application health check
- `GET /health/db` - Database health check

### Audit (`/audit`)
- `GET /audit` - List audit logs (with filters)
- `GET /audit/:id` - Get specific audit log

### Reminders (`/reminders`)
- `GET /reminders` - List reminders
- `POST /reminders/send` - Send reminder manually

## API Configuration

### Base URL
- Development: `http://localhost:3001/api`
- Production: Set via `NEXT_PUBLIC_API_URL` environment variable

### Headers
- `Content-Type: application/json`
- `X-API-Version: 1` (default version)
- `Authorization: Bearer <token>` (for authenticated requests)

### Authentication
- JWT-based authentication
- Access token stored in HTTP-only cookie
- Refresh token rotation on 401 errors
- Auto-redirect to `/login` on authentication failure

## Error Handling

### Frontend Error Pages
- **404 Not Found**: Custom page with navigation options
  - Go Back button
  - Go to Dashboard link
  - Go to Login link

- **Runtime Errors**: Error boundary with recovery options
  - Try Again button
  - Go Back button
  - Go to Dashboard link
  - Error code display (in development)

### API Error Responses
All API errors follow this format:
```json
{
  "statusCode": 404,
  "timestamp": "2024-01-15T12:00:00.000Z",
  "path": "/api/contractors/123",
  "message": "Contractor not found"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Route Guards

### Authentication Required
Most routes require authentication. Public routes:
- `/login`
- `/` (landing page)

### Role-Based Access
- Admin routes (`/admin/*`) - Requires ADMIN or SUPER_ADMIN role
- GC routes (`/gc/*`) - Requires GENERAL_CONTRACTOR role
- Broker routes (`/broker/*`) - Requires BROKER role
- Subcontractor routes (`/subcontractor/*`) - Requires SUBCONTRACTOR role

## Notes

- Routes are case-sensitive
- Dynamic route parameters are indicated with `[param]` syntax
- Query parameters can be appended to any route (e.g., `?filter=issues`)
- All backend routes automatically get `/api` prefix from the API client
- Frontend routes without trailing slashes (Next.js convention)
