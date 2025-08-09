# RBAC Implementation for User Management Page

## Overview
This document outlines the Role-Based Access Control (RBAC) implementation for the user management page (`UserManagement.tsx`) to ensure that users can only view and manage accounts with appropriate permissions based on their role.

## RBAC Rules

### Role Hierarchy
- **Admin (roleId: 1)**: Can view and create Manager (roleId: 2) and Staff (roleId: 3) accounts for any company
- **Manager (roleId: 2)**: Can only view and create Staff (roleId: 3) accounts for their company
- **Staff (roleId: 3)**: Cannot access user management functionality

### Company Restrictions
- **Admin**: Can view and manage users from all companies
- **Manager**: Can only view and manage users from their own company (companyId)

## Changes Made

### 1. UserManagement.tsx (New)
- **RBAC filtering**: Filter users based on user's company and role
- **Dynamic UI**: Different table columns and labels based on user role
- **Modal integration**: Integrated CreateUserForm in a modal
- **User listing**: Display users with role-based filtering
- **Access control**: Prevent unauthorized access

### 2. CreateUserForm.tsx (Updated)
- **Added onSuccess callback**: Support for modal integration
- **Enhanced validation**: Role-based validation for user creation
- **Company filtering**: Manager users can only see their company
- **Dynamic UI**: Different options and labels based on user role

### 3. App.tsx (Updated)
- **Added route**: New route for user management page
- **Import statement**: Added UserManagement import

## Key Features

### Role-Based User Filtering
```typescript
// Filter users based on RBAC
let filteredUsers = response.data;
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  if (userCompanyId) {
    filteredUsers = response.data.filter(user => user.companyId === userCompanyId);
    console.log(`Filtered users for user companyId ${userCompanyId}:`, filteredUsers);
  }
}
```

### Dynamic Table Columns
```typescript
{isAdmin() && (
  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
    Công ty
  </th>
)}
```

### Access Control
```typescript
const canCreateUser = () => {
  return isAdmin() || isCompanyRestricted();
};

if (!canCreateUser()) {
  return (
    <RoleAccessNotice 
      title="Không có quyền truy cập"
      message="Bạn không có quyền truy cập trang quản lý người dùng."
    />
  );
}
```

## User Experience

### For Admin Users
- Can view all users from all companies
- Can create Manager and Staff accounts for any company
- See "Quản lý người dùng" title
- See "Quản lý tất cả người dùng trong hệ thống" description
- Company column is visible in the table
- Full access to all user management features

### For Manager Users
- Can only view users from their company
- Can only create Staff accounts for their company
- See "Quản lý người dùng công ty" title
- See "Quản lý người dùng của công ty bạn" description
- Company column is hidden in the table
- Limited access to user management features

### For Staff Users
- Cannot access user management functionality
- Should be redirected or shown access denied message

## Technical Implementation

### API Integration
**Endpoints Used**:
- `GET /api/SystemUser` - Fetch all users
- `POST /api/SystemUser` - Create new user
- `GET /api/Company/GetAllCompany` - Fetch companies for selection

### User Data Structure
```typescript
interface SystemUser {
  id: number;
  systemId: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  companyId: number;
  password: string;
  avartar: string;
  isActive: boolean;
  isDeleted: boolean;
  roleId: number;
}
```

### Modal Integration
```typescript
const { openModal, closeModal, isOpen } = useModal();

const handleUserCreated = () => {
  setSuccess("Tạo tài khoản thành công!");
  fetchUsers(); // Refresh user list
  closeModal();
};
```

## Security Considerations

### Frontend Validation
- **Client-side validation**: Immediate feedback for user experience
- **Role-based restrictions**: Prevents unauthorized role selection
- **Company restrictions**: Manager can only manage users from their company
- **Access control**: Prevents unauthorized access to user management

### Backend Requirements
- **Server-side validation**: Backend should validate all permissions
- **Role verification**: Ensure user has permission to view/manage specified users
- **Company verification**: Ensure user can only access users from their company
- **User creation validation**: Ensure user has permission to create specified role

## Testing Scenarios

### Admin User
- [ ] Can access user management page
- [ ] Can view all users from all companies
- [ ] Can create Manager accounts (roleId: 2)
- [ ] Can create Staff accounts (roleId: 3)
- [ ] Cannot create Admin accounts (roleId: 1)
- [ ] Company column is visible
- [ ] Modal form works correctly
- [ ] User list refreshes after creation

### Manager User
- [ ] Can access user management page
- [ ] Can only view users from their company
- [ ] Can only create Staff accounts (roleId: 3)
- [ ] Cannot create Manager or Admin accounts
- [ ] Company column is hidden
- [ ] Modal form works correctly
- [ ] User list refreshes after creation

### Staff User
- [ ] Cannot access user management page
- [ ] Should be redirected or shown access denied

### User Management Features
- [ ] User listing with proper filtering
- [ ] Role-based table columns
- [ ] User creation modal
- [ ] Success/error message handling
- [ ] Loading states
- [ ] Empty state handling

## Files Modified

1. `src/pages/User/UserManagement.tsx` (New)
   - Complete RBAC implementation
   - Role-based user filtering
   - Dynamic UI based on user role
   - Modal integration for user creation
   - User listing with proper formatting
   - Access control implementation

2. `src/components/auth/CreateUserForm.tsx` (Updated)
   - Added onSuccess callback prop
   - Enhanced for modal integration
   - Maintained all RBAC restrictions

3. `src/pages/User/index.ts` (New)
   - Export file for User pages

4. `src/App.tsx` (Updated)
   - Added UserManagement import
   - Added route for user management

## Dependencies

- `src/context/AuthContext.tsx` - Provides RBAC helper functions
- `src/services/api.ts` - Provides user management API calls
- `src/types/company.ts` - Provides Company interface definition
- `src/components/auth/CreateUserForm.tsx` - Provides user creation form
- `src/components/common/RoleAccessNotice.tsx` - Provides access denied notice
- `src/hooks/useModal.ts` - Provides modal functionality

## Usage Example

```typescript
// Access user management page
// URL: /users

// For Admin users
// - Can view all users from all companies
// - Can create Manager or Staff accounts
// - Company column is visible

// For Manager users  
// - Can only view users from their company
// - Can only create Staff accounts
// - Company column is hidden

// For Staff users
// - Should be redirected to access denied
```

## Route Configuration

The following route has been added to the routing configuration:

```typescript
{
  path: "/users",
  element: <UserManagement />,
  // Protected by AuthGuard
}
```

## Security Notes

1. **Backend Validation**: All frontend validations should be duplicated on the backend
2. **Role Verification**: Backend should verify user has permission to view/manage users
3. **Company Verification**: Backend should verify user can only access users from their company
4. **User Creation Validation**: Backend should verify user has permission to create specified role
5. **Rate Limiting**: Consider implementing rate limiting for user management operations
6. **Audit Trail**: Log all user management activities for security monitoring

## Future Improvements

1. **User Management Features**
   - User edit functionality
   - User deactivation/reactivation
   - User deletion with confirmation
   - Bulk user operations
   - User search and filtering

2. **Enhanced UI**
   - User avatar display
   - User status indicators
   - User activity tracking
   - User permissions display

3. **Advanced Features**
   - User import from CSV/Excel
   - User export functionality
   - User template creation
   - User invitation system

4. **Security Enhancements**
   - Two-factor authentication setup
   - Password reset functionality
   - User session management
   - Login history tracking
