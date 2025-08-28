# Dark and Light Theme Implementation

This document describes the comprehensive dark and light theme system implemented in the B&B Inventory Management application.

## Overview

The application now supports:
- **Light Mode**: Clean, bright interface with B&B brand colors
- **Dark Mode**: Dark interface optimized for low-light environments
- **System Mode**: Automatically follows the user's operating system preference
- **Persistent Theme Selection**: User's choice is saved and restored across sessions

## Features Implemented

### 1. Theme Toggle Component (`/src/components/ui/theme-toggle.tsx`)
- Enhanced dropdown menu with Light, Dark, and System options
- Visual indicators showing current theme selection
- Smooth icon transitions between sun and moon
- Proper accessibility with screen reader support

### 2. Enhanced CSS Variables (`/src/app/globals.css`)
- Comprehensive color system for both light and dark modes
- Smooth transitions between themes (300ms duration)
- Custom scrollbar styling for both themes
- B&B brand colors maintained across both themes

### 3. Theme Configuration (`/src/lib/theme-config.ts`)
- Centralized theme configuration
- Brand color constants
- Utility functions for theme-aware styling
- Type-safe theme management

### 4. Custom Theme Hooks (`/src/hooks/useTheme.ts`)
- `useTheme()`: Main theme management hook
- `useThemeAware()`: Helper hook for component-specific theming
- Utility functions for conditional styling
- Theme-aware color getters

### 5. Enhanced Components
- **LoggedInLayout**: Dark mode support for sidebar and header
- **Login Page**: Theme toggle available even when not logged in
- **Skeleton Components**: Theme-aware loading states
- **All UI Components**: Proper dark mode styling via CSS variables

## How to Use

### Switching Themes
1. **Via Theme Toggle**: Click the theme toggle button (sun/moon icon) in the header
2. **Dropdown Options**:
   - **Light**: Force light mode
   - **Dark**: Force dark mode  
   - **System**: Follow OS preference

### For Developers

#### Using the Theme Hook
```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { isDark, isLight, themeClass, themeValue } = useTheme();
  
  return (
    <div className={themeClass('bg-white', 'bg-slate-900')}>
      <p className="text-foreground">
        Current theme: {themeValue('Light', 'Dark')}
      </p>
    </div>
  );
}
```

#### Using CSS Variables
```tsx
// CSS variables automatically adapt to theme
<div className="bg-background text-foreground border border-border">
  <h1 className="text-primary">Brand Color</h1>
</div>
```

#### Conditional Styling
```tsx
import { useThemeAware } from '@/hooks/useTheme';

function ThemedCard() {
  const { getCardClass, isDark } = useThemeAware();
  
  return (
    <div className={`${getCardClass()} p-4 rounded-lg`}>
      {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
    </div>
  );
}
```

## Color Palette

### Light Theme
- **Background**: Linear gradient from #FBFBFB to #FFFFFF
- **Primary**: #D10D38 (B&B Red)
- **Secondary**: #153275 (B&B Blue)
- **Accent**: #0374EF (Blue)
- **Text**: #153275 on light backgrounds

### Dark Theme
- **Background**: Linear gradient from #0F172A to #1E293B
- **Primary**: #E11D48 (Brighter red for better contrast)
- **Secondary**: #64748B (Muted blue-gray)
- **Accent**: #3B82F6 (Brighter blue)
- **Text**: #F8FAFC on dark backgrounds

### Brand Colors (Theme Independent)
- **B&B Primary**: #D10D38
- **B&B Secondary**: #153275
- **Accent Colors**: #0374EF, #886DE8, #F7C959, #EF7037

## File Structure

```
src/
├── components/
│   ├── providers/
│   │   └── ThemeProvider.tsx       # Theme context provider
│   ├── ui/
│   │   ├── theme-toggle.tsx        # Theme switching component
│   │   └── skeleton.tsx            # Theme-aware loading states
│   └── layout/
│       └── LoggedInLayout.tsx      # Main layout with theme support
├── hooks/
│   └── useTheme.ts                 # Theme management hooks
├── lib/
│   └── theme-config.ts             # Theme configuration
└── app/
    ├── globals.css                 # CSS variables and styles
    ├── layout.tsx                  # Root layout with ThemeProvider
    └── login/
        └── page.tsx                # Login page with theme toggle
```

## Technical Implementation

### Theme Persistence
- Uses `localStorage` with key `bb-inventory-theme`
- Automatically restores user's preference on app load
- Syncs across browser tabs

### Performance Optimizations
- Smooth transitions without layout shifts
- Hydration-safe theme detection
- Minimal re-renders with proper state management

### Accessibility
- High contrast ratios in both themes
- Screen reader support for theme toggle
- Keyboard navigation support
- Respects user's motion preferences

## Browser Support
- **Modern browsers**: Full support with CSS custom properties
- **Fallback**: Graceful degradation for older browsers
- **System preference**: Supported in browsers with `prefers-color-scheme`

## Testing Themes

1. **Manual Testing**:
   - Toggle between Light/Dark/System modes
   - Check all pages and components
   - Verify persistence across page reloads

2. **System Theme Testing**:
   - Set theme to "System"
   - Change OS theme preference
   - Verify app follows OS setting

3. **Responsive Testing**:
   - Test on different screen sizes
   - Verify theme toggle works on mobile
   - Check color contrast at various zoom levels

## Future Enhancements

Potential improvements for the theme system:
- Custom theme creation
- High contrast mode
- Color blind accessibility options
- Theme scheduling (auto dark mode at night)
- Additional brand theme variants
