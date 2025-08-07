# Dark Mode Guide

## Tổng quan

Dự án đã được tích hợp sẵn dark mode với Tailwind CSS. Dark mode được quản lý thông qua `ThemeContext` và có thể chuyển đổi bằng nút toggle trong header.

## Cách sử dụng

### 1. Chuyển đổi Dark Mode

- **Nút Toggle**: Click vào nút mặt trời/mặt trăng trong header (góc trên bên phải)
- **Keyboard Shortcut**: Có thể thêm shortcut tùy chỉnh

### 2. Truy cập Demo

Để xem demo dark mode, truy cập: `/dark-mode-demo`

## Cấu trúc Dark Mode

### ThemeContext

```typescript
// src/context/ThemeContext.tsx
const { theme, toggleTheme } = useTheme();
```

### CSS Classes

Dự án sử dụng Tailwind CSS với dark mode classes:

```css
/* Light mode (mặc định) */
.bg-white
.text-gray-900

/* Dark mode */
.dark:bg-gray-800
.dark:text-white
```

## Các Component đã hỗ trợ Dark Mode

### 1. AppHeader
- Background và border colors
- Text colors
- Button hover states

### 2. AppSidebar
- Background và border colors
- Menu item states
- Text colors

### 3. LocationList
- Background colors
- Card shadows
- Text colors
- Input fields
- Icons và badges

### 4. DarkModeDemo
- Demo đầy đủ các component với dark mode
- Cards, forms, tables
- Interactive elements

## Cách thêm Dark Mode cho Component mới

### 1. Background Colors

```jsx
// Light mode background
className="bg-white dark:bg-gray-800"

// Secondary background
className="bg-gray-50 dark:bg-gray-900"
```

### 2. Text Colors

```jsx
// Primary text
className="text-gray-900 dark:text-white"

// Secondary text
className="text-gray-600 dark:text-gray-400"

// Muted text
className="text-gray-500 dark:text-gray-500"
```

### 3. Border Colors

```jsx
// Light borders
className="border-gray-200 dark:border-gray-700"

// Darker borders
className="border-gray-300 dark:border-gray-600"
```

### 4. Shadow Effects

```jsx
// Light shadows
className="shadow dark:shadow-gray-900/20"
```

### 5. Interactive Elements

```jsx
// Buttons
className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"

// Input fields
className="border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
```

## Color Palette cho Dark Mode

### Background Colors
- `bg-white` → `dark:bg-gray-800` (Primary background)
- `bg-gray-50` → `dark:bg-gray-900` (Secondary background)
- `bg-gray-100` → `dark:bg-gray-700` (Tertiary background)

### Text Colors
- `text-gray-900` → `dark:text-white` (Primary text)
- `text-gray-600` → `dark:text-gray-400` (Secondary text)
- `text-gray-500` → `dark:text-gray-500` (Muted text)

### Border Colors
- `border-gray-200` → `dark:border-gray-700` (Light borders)
- `border-gray-300` → `dark:border-gray-600` (Medium borders)

### Icon Colors
- `text-blue-600` → `dark:text-blue-400` (Primary icons)
- `text-green-600` → `dark:text-green-400` (Success icons)
- `text-red-600` → `dark:text-red-400` (Error icons)

## Best Practices

### 1. Luôn sử dụng cặp class
```jsx
// ✅ Đúng
className="bg-white dark:bg-gray-800"

// ❌ Sai - thiếu dark mode
className="bg-white"
```

### 2. Sử dụng semantic colors
```jsx
// ✅ Đúng - sử dụng semantic colors
className="text-blue-600 dark:text-blue-400"

// ❌ Sai - hardcode colors
className="text-blue-600 dark:text-blue-600"
```

### 3. Test cả hai modes
- Luôn test component trong cả light và dark mode
- Đảm bảo contrast ratio đủ tốt
- Kiểm tra readability

### 4. Sử dụng opacity cho shadows
```jsx
// ✅ Đúng
className="shadow dark:shadow-gray-900/20"

// ❌ Sai
className="shadow dark:shadow-black"
```

## Troubleshooting

### 1. Dark mode không hoạt động
- Kiểm tra `ThemeProvider` đã wrap đúng component
- Đảm bảo Tailwind CSS đã được cấu hình đúng
- Kiểm tra localStorage có lưu theme không

### 2. Colors không đúng
- Kiểm tra class names có đúng syntax không
- Đảm bảo đã import đúng Tailwind CSS
- Test với browser dev tools

### 3. Performance issues
- Sử dụng `useMemo` cho expensive calculations
- Tránh re-render không cần thiết
- Sử dụng CSS transitions cho smooth switching

## Testing

### Manual Testing
1. Chuyển đổi theme và kiểm tra tất cả components
2. Test trên các screen sizes khác nhau
3. Kiểm tra accessibility (contrast ratios)

### Automated Testing
```javascript
// Test theme switching
test('should toggle theme', () => {
  const { getByRole } = render(<ThemeToggleButton />);
  const button = getByRole('button');
  fireEvent.click(button);
  expect(document.documentElement).toHaveClass('dark');
});
```

## Resources

- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Dark Mode Best Practices](https://web.dev/prefers-color-scheme/) 