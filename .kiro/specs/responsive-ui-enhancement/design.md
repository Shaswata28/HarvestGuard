# Design Document

## Overview

This feature implements comprehensive responsive design across the entire RiceGuard application, ensuring optimal user experience on devices ranging from small mobile phones (320px) to large desktop monitors (1920px+). The implementation follows a mobile-first approach using Tailwind CSS's responsive utilities and custom breakpoints where needed.

The application already uses Tailwind CSS, which provides excellent responsive design utilities. This enhancement will systematically apply responsive patterns across all pages, components, and layouts to ensure consistency and usability across all viewport sizes.

## Architecture

### Responsive Breakpoint Strategy

The application will use Tailwind's default breakpoints with custom additions:

```typescript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'xs': '320px',   // Extra small phones
      'sm': '640px',   // Small devices
      'md': '768px',   // Tablets
      'lg': '1024px',  // Small laptops
      'xl': '1280px',  // Desktops
      '2xl': '1536px', // Large desktops
    }
  }
}
```

### Layout Patterns by Breakpoint

**Mobile (< 768px):**
- Single column layouts
- Bottom navigation bar
- Full-width cards and forms
- Stacked form fields
- Compact spacing (p-4, gap-4)
- Font sizes: text-sm to text-base

**Tablet (768px - 1023px):**
- 2-column grids where appropriate
- Side navigation or bottom nav
- Moderate spacing (p-6, gap-6)
- Font sizes: text-base to text-lg

**Desktop (1024px+):**
- 3-4 column grids
- Sidebar navigation
- Maximum content width: 1400px
- Generous spacing (p-8, gap-8)
- Font sizes: text-base to text-xl

## Components and Interfaces

### 1. Responsive Container Component

**Location:** `client/components/ResponsiveContainer.tsx`

A wrapper component that provides consistent max-width and padding across breakpoints.

```typescript
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ResponsiveContainer({ 
  children, 
  className, 
  maxWidth = 'xl' 
}: ResponsiveContainerProps): JSX.Element
```

**Implementation:**
```typescript
const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full'
};

return (
  <div className={cn(
    'mx-auto px-4 sm:px-6 lg:px-8',
    maxWidthClasses[maxWidth],
    className
  )}>
    {children}
  </div>
);
```

### 2. Responsive Grid Component

**Location:** `client/components/ResponsiveGrid.tsx`

A flexible grid component that adapts column count based on viewport.

```typescript
interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export function ResponsiveGrid({ 
  children, 
  cols = { xs: 1, sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className 
}: ResponsiveGridProps): JSX.Element
```

### 3. Responsive Typography Hook

**Location:** `client/hooks/useResponsiveText.ts`

A hook that provides responsive text sizing utilities.

```typescript
export function useResponsiveText() {
  const getHeadingClass = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    const classes = {
      1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl',
      2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl',
      3: 'text-lg sm:text-xl lg:text-2xl xl:text-3xl',
      4: 'text-base sm:text-lg lg:text-xl',
      5: 'text-sm sm:text-base lg:text-lg',
      6: 'text-xs sm:text-sm lg:text-base',
    };
    return classes[level];
  };

  const getBodyClass = () => 'text-sm sm:text-base lg:text-lg';
  const getCaptionClass = () => 'text-xs sm:text-sm';

  return { getHeadingClass, getBodyClass, getCaptionClass };
}
```

### 4. Responsive Navigation Component

**Location:** `client/components/ResponsiveNav.tsx`

Adapts navigation pattern based on viewport size.

```typescript
export function ResponsiveNav(): JSX.Element {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(min-width: 769px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  if (isMobile) return <BottomNav />;
  if (isTablet) return <TabletNav />;
  return <DesktopSideNav />;
}
```

### 5. useMediaQuery Hook

**Location:** `client/hooks/useMediaQuery.ts`

A custom hook for responsive behavior in components.

```typescript
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
```

## Data Models

No new data models required. This is a UI/UX enhancement that works with existing data structures.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: No Horizontal Scroll on Mobile

*For any* page rendered on a mobile viewport (320px-767px), the content width should not exceed the viewport width, preventing horizontal scrolling.

**Validates: Requirements 1.1**

### Property 2: Touch Target Minimum Size

*For any* interactive element (button, link, input) on mobile, the touch target size should be at least 44x44 pixels.

**Validates: Requirements 1.2, 11.5**

### Property 3: Responsive Font Scaling

*For any* text element, the font size should scale appropriately across breakpoints, with mobile text being at least 14px and desktop text being at least 16px.

**Validates: Requirements 4.2**

### Property 4: Layout Adaptation

*For any* grid or multi-column layout, the number of columns should decrease as viewport width decreases, reaching single column on mobile.

**Validates: Requirements 1.4, 2.2, 3.2**

### Property 5: Image Responsiveness

*For any* image element, the image should scale to fit its container without exceeding viewport bounds or distorting aspect ratio.

**Validates: Requirements 5.1, 5.3**

### Property 6: Navigation Visibility

*For any* viewport size, all primary navigation items should be accessible, either through visible navigation or a menu toggle.

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 7: Modal Responsiveness

*For any* modal or dialog, it should adapt its size and position based on viewport, being full-screen on mobile and centered with max-width on desktop.

**Validates: Requirements 8.1, 8.2, 8.3**

### Property 8: Spacing Consistency

*For any* component, spacing (padding, margin, gap) should scale proportionally with viewport size while maintaining visual hierarchy.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

## Page-Specific Responsive Patterns

### Dashboard Page

**Mobile (< 768px):**
- Stack all sections vertically
- Full-width weather card
- Single-column crop inventory
- Compact advisory cards
- Bottom navigation

**Tablet (768px - 1023px):**
- 2-column grid for crop cards
- Side-by-side weather and advisory
- Moderate spacing

**Desktop (1024px+):**
- Sidebar navigation
- 3-column crop grid
- Dashboard widgets in optimal layout
- Maximum content width: 1200px

### Scanner Page

**Mobile:**
- Full-width camera preview
- Stacked action buttons
- Full-screen result modal

**Tablet:**
- Centered camera preview with padding
- Horizontal action buttons
- Modal with max-width

**Desktop:**
- Centered layout with max-width 800px
- Side-by-side preview and controls
- Floating result card

### Weather Page

**Mobile:**
- Stacked weather cards
- Vertical forecast list
- Compact advisory items

**Tablet:**
- 2-column forecast grid
- Side-by-side current weather and forecast

**Desktop:**
- 3-column layout
- Expanded weather details
- Horizontal forecast timeline

### Health Journal Page

**Mobile:**
- Vertical scan history list
- Full-width scan cards
- Stacked filters

**Tablet:**
- 2-column scan grid
- Horizontal filter bar

**Desktop:**
- 3-column scan grid
- Sidebar filters
- Expanded scan details

### Profile Page

**Mobile:**
- Stacked form fields
- Full-width inputs
- Vertical button group

**Tablet:**
- 2-column form layout
- Grouped related fields

**Desktop:**
- Multi-column form
- Side-by-side sections
- Inline validation messages

## Responsive Component Updates

### AIAssistant Component

**Current:** Fixed position, single size
**Enhancement:**

```typescript
// Mobile: Smaller, bottom-positioned
className="fixed bottom-20 right-4 w-[90vw] max-w-[380px] h-[500px] md:h-[550px] lg:h-[600px]"

// Desktop: Larger, more spacing
className="lg:right-8 lg:bottom-8 lg:max-w-[420px]"
```

### WeatherCard Component

**Current:** Fixed layout
**Enhancement:**

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
  {/* Weather details */}
</div>
```

### CropCard Component

**Current:** Fixed size
**Enhancement:**

```typescript
<div className="p-4 md:p-5 lg:p-6 rounded-xl md:rounded-2xl">
  <h3 className="text-lg md:text-xl lg:text-2xl">
    {/* Crop name */}
  </h3>
</div>
```

## Layout Component Updates

### AppLayout

**Current:** Fixed layout
**Enhancement:**

```typescript
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Desktop: Sidebar + Content */}
      <div className="hidden lg:flex">
        <Sidebar />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>

      {/* Mobile/Tablet: Content + Bottom Nav */}
      <div className="lg:hidden">
        <main className="pb-20 p-4 md:p-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
```

### PublicLayout

**Enhancement:**

```typescript
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="px-4 py-4 md:px-6 md:py-6 lg:px-8">
        {/* Responsive header */}
      </header>
      <main className="px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  );
}
```

## Responsive Utilities

### Tailwind Configuration Updates

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top': 'env(safe-area-inset-top)',
      },
      fontSize: {
        'responsive-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'responsive-base': 'clamp(1rem, 3vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
      },
    },
  },
}
```

### Global CSS Updates

```css
/* client/global.css */

/* Prevent horizontal scroll */
html, body {
  overflow-x: hidden;
  max-width: 100vw;
}

/* Responsive images */
img {
  max-width: 100%;
  height: auto;
}

/* Touch-friendly inputs on mobile */
@media (max-width: 768px) {
  input, select, textarea {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}

/* Safe area for notched devices */
@supports (padding: env(safe-area-inset-bottom)) {
  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }
}
```

## Testing Strategy

### Visual Regression Testing

Test each page at multiple breakpoints:
- 320px (iPhone SE)
- 375px (iPhone 12/13)
- 768px (iPad Portrait)
- 1024px (iPad Landscape)
- 1280px (Desktop)
- 1920px (Large Desktop)

### Responsive Testing Tools

1. **Browser DevTools**: Test responsive behavior in Chrome/Firefox DevTools
2. **Real Devices**: Test on actual mobile devices and tablets
3. **Lighthouse**: Verify mobile performance and accessibility scores
4. **Responsive Design Checker**: Use online tools to verify layouts

### Unit Testing

**Framework:** Vitest with React Testing Library

**Test Coverage:**

1. **useMediaQuery Hook Tests**
   - Returns correct boolean for matching queries
   - Updates when window resizes
   - Cleans up event listeners

2. **ResponsiveContainer Tests**
   - Applies correct max-width classes
   - Applies responsive padding
   - Accepts custom className

3. **ResponsiveGrid Tests**
   - Renders correct number of columns at each breakpoint
   - Applies correct gap spacing
   - Handles custom column configurations

### Integration Testing

1. **Page Layout Tests**
   - Dashboard renders correctly at all breakpoints
   - Scanner adapts layout appropriately
   - Weather page displays properly on mobile

2. **Navigation Tests**
   - Bottom nav appears on mobile
   - Sidebar appears on desktop
   - Navigation state persists across breakpoints

3. **Modal Tests**
   - Modals are full-screen on mobile
   - Modals are centered on desktop
   - Modal content is accessible at all sizes

## Error Handling

### Layout Overflow

If content exceeds viewport:
- Apply `overflow-x-hidden` to prevent horizontal scroll
- Use `overflow-y-auto` for vertical scrolling
- Log warning in development mode

### Image Loading

If images fail to load:
- Display placeholder with appropriate aspect ratio
- Maintain layout integrity
- Provide retry mechanism

### Breakpoint Mismatch

If media query fails:
- Fall back to mobile-first layout
- Log error for debugging
- Ensure core functionality remains accessible

## Performance Considerations

### Image Optimization

- Use responsive images with `srcset` and `sizes`
- Lazy load images below the fold
- Serve WebP format with fallbacks
- Compress images appropriately for mobile

### Code Splitting

- Split responsive components by breakpoint
- Lazy load desktop-only features on mobile
- Use dynamic imports for heavy components

### CSS Optimization

- Use Tailwind's JIT mode for minimal CSS
- Purge unused styles in production
- Minimize custom CSS

### Bundle Size

- Current bundle: ~500KB
- Target: < 300KB for mobile
- Use tree-shaking and code splitting

## Accessibility Considerations

### Touch Targets

- Minimum 44x44px for all interactive elements
- Adequate spacing between touch targets (8px minimum)
- Visual feedback on touch/click

### Keyboard Navigation

- Maintain tab order across breakpoints
- Visible focus indicators at all sizes
- Skip links for mobile navigation

### Screen Readers

- Maintain semantic HTML structure
- Provide ARIA labels for responsive components
- Announce layout changes appropriately

### Zoom Support

- Support up to 200% zoom without layout breaking
- Maintain readability at all zoom levels
- Ensure no content is hidden when zoomed

## Implementation Priority

### Phase 1: Core Layouts (High Priority)
1. AppLayout responsive navigation
2. Dashboard page responsiveness
3. Scanner page responsiveness
4. Form responsiveness

### Phase 2: Components (Medium Priority)
5. Card components
6. Modal/Dialog components
7. Weather components
8. AI Assistant responsiveness

### Phase 3: Polish (Lower Priority)
9. Typography refinement
10. Spacing optimization
11. Animation adjustments
12. Performance optimization

## Dependencies

### Existing Dependencies

All required dependencies are already installed:
- `tailwindcss`: Responsive utility classes
- `framer-motion`: Responsive animations
- `react`: Core framework
- `@radix-ui/*`: Accessible responsive components

### No New Dependencies Required

This feature leverages existing tools and patterns.

## Future Enhancements

1. **Adaptive Loading**: Load different component versions based on device capabilities
2. **Container Queries**: Use CSS container queries for component-level responsiveness
3. **Responsive Images Service**: Implement automatic image optimization and serving
4. **Device-Specific Optimizations**: Tailor experiences for specific device types
5. **Progressive Web App Enhancements**: Improve PWA experience across devices

