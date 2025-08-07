# RBAC Implementation for Company List Page

## Overview
This document outlines the Role-Based Access Control (RBAC) implementation for the company list page (`CompanyPage.tsx` and `CompanyList.tsx`) to ensure that managers and staff can only view their own company information.

## Changes Made

### 1. CompanyPage.tsx
- **Added RoleAccessNotice component**: Provides consistent RBAC feedback across the application
- **Import statement**: Added `import RoleAccessNotice from "../../components/common/RoleAccessNotice";`
- **Component placement**: Added `<RoleAccessNotice />` after the header section

### 2. CompanyList.tsx
- **Added AuthContext integration**: Imported `useAuth` hook to access RBAC helper functions
- **RBAC filtering logic**: Implemented company filtering based on user's `companyId`
- **Dynamic UI labels**: Updated statistics and header labels for restricted users
- **Conditional button rendering**: "Thêm công ty mới" button only shows for admin users
- **Fixed filtering logic**: Changed from `company.companyId` to `company.id` for proper matching
- **Added fallback mechanism**: If filtering returns no results, fetch specific company by ID

### 3. API Service (api.ts)
- **Added getCompanyById method**: New method to fetch specific company by ID
- **Endpoint**: `/api/Company/{id}` for fetching individual company details

## Key Features

### Role-Based Data Filtering
```typescript
// Apply RBAC filtering for manager and staff
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  if (userCompanyId) {
    // Filter by company.id (not company.companyId) since user's companyId matches company.id
    companiesData = companiesData.filter(company => company.id === userCompanyId);
    
    // If no companies found after filtering, try to fetch the specific company
    if (companiesData.length === 0) {
      const specificCompanyResponse = await companyService.getCompanyById(userCompanyId);
      if (specificCompanyResponse) {
        companiesData = [specificCompanyResponse];
      }
    }
  }
}
```

### Dynamic UI Labels
- **Admin users**: See "Tổng công ty", "Đang hoạt động", "Mới tháng này"
- **Manager/Staff users**: See "Công ty của bạn", "Trạng thái hoạt động", "Thông tin công ty"

### Conditional Functionality
- **"Thêm công ty mới" button**: Only visible to admin users (`isAdmin()`)
- **Header text**: Changes from "Danh sách công ty vận tải" to "Thông tin công ty của bạn" for restricted users
- **Description text**: Shows "Hiển thị thông tin công ty của bạn" for restricted users

## User Experience

### For Admin Users
- Can view all companies in the system
- Can add new companies
- See comprehensive statistics across all companies
- Full access to all company management features

### For Manager/Staff Users
- Can only view their own company information
- Cannot add new companies
- See statistics specific to their company
- Limited access with clear role-based messaging

## Technical Implementation

### Dependencies
- `useAuth` hook from `AuthContext`
- `RoleAccessNotice` component for consistent messaging
- Existing `companyService.getAllCompanies` API call
- New `companyService.getCompanyById` API call

### Data Flow
1. API call fetches all companies
2. Frontend filtering applied based on user role and `companyId`
3. If no companies found for restricted users, fetch specific company by ID
4. Filtered data displayed with appropriate UI labels
5. User interactions limited based on role permissions

## Security Considerations

### Frontend Filtering
- **Current implementation**: Client-side filtering for immediate user experience
- **Backend requirement**: Server-side filtering should be implemented for complete security
- **Recommendation**: API endpoints should accept `companyId` parameter and filter data server-side

### Data Exposure
- **Risk**: API responses contain all companies before filtering
- **Mitigation**: Implement backend filtering to prevent data leakage
- **Monitoring**: Log API calls to detect potential security issues

## Testing Scenarios

### Admin User
- [ ] Can view all companies
- [ ] Can see "Thêm công ty mới" button
- [ ] Statistics show total counts across all companies
- [ ] Header shows "Danh sách công ty vận tải"

### Manager User
- [ ] Can only view their own company
- [ ] Cannot see "Thêm công ty mới" button
- [ ] Statistics show company-specific information
- [ ] Header shows "Thông tin công ty của bạn"
- [ ] RoleAccessNotice displays appropriate message
- [ ] Can see company details when filtering works correctly
- [ ] Can see company details when fallback to specific company fetch works

### Staff User
- [ ] Can only view their own company
- [ ] Cannot see "Thêm công ty mới" button
- [ ] Statistics show company-specific information
- [ ] Header shows "Thông tin công ty của bạn"
- [ ] RoleAccessNotice displays appropriate message
- [ ] Can see company details when filtering works correctly
- [ ] Can see company details when fallback to specific company fetch works

## Bug Fixes

### Issue: Manager/Staff Not Seeing Their Company
**Problem**: Manager with `companyId: 4` was not seeing their company "Phương Trang" in the list.

**Root Cause**: 
- User's `companyId` (4) should match `company.id` (4), not `company.companyId` ("PHUONGTRANG")
- The filtering was comparing wrong fields

**Solution**:
1. Changed filtering from `company.companyId === userCompanyId` to `company.id === userCompanyId`
2. Added fallback mechanism to fetch specific company if filtering returns no results
3. Added `getCompanyById` method to API service

**API Response Structure**:
```json
{
  "id": 4,                    // ← This matches user's companyId
  "companyId": "PHUONGTRANG", // ← This is the company's internal ID
  "name": "Phương Trang",
  // ... other fields
}
```

## Future Improvements

1. **Backend API Enhancement**
   - Modify `getAllCompanies` endpoint to accept `companyId` parameter
   - Implement server-side filtering for complete security
   - Add role-based access validation on server

2. **Enhanced Error Handling**
   - Handle cases where user has no `companyId`
   - Provide clear error messages for access denied scenarios
   - Implement fallback UI for edge cases

3. **Performance Optimization**
   - Implement pagination for large company lists
   - Add caching for frequently accessed company data
   - Optimize API calls based on user role

4. **Audit Logging**
   - Log company access attempts
   - Track role-based data filtering
   - Monitor for potential security violations

## Files Modified

1. `src/pages/Company/CompanyPage.tsx`
   - Added RoleAccessNotice component
   - Updated imports

2. `src/components/company/CompanyList.tsx`
   - Added useAuth hook integration
   - Implemented RBAC filtering logic
   - Updated UI labels and conditional rendering
   - Enhanced data fetching with role-based filtering
   - Fixed filtering logic to use `company.id` instead of `company.companyId`
   - Added fallback mechanism for fetching specific company

3. `src/services/api.ts`
   - Added `getCompanyById` method to companyService
   - New endpoint: `/api/Company/{id}`

## Dependencies

- `src/context/AuthContext.tsx` - Provides RBAC helper functions
- `src/components/common/RoleAccessNotice.tsx` - Provides consistent role messaging
- `src/services/api.ts` - Provides company service API calls
- `src/types/company.ts` - Provides Company interface definition 