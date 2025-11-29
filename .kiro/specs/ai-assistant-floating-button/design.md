# Design Document

## Overview

This feature adds a floating action button (FAB) to the user dashboard that provides quick access to the AI Assistant. The implementation will integrate seamlessly with the existing RiceGuard application architecture, following the established patterns for routing, styling, and component structure.

The AI Assistant already exists as a standalone component (`client/components/AIAssistant.tsx`) that renders as a floating chat interface. Currently, it displays a floating button when closed, but this button appears on all pages. This feature will add a dedicated FAB specifically on the Dashboard page that navigates to a dedicated AI Assistant page route, providing a more intentional and discoverable entry point for farmers.

## Architecture

### Component Structure

```
Dashboard Page (client/pages/Dashboard.tsx)
├── Existing Dashboard Content
└── AI Assistant FAB (new component)
    └── Navigates to → AI Assistant Page (new route)
```

### Routing Strategy

The implementation will follow the existing routing pattern in `client/App.tsx`:

1. Create a new route `/ai-assistant` that renders the AI Assistant in a full-page context
2. Add a floating action button on the Dashboard page that navigates to this route
3. The AI Assistant page will use the `AppLayout` wrapper for consistency

## Components and Interfaces

### 1. AIAssistantFAB Component

**Location:** `client/components/AIAssistantFAB.tsx`

A new reusable component that renders a floating action button.

```typescript
interface AIAssistantFABProps {
  onClick: () => void;
  className?: string;
}

export function AIAssistantFAB({ onClick, className }: AIAssistantFABProps): JSX.Element
```

**Responsibilities:**
- Render a circular floating button with AI/chat icon
- Handle click events to trigger navigation
- Apply consistent styling with the app's design system
- Provide hover and focus states for accessibility
- Position itself in the bottom-right corner with appropriate spacing

### 2. AIAssistantPage Component

**Location:** `client/pages/AIAssistantPage.tsx`

A new page component that wraps the existing AIAssistant component for full-page display.

```typescript
export default function AIAssistantPage(): JSX.Element
```

**Responsibilities:**
- Render the AIAssistant component in a full-page context
- Provide a back button or close action to return to dashboard
- Ensure proper layout and spacing
- Handle page title and metadata

### 3. Dashboard Integration

**Modifications to:** `client/pages/Dashboard.tsx`

Add the FAB component to the Dashboard page.

```typescript
import { AIAssistantFAB } from "@/components/AIAssistantFAB";
import { useNavigate } from "react-router-dom";

// Inside Dashboard component:
const navigate = useNavigate();

const handleAIAssistantClick = () => {
  navigate('/ai-assistant');
};

// In JSX, after existing content:
<AIAssistantFAB onClick={handleAIAssistantClick} />
```

### 4. Routing Configuration

**Modifications to:** `client/App.tsx`

Add the new route for the AI Assistant page.

```typescript
import AIAssistantPage from "./pages/AIAssistantPage";

// In Routes:
<Route path="/ai-assistant" element={<AppLayout><AIAssistantPage /></AppLayout>} />
```

## Data Models

No new data models are required. This feature is purely UI-based and leverages existing navigation and component patterns.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: FAB Visibility on Dashboard

*For any* render of the Dashboard page, the floating action button should be present in the DOM and visible to the user.

**Validates: Requirements 1.1**

### Property 2: FAB Position Consistency

*For any* viewport size, the floating action button should maintain its position in the bottom-right corner with consistent spacing from screen edges.

**Validates: Requirements 1.2, 2.2**

### Property 3: Navigation on Click

*For any* click event on the floating action button, the application should navigate to the `/ai-assistant` route.

**Validates: Requirements 1.3**

### Property 4: Icon Rendering

*For any* render of the floating action button, it should display a recognizable AI or chat icon (MessageSquare or similar).

**Validates: Requirements 1.4**

### Property 5: Touch Target Size

*For any* mobile viewport, the floating action button should have a minimum touch target size of 48x48 pixels.

**Validates: Requirements 2.1**

### Property 6: Z-Index Hierarchy

*For any* page state, the floating action button should have a higher z-index than other interactive elements to remain accessible.

**Validates: Requirements 2.4**

### Property 7: Accessibility Attributes

*For any* render of the floating action button, it should include an aria-label attribute with descriptive text.

**Validates: Requirements 4.1**

### Property 8: Keyboard Navigation

*For any* keyboard navigation sequence, the floating action button should be focusable and activatable via Enter or Space key.

**Validates: Requirements 4.2, 4.3**

## Error Handling

### Navigation Errors

If navigation fails (unlikely with client-side routing), the application should:
- Log the error to the console
- Display a toast notification to the user
- Remain on the current page without breaking the UI

### Component Rendering Errors

If the FAB component fails to render:
- Use React error boundaries to catch and handle errors
- Gracefully degrade by not showing the button rather than breaking the page
- Log errors for debugging

## Testing Strategy

### Unit Testing

**Framework:** Vitest with React Testing Library (already configured in the project)

**Unit Test Coverage:**

1. **AIAssistantFAB Component Tests** (`client/components/AIAssistantFAB.test.tsx`)
   - Renders with correct icon
   - Calls onClick handler when clicked
   - Applies custom className prop
   - Has correct aria-label
   - Is keyboard accessible (Enter/Space keys)

2. **AIAssistantPage Component Tests** (`client/pages/AIAssistantPage.test.tsx`)
   - Renders AIAssistant component
   - Renders back/close button
   - Navigation back to dashboard works

3. **Dashboard Integration Tests** (`client/pages/Dashboard.test.tsx`)
   - FAB is rendered on the dashboard
   - FAB click triggers navigation to `/ai-assistant`

### Property-Based Testing

**Framework:** fast-check (to be installed)

**Configuration:** Each property-based test should run a minimum of 100 iterations.

**Property-Based Test Coverage:**

1. **Property Test: FAB Position Consistency** (`client/components/AIAssistantFAB.test.tsx`)
   - **Feature: ai-assistant-floating-button, Property 2: FAB Position Consistency**
   - Generate random viewport dimensions
   - Verify FAB maintains bottom-right position with consistent spacing
   - **Validates: Requirements 1.2, 2.2**

2. **Property Test: Touch Target Size** (`client/components/AIAssistantFAB.test.tsx`)
   - **Feature: ai-assistant-floating-button, Property 5: Touch Target Size**
   - Generate random mobile viewport sizes
   - Verify FAB dimensions are at least 48x48 pixels
   - **Validates: Requirements 2.1**

3. **Property Test: Accessibility Attributes** (`client/components/AIAssistantFAB.test.tsx`)
   - **Feature: ai-assistant-floating-button, Property 7: Accessibility Attributes**
   - Generate random component props
   - Verify aria-label is always present and non-empty
   - **Validates: Requirements 4.1**

### Integration Testing

Integration tests will verify the complete user flow:
- User lands on dashboard
- User sees and clicks FAB
- User is navigated to AI Assistant page
- User can return to dashboard

## Implementation Notes

### Styling Approach

The FAB will use Tailwind CSS classes consistent with the existing design system:

```typescript
className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 z-50 transition-all duration-300"
```

Key styling considerations:
- `bottom-24`: Positions above the bottom navigation bar (which is at `bottom-0`)
- `right-4`: Consistent right margin
- `h-14 w-14`: Meets minimum touch target size (56px)
- `z-50`: High z-index to stay above other content
- `shadow-xl`: Prominent shadow for depth
- `transition-all`: Smooth hover effects

### Animation

The FAB will include subtle animations:
- Fade-in on mount: `animate-in fade-in duration-300`
- Scale on hover: `hover:scale-105`
- Pulse effect (optional): Can add `animate-pulse` for attention

### Responsive Behavior

- **Mobile (< 768px):** Full FAB functionality with touch-optimized size
- **Tablet/Desktop (≥ 768px):** Same FAB with hover states

### Accessibility Enhancements

1. **ARIA Labels:** `aria-label="Open AI Assistant"` (with Bangla translation)
2. **Keyboard Focus:** Visible focus ring using `focus-visible:ring-2 focus-visible:ring-ring`
3. **Color Contrast:** Use primary color which already meets WCAG AA standards
4. **Screen Reader:** Button role is implicit, but ensure descriptive label

### Localization

The FAB should support both English and Bangla:

```typescript
const { language } = useLanguage();
const ariaLabel = language === "bn" ? "এআই সহকারী খুলুন" : "Open AI Assistant";
```

### Alternative Approach: Modal vs. Page

**Decision:** Use a dedicated page route (`/ai-assistant`) rather than a modal.

**Rationale:**
- Provides a focused, distraction-free experience
- Allows deep linking and browser history navigation
- Easier to implement back navigation
- Consistent with existing app navigation patterns
- Better for mobile UX (full screen)

If a modal approach is preferred in the future, the AIAssistant component already has modal-like behavior built-in, so the FAB could simply trigger `setIsOpen(true)` on a globally accessible AIAssistant instance.

## Dependencies

### New Dependencies

- `fast-check`: Property-based testing library for TypeScript
  ```bash
  npm install --save-dev fast-check @fast-check/vitest
  ```

### Existing Dependencies

- `react-router-dom`: Already installed, used for navigation
- `lucide-react`: Already installed, provides MessageSquare icon
- `@/components/ui/button`: Existing UI component (may be used as base)
- `framer-motion`: Already installed, can be used for animations (optional)

## Performance Considerations

- **Bundle Size:** Minimal impact, FAB is a small component (~2KB)
- **Rendering:** FAB only renders on Dashboard, no performance impact on other pages
- **Navigation:** Client-side routing is instant, no network requests
- **Animations:** CSS transitions are hardware-accelerated

## Security Considerations

No security implications. This is a pure UI feature with no data handling or API calls.

## Future Enhancements

1. **Badge Notification:** Show a badge on the FAB when there are new AI features or tips
2. **Tooltip:** Add a tooltip on hover explaining the FAB's purpose
3. **Contextual AI:** Pre-populate AI Assistant with context from the current dashboard state
4. **Multiple Entry Points:** Add FAB to other pages (Scanner, Health Journal) with contextual prompts
5. **Animation Variations:** Add more sophisticated animations (e.g., morphing icon, ripple effect)
