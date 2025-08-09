# RBAC Implementation for Routes Management Page

## Overview
This document outlines the Role-Based Access Control (RBAC) implementation for the routes management page (`RoutesManagement.tsx`) to ensure that managers and staff can only view routes that belong to their company.

## Changes Made

### 1. RoutesManagement.tsx
- **Added company service import**: Imported `companyService` to fetch company data for filtering
- **Implemented route filtering logic**: Filter routes based on user's company name
- **Added company name lookup**: Find user's company by ID, then filter routes by company name
- **Enhanced fallback mechanism**: Added partial name matching for route filtering
- **Updated UI labels**: Dynamic header and description text based on user role
- **Conditional table columns**: Hide company column for company-restricted users
- **Added RoleAccessNotice component**: Provides consistent RBAC feedback

### 2. RouteFormModal.tsx
- **Enhanced company filtering**: Filter companies to only show user's company for restricted users
- **Auto-set company ID**: Automatically set companyId for company-restricted users
- **Conditional company selection**: Show dropdown for admin, read-only info for restricted users
- **Maintained existing RBAC features**: Company selection, conditional UI rendering

## Key Features

### Role-Based Data Filtering
```typescript
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  
  if (userCompanyId) {
    // Get user's company name for route filtering
    const companiesResponse = await companyService.getAllCompanies(1, 100);
    const userCompany = companiesResponse.data.find(
      company => company.id === userCompanyId
    );
    
    if (userCompany) {
      // Filter routes to only show routes from user's company
      filteredRoutes = response.data.filter(
        route => route.companyName === userCompany.name
      );
      
      // Fallback: partial name matching if exact match fails
      if (filteredRoutes.length === 0) {
        const companyRoutes = response.data.filter(route => 
          route.companyName.toLowerCase().includes(userCompany.name.toLowerCase()) ||
          userCompany.name.toLowerCase().includes(route.companyName.toLowerCase())
        );
        
        if (companyRoutes.length > 0) {
          filteredRoutes = companyRoutes;
        }
      }
    }
  }
}
```

### Dynamic UI Labels
- **Admin users**: See "Quản lý tuyến đường", "Danh sách và quản lý các tuyến đường xe khách"
- **Manager/Staff users**: See "Tuyến đường của công ty", "Danh sách và quản lý các tuyến đường của công ty bạn"

### Conditional Functionality
- **Company column**: Only shows for admin users
- **Search functionality**: Available for all users
- **Route management**: All users can create/edit/delete routes (with company restrictions)

## User Experience

### For Admin Users
- Can view all routes from all companies
- Can see company column in the table
- Can search and filter routes
- Full access to all route management features
- See comprehensive route information

### For Manager/Staff Users
- Can only view routes from their own company
- Cannot see company column (since all routes are from their company)
- Can search and filter routes within their company
- Can create, edit, and delete routes for their company
- See company-specific route information

## Technical Implementation

### Data Structure Understanding
**Route Interface**:
```typescript
interface Route {
  id: number;
  routeId: string;
  duration: number;
  fromLocation: string;
  toLocation: string;
  distance: number;
  description: string;
  createAt: string;
  isCreate: boolean;
  isDelete: boolean;
  routeLicense: string;
  companyName: string;  // ← This is the key field for filtering
}
```

**Company Interface**:
```typescript
interface Company {
  id: number;           // ← This matches user's companyId
  companyId: string;    // ← This is the company's internal ID
  name: string;         // ← This matches route.companyName
  // ... other fields
}
```

### Filtering Logic
1. **User's companyId** (e.g., 4) matches **Company.id** (4)
2. **Company.name** (e.g., "Phương Trang") matches **Route.companyName** ("Phương Trang")
3. Filter routes where `route.companyName === userCompany.name`

### Fallback Mechanism
If exact company name matching fails:
1. Try partial name matching (case-insensitive)
2. Check if company name contains route company name or vice versa
3. Log detailed information for debugging

## Bug Fixes

### Issue: Manager/Staff Not Seeing Their Company's Routes
**Problem**: Manager with `companyId: 4` was not seeing routes from "Phương Trang" company.

**Root Cause**: 
- The filtering was comparing `route.companyId` with user's `companyId`
- But `Route` interface has `companyName` field, not `companyId`
- Need to match `route.companyName` with `company.name`

**Solution**:
1. Changed filtering from `route.companyId === userCompanyId` to `route.companyName === userCompany.name`
2. Added company lookup to get company name from user's companyId
3. Added fallback mechanism for partial name matching
4. Enhanced logging for better debugging

**Data Flow**:
```
User companyId: 4
↓
Find Company where company.id === 4
↓
Get company.name: "Phương Trang"
↓
Filter routes where route.companyName === "Phương Trang"
```

## Testing Scenarios

### Admin User
- [ ] Can view all routes from all companies
- [ ] Can see company column in the table
- [ ] Can search and filter routes
- [ ] Can create, edit, and delete routes
- [ ] Header shows "Quản lý tuyến đường"

### Manager User
- [ ] Can only view routes from their own company
- [ ] Cannot see company column (all routes are from their company)
- [ ] Can search and filter routes within their company
- [ ] Can create, edit, and delete routes for their company
- [ ] Header shows "Tuyến đường của công ty"
- [ ] RoleAccessNotice displays appropriate message
- [ ] Can see routes with exact company name match
- [ ] Can see routes with partial company name match (fallback)

### Staff User
- [ ] Can only view routes from their own company
- [ ] Cannot see company column (all routes are from their company)
- [ ] Can search and filter routes within their company
- [ ] Can create, edit, and delete routes for their company
- [ ] Header shows "Tuyến đường của công ty"
- [ ] RoleAccessNotice displays appropriate message
- [ ] Can see routes with exact company name match
- [ ] Can see routes with partial company name match (fallback)

## API Integration

### Current Endpoints Used
- `GET /api/Route` - Fetch all routes
- `GET /api/Company/GetAllCompany` - Fetch companies for filtering
- `POST /api/Route` - Create new route
- `PUT /api/Route/{id}` - Update route
- `DELETE /api/Route/{id}` - Delete route

### Recommended Backend Enhancements
1. **Add company-specific route endpoint**: `GET /api/Route/company/{companyId}`
2. **Add route filtering by company**: `GET /api/Route?companyId={companyId}`
3. **Implement server-side RBAC**: Validate user permissions on backend

## Security Considerations

### Frontend Filtering
- **Current implementation**: Client-side filtering for immediate user experience
- **Backend requirement**: Server-side filtering should be implemented for complete security
- **Recommendation**: API endpoints should accept `companyId` parameter and filter data server-side

### Data Exposure
- **Risk**: API responses contain all routes before filtering
- **Mitigation**: Implement backend filtering to prevent data leakage
- **Monitoring**: Log API calls to detect potential security issues

## Future Improvements

1. **Backend API Enhancement**
   - Add `getRoutesByCompany` endpoint to route service
   - Implement server-side filtering for complete security
   - Add role-based access validation on server

2. **Enhanced Error Handling**
   - Handle cases where user has no `companyId`
   - Provide clear error messages for access denied scenarios
   - Implement fallback UI for edge cases

3. **Performance Optimization**
   - Implement pagination for large route lists
   - Add caching for frequently accessed route data
   - Optimize API calls based on user role

4. **Audit Logging**
   - Log route access attempts
   - Track role-based data filtering
   - Monitor for potential security violations

## Files Modified

1. `src/pages/Routes/RoutesManagement.tsx`
   - Added company service import
   - Implemented route filtering logic based on company name
   - Added company name lookup for proper route filtering
   - Enhanced fallback mechanism for partial name matching
   - Updated UI labels and conditional rendering
   - Added RoleAccessNotice component
   - Conditional table columns based on user role

2. `src/components/Routes/RouteFormModal.tsx`
   - Enhanced company filtering for restricted users
   - Auto-set company ID for company-restricted users
   - Conditional company selection UI
   - Maintained existing RBAC features

## Dependencies

- `src/context/AuthContext.tsx` - Provides RBAC helper functions
- `src/components/common/RoleAccessNotice.tsx` - Provides consistent role messaging
- `src/services/api.ts` - Provides route and company service API calls
- `src/types/company.ts` - Provides Route and Company interface definitions

## Usage Example

```typescript
// In RoutesManagement component
const { user, isAdmin, isCompanyRestricted, getUserCompanyId } = useAuth();

// Filter routes based on user's company
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  if (userCompanyId) {
    // Get user's company and filter routes
    const userCompany = companies.find(company => company.id === userCompanyId);
    if (userCompany) {
      filteredRoutes = routes.filter(route => route.companyName === userCompany.name);
    }
  }
}

// Show appropriate UI based on role
{!isCompanyRestricted() && (
  <th>Công ty</th>
)}
```
