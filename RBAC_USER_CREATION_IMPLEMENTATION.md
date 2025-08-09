# RBAC Implementation for User Creation

## Overview
This document outlines the Role-Based Access Control (RBAC) implementation for user creation functionality to ensure that users can only create accounts with appropriate permissions based on their role.

## RBAC Rules

### Role Hierarchy
- **Admin (roleId: 1)**: Can create Manager (roleId: 2) and Staff (roleId: 3) accounts
- **Manager (roleId: 2)**: Can only create Staff (roleId: 3) accounts for their company
- **Staff (roleId: 3)**: Cannot create any accounts

### Company Restrictions
- **Admin**: Can create accounts for any company
- **Manager**: Can only create accounts for their own company (companyId)

## Changes Made

### 1. API Service (api.ts)
- **Updated createUser method**: Modified to match exact API endpoint requirements
- **FormData implementation**: Uses FormData for file upload support
- **Proper field mapping**: Maps form fields to API requirements (Email, FullName, Phone, etc.)

### 2. CreateUserForm Component
- **RBAC validation**: Implements role-based validation for user creation
- **Company filtering**: Manager users can only see their company
- **Dynamic UI**: Different options and labels based on user role
- **Form validation**: Comprehensive client-side validation
- **File upload**: Support for avatar image upload

### 3. CreateUser Page
- **New page component**: Dedicated page for user creation
- **AuthLayout integration**: Uses existing authentication layout
- **PageMeta**: Proper SEO and page metadata

## Key Features

### Role-Based Validation
```typescript
// Role validation based on current user's role
if (isAdmin()) {
  // Admin can create Manager (2) and Staff (3)
  if (formData.Role !== 2 && formData.Role !== 3) {
    setError("Admin chỉ có thể tạo tài khoản Manager hoặc Staff");
    return false;
  }
} else if (isCompanyRestricted()) {
  // Manager can only create Staff (3)
  if (formData.Role !== 3) {
    setError("Manager chỉ có thể tạo tài khoản Staff");
    return false;
  }
} else {
  setError("Bạn không có quyền tạo tài khoản");
  return false;
}
```

### Company Filtering
```typescript
// If user is company-restricted (Manager), only show their company
let filteredCompanies = response.data;
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  if (userCompanyId) {
    filteredCompanies = response.data.filter(company => company.id === userCompanyId);
    
    // Auto-set company ID for company-restricted users
    if (filteredCompanies.length > 0) {
      setFormData(prev => ({
        ...prev,
        CompanyId: userCompanyId
      }));
    }
  }
}
```

### Dynamic UI Options
```typescript
const getRoleOptions = () => {
  if (isAdmin()) {
    return [
      { value: 2, label: "Manager" },
      { value: 3, label: "Staff" }
    ];
  } else if (isCompanyRestricted()) {
    return [
      { value: 3, label: "Staff" }
    ];
  }
  return [];
};
```

## User Experience

### For Admin Users
- Can create Manager and Staff accounts
- Can select any company for the new account
- See "Tạo tài khoản mới" title
- See "Tạo tài khoản Manager hoặc Staff cho hệ thống" description
- Full access to all form fields

### For Manager Users
- Can only create Staff accounts
- Automatically assigned to their company
- See "Tạo tài khoản Staff" title
- See "Tạo tài khoản Staff cho công ty của bạn" description
- Company field shows as read-only with their company name

### For Staff Users
- Cannot access user creation functionality
- Should be redirected or shown access denied message

## Technical Implementation

### API Integration
**Endpoint**: `POST /api/SystemUser`
**Content-Type**: `multipart/form-data`

**Request Body**:
```typescript
{
  Email: string;
  FullName: string;
  Phone: string;
  Address: string;
  CompanyId: number;
  Password: string;
  Role: number;
  Avartar?: File; // Optional file upload
}
```

**Response Example**:
```json
{
  "id": 7,
  "systemId": "SYS002",
  "email": "staff3@gmail.com",
  "fullName": "abcd",
  "phone": "1234567890",
  "address": "dslkafjdklsa",
  "companyId": 4,
  "password": "111",
  "avartar": "https://firebasestorage.googleapis.com/...",
  "isActive": true,
  "isDeleted": false,
  "roleId": 3
}
```

### Form Validation
1. **Required fields**: Email, FullName, Phone, Address, Password, CompanyId, Role
2. **Email validation**: Must be valid email format
3. **Phone validation**: Must be 10-11 digits
4. **Password validation**: Minimum 6 characters
5. **Role validation**: Based on current user's permissions
6. **Company validation**: Must be selected (for Admin) or auto-assigned (for Manager)

### File Upload
- **Avatar upload**: Optional image file upload
- **File type**: Images only (`accept="image/*"`)
- **FormData**: Properly handles file upload with FormData

## Security Considerations

### Frontend Validation
- **Client-side validation**: Immediate feedback for user experience
- **Role-based restrictions**: Prevents unauthorized role selection
- **Company restrictions**: Manager can only create accounts for their company

### Backend Requirements
- **Server-side validation**: Backend should validate all permissions
- **Role verification**: Ensure user has permission to create specified role
- **Company verification**: Ensure user can create accounts for specified company
- **File upload security**: Validate file types and sizes

## Testing Scenarios

### Admin User
- [ ] Can access user creation page
- [ ] Can select any company from dropdown
- [ ] Can create Manager accounts (roleId: 2)
- [ ] Can create Staff accounts (roleId: 3)
- [ ] Cannot create Admin accounts (roleId: 1)
- [ ] Form validation works correctly
- [ ] File upload works for avatar

### Manager User
- [ ] Can access user creation page
- [ ] Company field shows as read-only with their company
- [ ] Can only create Staff accounts (roleId: 3)
- [ ] Cannot create Manager or Admin accounts
- [ ] Form validation works correctly
- [ ] File upload works for avatar

### Staff User
- [ ] Cannot access user creation page
- [ ] Should be redirected or shown access denied

### Form Validation
- [ ] Required field validation
- [ ] Email format validation
- [ ] Phone number validation
- [ ] Password length validation
- [ ] Role selection validation
- [ ] Company selection validation (for Admin)

## API Integration

### Current Endpoints Used
- `POST /api/SystemUser` - Create new user
- `GET /api/Company/GetAllCompany` - Fetch companies for selection

### Request Format
```typescript
const formData = new FormData();
formData.append('Email', userData.Email);
formData.append('FullName', userData.FullName);
formData.append('Phone', userData.Phone);
formData.append('Address', userData.Address);
formData.append('CompanyId', userData.CompanyId.toString());
formData.append('Password', userData.Password);
formData.append('Role', userData.Role.toString());

if (userData.Avartar) {
  formData.append('Avartar', userData.Avartar);
}
```

## Future Improvements

1. **Enhanced Validation**
   - Password strength requirements
   - Phone number format validation
   - Address validation
   - Email domain validation

2. **User Management**
   - User list view with RBAC filtering
   - User edit functionality
   - User deactivation/reactivation
   - Bulk user operations

3. **Audit Logging**
   - Log all user creation attempts
   - Track who created which users
   - Monitor for suspicious activity

4. **Advanced Features**
   - User import from CSV/Excel
   - User template creation
   - Automated user provisioning
   - User invitation system

## Files Modified

1. `src/services/api.ts`
   - Updated `createUser` method to use FormData
   - Added proper field mapping for API requirements
   - Enhanced error handling

2. `src/components/auth/CreateUserForm.tsx` (New)
   - Complete RBAC implementation
   - Role-based validation
   - Company filtering for Manager users
   - Dynamic UI based on user role
   - Form validation and error handling
   - File upload functionality

3. `src/pages/AuthPages/CreateUser.tsx` (New)
   - New page component for user creation
   - Integration with AuthPageLayout
   - Proper page metadata

## Dependencies

- `src/context/AuthContext.tsx` - Provides RBAC helper functions
- `src/services/api.ts` - Provides user creation API calls
- `src/types/company.ts` - Provides Company interface definition
- `src/components/form/` - Provides form components
- `src/icons/` - Provides UI icons

## Usage Example

```typescript
// Access user creation page
// URL: /create-user

// For Admin users
// - Can select any company
// - Can create Manager or Staff accounts

// For Manager users  
// - Company is auto-assigned
// - Can only create Staff accounts

// For Staff users
// - Should be redirected to access denied
```

## Route Configuration

Add the following route to your routing configuration:

```typescript
{
  path: "/create-user",
  element: <CreateUser />,
  // Add appropriate authentication guards
}
```

## Security Notes

1. **Backend Validation**: All frontend validations should be duplicated on the backend
2. **Role Verification**: Backend should verify user has permission to create specified role
3. **Company Verification**: Backend should verify user can create accounts for specified company
4. **File Upload Security**: Implement proper file validation and storage security
5. **Rate Limiting**: Consider implementing rate limiting for user creation
6. **Audit Trail**: Log all user creation activities for security monitoring
