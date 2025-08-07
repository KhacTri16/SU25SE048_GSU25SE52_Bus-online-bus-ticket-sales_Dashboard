# Role-Based Access Control (RBAC) Implementation

## Tổng quan

Hệ thống đã được implement Role-Based Access Control (RBAC) dựa trên `companyId` để đảm bảo rằng manager và staff chỉ có thể truy cập dữ liệu của công ty của họ.

## Các Role và Quyền

### 1. Admin (roleId: 1)
- **Quyền truy cập**: Tất cả dữ liệu trong hệ thống
- **Có thể**: Xem, tạo, sửa, xóa tất cả công ty, tuyến đường, xe, v.v.
- **Không bị giới hạn**: Không bị giới hạn bởi companyId

### 2. Manager (roleId: 2)
- **Quyền truy cập**: Chỉ dữ liệu của công ty của mình
- **Có thể**: Xem và quản lý dữ liệu của công ty của mình
- **Giới hạn**: Chỉ có thể thao tác với dữ liệu có companyId trùng với companyId của user

### 3. Staff (roleId: 3)
- **Quyền truy cập**: Chỉ dữ liệu của công ty của mình
- **Có thể**: Xem dữ liệu của công ty của mình
- **Giới hạn**: Chỉ có thể xem dữ liệu có companyId trùng với companyId của user

## Implementation Details

### 1. AuthContext Updates

Đã thêm các helper methods trong `AuthContext`:

```typescript
// Lấy companyId của user hiện tại
getUserCompanyId(): number | null

// Kiểm tra xem user có thể truy cập company này không
canAccessCompany(companyId: number | string): boolean

// Kiểm tra xem user có bị giới hạn bởi company không
isCompanyRestricted(): boolean
```

### 2. CompanyBusManagement

**Thay đổi chính:**
- Filter companies và buses dựa trên `companyId` của user
- Manager và staff chỉ thấy công ty và xe của họ
- Admin thấy tất cả

**Logic filtering:**
```typescript
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  if (userCompanyId) {
    filteredCompanies = companiesResponse.data.filter(
      company => company.id === userCompanyId
    );
    filteredBuses = busesResponse.data.filter(
      bus => bus.companyId === userCompanyId
    );
  }
}
```

### 3. RoutesManagement

**Thay đổi chính:**
- Filter routes dựa trên company của user
- Tự động set companyId khi tạo tuyến mới cho manager/staff
- Backend sẽ handle filtering vì Route interface chưa có companyId

**Logic:**
```typescript
// Tự động set companyId cho manager/staff
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  if (userCompanyId) {
    data.companyId = userCompanyId;
  }
}
```

### 4. RouteFormModal

**Thay đổi chính:**
- Ẩn company selection cho manager/staff
- Tự động set companyId cho user
- Hiển thị thông tin công ty dưới dạng read-only

**UI Changes:**
```typescript
{isAdmin() || !isCompanyRestricted() ? (
  // Show company dropdown for admin
  <select>...</select>
) : (
  // Show read-only company info for manager/staff
  <div className="bg-gray-50">
    {companies[0]?.name}
  </div>
)}
```

### 5. RoleAccessNotice Component

Tạo component mới để hiển thị thông tin về quyền truy cập:

```typescript
// Sử dụng trong các pages
<RoleAccessNotice className="mb-6" />
```

## API Integration

### Backend Requirements

Để hoàn thiện RBAC, backend cần:

1. **Route API**: Thêm `companyId` vào Route response
2. **Filtering**: Implement server-side filtering cho các API calls
3. **Validation**: Kiểm tra quyền truy cập ở backend

### Current API Calls

```typescript
// Company API
GET /api/Company/GetAllCompany

// Bus API  
GET /api/Bus

// Route API
GET /api/Route
POST /api/Route
PUT /api/Route/{id}
DELETE /api/Route/{id}
```

## Testing

### Test Cases

1. **Admin Login**: Có thể xem tất cả dữ liệu
2. **Manager Login**: Chỉ xem được dữ liệu của công ty mình
3. **Staff Login**: Chỉ xem được dữ liệu của công ty mình
4. **Create Route**: Manager/staff tự động set companyId
5. **Update/Delete**: Kiểm tra quyền trước khi thực hiện

### Test Data

```json
// Manager account
{
  "id": 3,
  "email": "manager@gmail.com",
  "companyId": 4,
  "roleId": 2
}

// Staff account  
{
  "id": 4,
  "email": "staff@gmail.com", 
  "companyId": 4,
  "roleId": 3
}
```

## Security Considerations

1. **Frontend Filtering**: Chỉ là UI enhancement, không thay thế backend validation
2. **Backend Validation**: Cần implement server-side checks
3. **Token Security**: JWT token chứa companyId và roleId
4. **API Security**: Tất cả API calls cần validate quyền truy cập

## Future Improvements

1. **Granular Permissions**: Chi tiết hơn cho từng action
2. **Audit Logging**: Log tất cả actions của user
3. **Dynamic Permissions**: Có thể thay đổi permissions runtime
4. **Multi-tenant**: Support nhiều company cho một user

## Files Modified

1. `src/context/AuthContext.tsx` - Thêm helper methods
2. `src/pages/Company/CompanyBusManagement.tsx` - Filter data
3. `src/pages/Routes/RoutesManagement.tsx` - Filter routes
4. `src/components/Routes/RouteFormModal.tsx` - Auto-set company
5. `src/components/common/RoleAccessNotice.tsx` - New component

## Usage

```typescript
// Trong component
const { user, isAdmin, isCompanyRestricted, getUserCompanyId } = useAuth();

// Kiểm tra quyền
if (isCompanyRestricted()) {
  const userCompanyId = getUserCompanyId();
  // Filter data based on userCompanyId
}

// Hiển thị thông báo
<RoleAccessNotice />
``` 