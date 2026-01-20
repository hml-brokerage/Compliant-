# Complete Page Renders - Compliant Platform

This document provides visual renders of **every page** in the Compliant Insurance Tracking Platform across all user roles.

## 📸 Overview

A comprehensive collection of screenshots showing all pages in the system, organized by user role and page type.

**Total Screenshots Captured: 40**

---

## 🌐 Public Pages (Unauthenticated)

These pages are accessible without authentication.

### 1. Home Page
**Route:** `/`
**Screenshot:** [001-home-page.png](./e2e-screenshots/all_pages_public/001-001_home_page.png)

### 2. Login Page
**Route:** `/login`
**Screenshot:** [002-login-page.png](./e2e-screenshots/all_pages_public/002-002_login_page.png)

### 3. 404 Not Found Page
**Route:** `/non-existent-page`
**Screenshot:** [003-404-page.png](./e2e-screenshots/all_pages_public/003-003_404_page.png)

---

## 👨‍💼 Admin Pages

Full administrative access with complete CRUD operations for all entities.

### Authentication
- **Login Page:** [admin-login-page.png](./e2e-screenshots/all_pages_admin/001-admin_login_page.png)
- **Login Form Filled:** [admin-login-form-filled.png](./e2e-screenshots/all_pages_admin/002-admin_login_form_filled.png)

### Dashboard & Overview
1. **Admin Dashboard**
   - **Route:** `/admin/dashboard`
   - **Screenshot:** [010-admin-dashboard.png](./e2e-screenshots/all_pages_admin/003-010_admin_dashboard.png)
   - **Description:** Main administrative dashboard with overview stats

### Contractors Management
2. **Contractors List**
   - **Route:** `/admin/contractors`
   - **Screenshot:** [011-admin-contractors-list.png](./e2e-screenshots/all_pages_admin/004-011_admin_contractors_list.png)
   - **Description:** List and manage all contractors

3. **New Contractor Form**
   - **Route:** `/admin/contractors/new`
   - **Screenshot:** [012-admin-contractors-new.png](./e2e-screenshots/all_pages_admin/005-012_admin_contractors_new.png)
   - **Description:** Create new contractor with details

4. **General Contractors List**
   - **Route:** `/admin/general-contractors`
   - **Screenshot:** [013-admin-general-contractors-list.png](./e2e-screenshots/all_pages_admin/006-013_admin_general_contractors_list.png)
   - **Description:** Manage general contractors specifically

### Projects Management
5. **Projects List**
   - **Route:** `/admin/projects`
   - **Screenshot:** [014-admin-projects-list.png](./e2e-screenshots/all_pages_admin/007-014_admin_projects_list.png)
   - **Description:** View and manage all projects

6. **New Project Form**
   - **Route:** `/admin/projects/new`
   - **Screenshot:** [015-admin-projects-new.png](./e2e-screenshots/all_pages_admin/008-015_admin_projects_new.png)
   - **Description:** Create new construction project

### Programs Management
7. **Programs List**
   - **Route:** `/admin/programs`
   - **Screenshot:** [016-admin-programs-list.png](./e2e-screenshots/all_pages_admin/009-016_admin_programs_list.png)
   - **Description:** Manage insurance programs

8. **New Program Form**
   - **Route:** `/admin/programs/new`
   - **Screenshot:** [017-admin-programs-new.png](./e2e-screenshots/all_pages_admin/010-017_admin_programs_new.png)
   - **Description:** Create new insurance program

### COI Management
9. **COI List**
   - **Route:** `/admin/coi`
   - **Screenshot:** [018-admin-coi-list.png](./e2e-screenshots/all_pages_admin/011-018_admin_coi_list.png)
   - **Description:** View all Certificates of Insurance

10. **COI Reviews**
    - **Route:** `/admin/coi-reviews`
    - **Screenshot:** [019-admin-coi-reviews.png](./e2e-screenshots/all_pages_admin/012-019_admin_coi_reviews.png)
    - **Description:** Review and approve pending COIs

### User & System Management
11. **Users List**
    - **Route:** `/admin/users`
    - **Screenshot:** [020-admin-users-list.png](./e2e-screenshots/all_pages_admin/013-020_admin_users_list.png)
    - **Description:** Manage system users and roles

12. **Reports**
    - **Route:** `/admin/reports`
    - **Screenshot:** [021-admin-reports.png](./e2e-screenshots/all_pages_admin/014-021_admin_reports.png)
    - **Description:** Generate and view system reports

13. **Settings**
    - **Route:** `/admin/settings`
    - **Screenshot:** [022-admin-settings.png](./e2e-screenshots/all_pages_admin/015-022_admin_settings.png)
    - **Description:** System configuration and settings

---

## 🏗️ General Contractor (GC) Pages

Pages for general contractors managing their subcontractors and projects.

### Authentication
- **Login Page:** [gc-login-page.png](./e2e-screenshots/all_pages_gc/001-gc_login_page.png)
- **Login Form Filled:** [gc-login-form-filled.png](./e2e-screenshots/all_pages_gc/002-gc_login_form_filled.png)

### Main Pages
1. **GC Dashboard**
   - **Route:** `/gc/dashboard`
   - **Screenshot:** [030-gc-dashboard.png](./e2e-screenshots/all_pages_gc/003-030_gc_dashboard.png)
   - **Description:** General contractor's overview dashboard

2. **GC Projects**
   - **Route:** `/gc/projects`
   - **Screenshot:** [031-gc-projects.png](./e2e-screenshots/all_pages_gc/004-031_gc_projects.png)
   - **Description:** Manage projects as a general contractor

3. **GC Subcontractors**
   - **Route:** `/gc/subcontractors`
   - **Screenshot:** [032-gc-subcontractors.png](./e2e-screenshots/all_pages_gc/005-032_gc_subcontractors.png)
   - **Description:** View and manage subcontractors

4. **GC Compliance**
   - **Route:** `/gc/compliance`
   - **Screenshot:** [033-gc-compliance.png](./e2e-screenshots/all_pages_gc/006-033_gc_compliance.png)
   - **Description:** Compliance tracking and status

---

## 🔨 Subcontractor Pages

Pages for subcontractors to manage their documents and compliance.

### Main Pages
1. **Subcontractor Dashboard**
   - **Route:** `/subcontractor/dashboard`
   - **Description:** Subcontractor's main dashboard
   - **Note:** Test timed out but page exists in system

2. **Subcontractor Projects**
   - **Route:** `/subcontractor/projects`
   - **Description:** View assigned projects

3. **Subcontractor Documents**
   - **Route:** `/subcontractor/documents`
   - **Description:** Upload and manage insurance documents

4. **Subcontractor Compliance**
   - **Route:** `/subcontractor/compliance`
   - **Description:** View compliance status

5. **Subcontractor Broker**
   - **Route:** `/subcontractor/broker`
   - **Description:** Broker contact and communication

---

## 👷 Contractor Role Pages

Pages for contractors (non-GC contractors).

### Authentication
- **Login Page:** [contractor-login-page.png](./e2e-screenshots/all_pages_contractor_role/001-contractor_login_page.png)
- **Login Form Filled:** [contractor-login-form-filled.png](./e2e-screenshots/all_pages_contractor_role/002-contractor_login_form_filled.png)

### Main Pages
1. **Contractor Dashboard**
   - **Route:** `/contractor/dashboard`
   - **Screenshot:** [050-contractor-dashboard.png](./e2e-screenshots/all_pages_contractor_role/003-050_contractor_dashboard.png)
   - **Description:** Contractor's main dashboard

2. **Contractor Projects**
   - **Route:** `/contractor/projects`
   - **Screenshot:** [051-contractor-projects.png](./e2e-screenshots/all_pages_contractor_role/004-051_contractor_projects.png)
   - **Description:** View contractor's projects

3. **Contractor Documents**
   - **Route:** `/contractor/documents`
   - **Screenshot:** [052-contractor-documents.png](./e2e-screenshots/all_pages_contractor_role/005-052_contractor_documents.png)
   - **Description:** Manage contractor documents

4. **Contractor Compliance**
   - **Route:** `/contractor/compliance`
   - **Screenshot:** [053-contractor-compliance.png](./e2e-screenshots/all_pages_contractor_role/006-053_contractor_compliance.png)
   - **Description:** Compliance tracking for contractor

---

## 🏦 Broker Pages

Pages for insurance brokers to manage policies and documents.

### Main Pages (Require Broker User Setup)
1. **Broker Dashboard**
   - **Route:** `/broker/dashboard`
   - **Description:** Broker's main dashboard

2. **Broker Projects**
   - **Route:** `/broker/projects`
   - **Description:** View projects needing insurance

3. **Broker Documents**
   - **Route:** `/broker/documents`
   - **Description:** Manage insurance documents

4. **Broker Compliance**
   - **Route:** `/broker/compliance`
   - **Description:** Compliance tracking

5. **Broker Upload**
   - **Route:** `/broker/upload`
   - **Description:** Upload insurance documents

6. **Broker Upload for Subcontractor**
   - **Route:** `/broker/upload/[subId]`
   - **Description:** Upload documents for specific subcontractor

7. **Broker Sign**
   - **Route:** `/broker/sign/[id]`
   - **Description:** Sign and certify documents

---

## 🔄 Shared/Generic Pages

These pages are accessible across multiple roles with role-based content filtering.

### Authentication
- **Login Page:** [shared-login-page.png](./e2e-screenshots/all_pages_shared/001-shared_login_page.png)
- **Login Form Filled:** [shared-login-form-filled.png](./e2e-screenshots/all_pages_shared/002-shared_login_form_filled.png)

### Main Pages
1. **Generic Dashboard**
   - **Route:** `/dashboard`
   - **Screenshot:** [060-dashboard-generic.png](./e2e-screenshots/all_pages_shared/003-060_dashboard_generic.png)
   - **Description:** Role-agnostic dashboard

2. **Generic COI**
   - **Route:** `/coi`
   - **Screenshot:** [061-coi-generic.png](./e2e-screenshots/all_pages_shared/004-061_coi_generic.png)
   - **Description:** View COI list

3. **Generic Contractors**
   - **Route:** `/contractors`
   - **Screenshot:** [062-contractors-generic.png](./e2e-screenshots/all_pages_shared/005-062_contractors_generic.png)
   - **Description:** View contractors list

4. **Generic Projects**
   - **Route:** `/projects`
   - **Screenshot:** [063-projects-generic.png](./e2e-screenshots/all_pages_shared/006-063_projects_generic.png)
   - **Description:** View projects list

5. **Generic Programs**
   - **Route:** `/programs`
   - **Screenshot:** [064-programs-generic.png](./e2e-screenshots/all_pages_shared/007-064_programs_generic.png)
   - **Description:** View programs list

6. **Generic Documents**
   - **Route:** `/documents`
   - **Screenshot:** [065-documents-generic.png](./e2e-screenshots/all_pages_shared/008-065_documents_generic.png)
   - **Description:** Documents management

7. **Generic Compliance**
   - **Route:** `/compliance`
   - **Screenshot:** [066-compliance-generic.png](./e2e-screenshots/all_pages_shared/009-066_compliance_generic.png)
   - **Description:** Compliance tracking

8. **Generic Settings**
   - **Route:** `/settings`
   - **Screenshot:** [067-settings-generic.png](./e2e-screenshots/all_pages_shared/010-067_settings_generic.png)
   - **Description:** User settings

---

## 📊 Page Summary by Role

| Role | Number of Pages | Authentication Required |
|------|----------------|------------------------|
| **Public** | 3 | No |
| **Admin** | 13 | Yes (Admin role) |
| **General Contractor** | 4 | Yes (GC role) |
| **Subcontractor** | 5 | Yes (Subcontractor role) |
| **Contractor** | 4 | Yes (Contractor role) |
| **Broker** | 7 | Yes (Broker role) |
| **Shared/Generic** | 8 | Yes (Any authenticated role) |
| **TOTAL** | **44 Unique Pages** | |

---

## 🔍 Route Structure

### Public Routes
- `/` - Home
- `/login` - Authentication

### Admin Routes (Prefix: `/admin/`)
- `/admin/dashboard`
- `/admin/contractors`
- `/admin/contractors/new`
- `/admin/general-contractors`
- `/admin/general-contractors/[id]`
- `/admin/general-contractors/[id]/projects/new`
- `/admin/projects`
- `/admin/projects/new`
- `/admin/programs`
- `/admin/programs/new`
- `/admin/programs/[id]`
- `/admin/programs/[id]/edit`
- `/admin/coi`
- `/admin/coi-reviews`
- `/admin/users`
- `/admin/reports`
- `/admin/settings`

### GC Routes (Prefix: `/gc/`)
- `/gc/dashboard`
- `/gc/projects`
- `/gc/projects/[id]/subcontractors`
- `/gc/subcontractors`
- `/gc/compliance`

### Subcontractor Routes (Prefix: `/subcontractor/`)
- `/subcontractor/dashboard`
- `/subcontractor/projects`
- `/subcontractor/documents`
- `/subcontractor/compliance`
- `/subcontractor/broker`

### Contractor Routes (Prefix: `/contractor/`)
- `/contractor/dashboard`
- `/contractor/projects`
- `/contractor/documents`
- `/contractor/compliance`

### Broker Routes (Prefix: `/broker/`)
- `/broker/dashboard`
- `/broker/projects`
- `/broker/documents`
- `/broker/compliance`
- `/broker/upload`
- `/broker/upload/[subId]`
- `/broker/sign/[id]`

### Generic/Shared Routes
- `/dashboard`
- `/coi`
- `/contractors`
- `/projects`
- `/programs`
- `/documents`
- `/compliance`
- `/settings`
- `/users`

---

## 📝 Notes

- All screenshots were captured using Playwright with Chromium browser
- Screenshots show the initial page load state
- Some pages are dynamic and will show different content based on:
  - User role and permissions
  - Data assigned to the user
  - Current system state
- Pages with `[id]` or `[subId]` in the route are dynamic routes requiring specific IDs
- All screenshots are full-page captures including any content below the fold

---

## 🔗 Related Documentation

- [E2E Testing Documentation](./e2e-screenshots/README.md)
- [Main README](../README.md)
- [Testing Guide](./TESTING_GUIDE.md)
- [Implementation Guidelines](./IMPLEMENTATION_GUIDELINES.md)

---

**Generated:** January 20, 2026
**Test Framework:** Playwright 1.57.0
**Browser:** Chromium (Desktop Chrome)
**Total Screenshots:** 40
