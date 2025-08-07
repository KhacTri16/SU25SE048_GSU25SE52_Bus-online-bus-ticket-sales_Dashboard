# RBAC Implementation for Bus Management Page

## Overview
This document outlines the Role-Based Access Control (RBAC) implementation for the bus management page (`CompanyBusManagement.tsx`) to ensure that managers and staff can only view buses that belong to their company.

## Changes Made

### 1. CompanyBusManagement.tsx
- **Fixed bus filtering logic**: Changed from `bus.companyId` to `bus.companyName` for proper matching
- **Added company name lookup**: Find user's company by ID, then filter buses by company name
- **Enhanced fallback mechanism**: Added partial name matching for bus filtering
- **Maintained existing RBAC features**: Statistics labels, conditional UI rendering

## Key Features

### Role-Based Data Filtering
```typescript
// If user is company-restricted, filter data by their company
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  
  if (userCompanyId) {
    // Filter companies to only show user's company
    filteredCompanies = companiesResponse.data.filter(
      company => company.id === userCompanyId
    );
    
    // Get the user's company name for bus filtering
    const userCompany = companiesResponse.data.find(
      company => company.id === userCompanyId
    );
    
    if (userCompany) {
      // Filter buses to only show buses from user's company
      filteredBuses = busesResponse.data.filter(
        bus => bus.companyName === userCompany.name
      );
      
      // Fallback: partial name matching if exact match fails
      if (filteredBuses.length === 0) {
        const companyBuses = allBuses.filter(bus => 
          bus.companyName.toLowerCase().includes(userCompany.name.toLowerCase()) ||
          userCompany.name.toLowerCase().includes(bus.companyName.toLowerCase())
        );
        
        if (companyBuses.length > 0) {
          filteredBuses = companyBuses;
        }
      }
    }
  }
}
```

### Dynamic UI Labels
- **Admin users**: See "Tổng công ty", "Tổng xe", "Công ty hoạt động"
- **Manager/Staff users**: See "Công ty của bạn", "Xe của công ty", "Trạng thái công ty"

### Conditional Functionality
- **Company selection section**: Only shows for admin users or if user has multiple companies
- **Search functionality**: Only available for admin users
- **Company grid**: Shows filtered companies based on user role

## User Experience

### For Admin Users
- Can view all companies and their buses
- Can search and filter companies
- See comprehensive statistics across all companies and buses
- Full access to all bus management features

### For Manager/Staff Users
- Can only view their own company and its buses
- Cannot search or filter companies (limited to their company)
- See statistics specific to their company and buses
- Limited access with clear role-based messaging

## Technical Implementation

### Data Structure Understanding
**Bus Interface**:
```typescript
interface Bus {
  id: number;
  busId: string;
  name: string;
  numberPlate: string;
  typeBusId: number;
  companyName: string;  // ← This is the key field for filtering
  isDeleted: boolean;
}
```

**Company Interface**:
```typescript
interface Company {
  id: number;           // ← This matches user's companyId
  companyId: string;    // ← This is the company's internal ID
  name: string;         // ← This matches bus.companyName
  // ... other fields
}
```

### Filtering Logic
1. **User's companyId** (e.g., 4) matches **Company.id** (4)
2. **Company.name** (e.g., "Phương Trang") matches **Bus.companyName** ("Phương Trang")
3. Filter buses where `bus.companyName === userCompany.name`

### Fallback Mechanism
If exact company name matching fails:
1. Try partial name matching (case-insensitive)
2. Check if company name contains bus company name or vice versa
3. Log detailed information for debugging

## Bug Fixes

### Issue: Manager/Staff Not Seeing Their Company's Buses
**Problem**: Manager with `companyId: 4` was not seeing buses from "Phương Trang" company.

**Root Cause**: 
- The filtering was comparing `bus.companyId` with user's `companyId`
- But `Bus` interface has `companyName` field, not `companyId`
- Need to match `bus.companyName` with `company.name`

**Solution**:
1. Changed filtering from `bus.companyId === userCompanyId` to `bus.companyName === userCompany.name`
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
Filter buses where bus.companyName === "Phương Trang"
```

## Testing Scenarios

### Admin User
- [ ] Can view all companies and their buses
- [ ] Can search and filter companies
- [ ] Statistics show total counts across all companies and buses
- [ ] Company selection section is visible

### Manager User
- [ ] Can only view their own company and its buses
- [ ] Cannot search or filter companies
- [ ] Statistics show company-specific information
- [ ] Only sees their company in the company grid
- [ ] Can see buses with exact company name match
- [ ] Can see buses with partial company name match (fallback)

### Staff User
- [ ] Can only view their own company and its buses
- [ ] Cannot search or filter companies
- [ ] Statistics show company-specific information
- [ ] Only sees their company in the company grid
- [ ] Can see buses with exact company name match
- [ ] Can see buses with partial company name match (fallback)

## API Integration

### Current Endpoints Used
- `GET /api/Company/GetAllCompany` - Fetch all companies
- `GET /api/Bus` - Fetch all buses

### Recommended Backend Enhancements
1. **Add company-specific bus endpoint**: `GET /api/Bus/company/{companyId}`
2. **Add bus filtering by company**: `GET /api/Bus?companyId={companyId}`
3. **Implement server-side RBAC**: Validate user permissions on backend

## Security Considerations

### Frontend Filtering
- **Current implementation**: Client-side filtering for immediate user experience
- **Backend requirement**: Server-side filtering should be implemented for complete security
- **Recommendation**: API endpoints should accept `companyId` parameter and filter data server-side

### Data Exposure
- **Risk**: API responses contain all buses before filtering
- **Mitigation**: Implement backend filtering to prevent data leakage
- **Monitoring**: Log API calls to detect potential security issues

## Future Improvements

1. **Backend API Enhancement**
   - Add `getBusesByCompany` endpoint to bus service
   - Implement server-side filtering for complete security
   - Add role-based access validation on server

2. **Enhanced Error Handling**
   - Handle cases where user has no `companyId`
   - Provide clear error messages for access denied scenarios
   - Implement fallback UI for edge cases

3. **Performance Optimization**
   - Implement pagination for large bus lists
   - Add caching for frequently accessed bus data
   - Optimize API calls based on user role

4. **Audit Logging**
   - Log bus access attempts
   - Track role-based data filtering
   - Monitor for potential security violations

## Files Modified

1. `src/pages/Company/CompanyBusManagement.tsx`
   - Fixed bus filtering logic to use `companyName` instead of `companyId`
   - Added company name lookup for proper bus filtering
   - Enhanced fallback mechanism for partial name matching
   - Improved logging for debugging

## Dependencies

- `src/context/AuthContext.tsx` - Provides RBAC helper functions
- `src/components/common/RoleAccessNotice.tsx` - Provides consistent role messaging
- `src/services/api.ts` - Provides company and bus service API calls
- `src/types/company.ts` - Provides Company and Bus interface definitions 