# Design Document: Multi-Crop Support

## Overview

This design document outlines the implementation of multi-crop support for the agricultural management application. Currently, the system only supports rice (ধান), but this feature will enable farmers to track various crop types including wheat, jute, vegetables, pulses, and more. The solution maintains backward compatibility with existing data while providing a flexible, maintainable approach for adding new crop types.

## Architecture

### High-Level Architecture

The multi-crop support feature follows a data-driven approach where crop types are defined in a centralized configuration file. This allows for easy maintenance and future extensibility without requiring code changes.

```
┌─────────────────┐
│  Crop Config    │ ← Centralized crop type definitions
│  (mockData.ts)  │   (id, names, icons, metadata)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   UI Layer      │ ← Crop selection interface
│  (AddCrop.tsx)  │   (grid/list view, search)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Layer      │ ← Validation & storage
│  (api.ts)       │   (crop type validation)
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Database       │ ← MongoDB storage
│  (CropBatch)    │   (cropType: string)
└─────────────────┘
```

### Component Interaction Flow

1. **User selects crop type** → UI displays available crops from config
2. **User submits form** → Frontend validates selection
3. **API receives request** → Backend validates crop type is not empty
4. **Data stored** → MongoDB stores crop type as string
5. **Data retrieved** → UI displays crop with localized name and icon

## Components and Interfaces

### 1. Crop Type Configuration

**Location:** `client/data/mockData.ts`

**Interface:**
```typescript
export interface CropType {
  id: string;              // Unique identifier (e.g., "rice", "wheat")
  label_bn: string;        // Bengali name
  label_en: string;        // English name
  icon: string;            // Emoji or icon representation
  category?: string;       // Optional: "grain", "vegetable", "pulse"
  description_bn?: string; // Optional: Bengali description
  description_en?: string; // Optional: English description
}
```

**Initial Crop Types:**
```typescript
export const cropTypes: CropType[] = [
  {
    id: "rice",
    label_bn: "ধান",
    label_en: "Rice/Paddy",
    icon: "🌾",
    category: "grain"
  },
  {
    id: "wheat",
    label_bn: "গম",
    label_en: "Wheat",
    icon: "🌾",
    category: "grain"
  },
  {
    id: "jute",
    label_bn: "পাট",
    label_en: "Jute",
    icon: "🌿",
    category: "fiber"
  },
  {
    id: "potato",
    label_bn: "আলু",
    label_en: "Potato",
    icon: "🥔",
    category: "vegetable"
  },
  {
    id: "tomato",
    label_bn: "টমেটো",
    label_en: "Tomato",
    icon: "🍅",
    category: "vegetable"
  },
  {
    id: "lentil",
    label_bn: "মসুর ডাল",
    label_en: "Lentil",
    icon: "🫘",
    category: "pulse"
  },
  {
    id: "mustard",
    label_bn: "সরিষা",
    label_en: "Mustard",
    icon: "🌻",
    category: "oilseed"
  },
  {
    id: "corn",
    label_bn: "ভুট্টা",
    label_en: "Corn/Maize",
    icon: "🌽",
    category: "grain"
  }
];
```

### 2. UI Component Updates

**Location:** `client/pages/AddCrop.tsx`

**Changes Required:**

1. **Add crop type state:**
```typescript
const [cropType, setCropType] = useState("");
```

2. **Replace hardcoded crop type section with selection UI:**
```typescript
<div className="space-y-2">
  <Label text={t("crop.crop_type")} icon={<Sprout className="w-4 h-4" />} />
  <div className="grid grid-cols-2 gap-3">
    {cropTypes.map((crop) => (
      <button
        key={crop.id}
        type="button"
        onClick={() => setCropType(crop.id)}
        className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col gap-1 ${
          cropType === crop.id 
            ? "border-primary bg-primary/5 ring-1 ring-primary" 
            : "border-muted bg-white hover:border-primary/50"
        }`}
      >
        <div className="text-2xl">{crop.icon}</div>
        <div className="font-bold text-sm text-foreground">
          {language === "bn" ? crop.label_bn : crop.label_en}
        </div>
      </button>
    ))}
  </div>
</div>
```

3. **Add validation:**
```typescript
if (!cropType) {
  toast({ 
    title: language === "bn" ? "ফসল নির্বাচন করুন" : "Select crop type", 
    variant: "destructive" 
  });
  return;
}
```

4. **Update form submission:**
```typescript
const cropData: CreateCropBatchRequest = {
  farmerId: farmerId,
  cropType: cropType, // Use selected crop type instead of hardcoded "ধান"
  stage: stage,
  // ... rest of the fields
};
```

### 3. Localization Updates

**Location:** `client/locales/strings.ts`

**New Translations:**
```typescript
crop: {
  // ... existing fields
  select_crop: "ফসল নির্বাচন করুন",
  select_crop_en: "Select Crop Type",
  search_crop: "ফসল খুঁজুন",
  search_crop_en: "Search crops",
  // Individual crop names (if needed for special cases)
  rice: "ধান",
  wheat: "গম",
  jute: "পাট",
  potato: "আলু",
  // ... etc
}
```

### 4. Display Component Updates

**Location:** Various dashboard and inventory display components

**Changes:**
- Update crop batch display to show crop type from config
- Add helper function to get crop display info:

```typescript
export function getCropDisplay(cropTypeId: string, language: 'bn' | 'en') {
  const crop = cropTypes.find(c => c.id === cropTypeId);
  if (!crop) {
    // Fallback for legacy data or unknown crops
    return {
      name: cropTypeId,
      icon: "🌱"
    };
  }
  return {
    name: language === 'bn' ? crop.label_bn : crop.label_en,
    icon: crop.icon
  };
}
```

## Data Models

### Existing Schema (No Changes Required)

The existing `CropBatchSchema` already supports flexible crop types:

```typescript
export const CropBatchSchema = z.object({
  // ... other fields
  cropType: z.string().min(1, 'Crop type is required'),
  // ... other fields
});
```

**Rationale:** The schema uses a flexible string type, which allows:
- Backward compatibility with existing "ধান" entries
- Forward compatibility with new crop type IDs
- No database migration required

### Data Migration Strategy

**No migration needed** because:
1. Existing data uses `cropType: "ধান"` which remains valid
2. New entries will use crop type IDs like `"rice"`, `"wheat"`, etc.
3. Display layer handles both formats through the `getCropDisplay` helper

**Backward Compatibility:**
```typescript
export function getCropDisplay(cropTypeId: string, language: 'bn' | 'en') {
  // Handle legacy Bengali crop names
  if (cropTypeId === "ধান") {
    return { name: language === 'bn' ? "ধান" : "Rice", icon: "🌾" };
  }
  
  // Handle new crop type IDs
  const crop = cropTypes.find(c => c.id === cropTypeId);
  if (!crop) {
    return { name: cropTypeId, icon: "🌱" };
  }
  return {
    name: language === 'bn' ? crop.label_bn : crop.label_en,
    icon: crop.icon
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Crop configuration completeness
*For any* crop type in the configuration, it must have a non-empty id, label_bn, label_en, and icon field
**Validates: Requirements 1.1, 3.3**

### Property 2: Crop type storage consistency
*For any* valid crop type selection, when a crop batch is created, the stored crop batch should contain the selected crop type identifier
**Validates: Requirements 1.2**

### Property 3: Empty crop type rejection
*For any* crop batch creation request with an empty crop type field, the system should reject the request and return a validation error
**Validates: Requirements 1.3, 6.1**

### Property 4: Language-specific name display
*For any* crop batch and language preference (bn or en), the displayed crop name should match the language preference (Bengali name for 'bn', English name for 'en')
**Validates: Requirements 1.4**

### Property 5: Icon presence for all crops
*For any* crop type displayed in the UI (selection or inventory), the system should display the crop's icon alongside its name
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 6: Non-empty string acceptance
*For any* non-empty string value used as a crop type, the backend validation should accept it
**Validates: Requirements 6.2**

### Property 7: Search filter correctness
*For any* search query string and crop list, the filtered results should only include crops whose Bengali or English name contains the search string (case-insensitive)
**Validates: Requirements 5.2**

### Property 8: Search clear round-trip
*For any* crop list, applying a search filter and then clearing it should return the complete original crop list
**Validates: Requirements 5.3**

### Property 9: User crop history tracking
*For any* farmer who has created crop batches, the system should maintain a record of which crop types that farmer has previously used
**Validates: Requirements 7.1**

### Property 10: Full crop list availability
*For any* user viewing the crop selection interface, regardless of their history, all available crop types from the configuration should be accessible
**Validates: Requirements 7.3**

## Error Handling

### Frontend Validation

1. **Empty Crop Type Selection:**
   - Error: "ফসল নির্বাচন করুন" / "Select crop type"
   - Trigger: User submits form without selecting a crop
   - Action: Show toast notification, prevent form submission

2. **Invalid Crop Type ID:**
   - Error: Fallback to generic display
   - Trigger: Crop type ID not found in configuration
   - Action: Display crop type string with generic icon 🌱

### Backend Validation

1. **Missing Crop Type:**
   - Error: 400 Bad Request - "Crop type is required"
   - Trigger: API receives request with empty cropType
   - Action: Return validation error response

2. **Database Errors:**
   - Error: 500 Internal Server Error
   - Trigger: Database write failure
   - Action: Log error, return generic error message

### Offline Mode Handling

When offline:
- Crop type selection works normally (config is local)
- Form submission queues the action with selected crop type
- Sync occurs when connection restored

## Testing Strategy

### Unit Tests

1. **Crop Configuration Tests:**
   - Test that all crop types have required fields (id, label_bn, label_en, icon)
   - Test that crop IDs are unique
   - Test that no crop names are empty strings

2. **Display Helper Tests:**
   - Test `getCropDisplay` with valid crop IDs
   - Test `getCropDisplay` with legacy crop names ("ধান")
   - Test `getCropDisplay` with invalid/unknown crop IDs
   - Test language switching (bn/en)

3. **Validation Tests:**
   - Test form validation rejects empty crop type
   - Test form validation accepts valid crop type
   - Test backend schema validation

### Property-Based Tests

The model will implement property-based tests for the correctness properties defined above using a suitable PBT library for TypeScript (e.g., fast-check).

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with format: `**Feature: multi-crop-support, Property {number}: {property_text}**`

**Test Coverage:**
- Property 1: Generate random crop configurations, verify all have bn/en names
- Property 2: Generate random crop batch requests, verify empty crop types are rejected
- Property 3: Generate random crop types and languages, verify icon consistency
- Property 4: Generate random crop types and languages, verify name matches language
- Property 5: Generate random search queries and crop lists, verify filter correctness
- Property 6: Verify new crops in config appear in UI without code changes
- Property 7: Generate legacy crop type values, verify backward compatibility

### Integration Tests

1. **End-to-End Crop Addition:**
   - Select crop type → Fill form → Submit → Verify storage
   - Test with multiple crop types
   - Test in both Bengali and English

2. **Offline-Online Sync:**
   - Add crop while offline → Go online → Verify sync
   - Test with different crop types

3. **Dashboard Display:**
   - Add multiple crop types → View dashboard → Verify correct display
   - Test language switching with mixed crop types

### Manual Testing Checklist

- [ ] All crop types display correctly in Bengali
- [ ] All crop types display correctly in English
- [ ] Icons display for all crop types
- [ ] Touch targets are appropriate size on mobile
- [ ] Search/filter works (if implemented)
- [ ] Form validation prevents empty selection
- [ ] Offline mode works correctly
- [ ] Legacy data displays correctly
- [ ] Dashboard shows mixed crop types correctly

## Implementation Notes

### Phase 1: Core Implementation
1. Add crop type configuration to mockData.ts
2. Update AddCrop.tsx with selection UI
3. Add getCropDisplay helper function
4. Update form validation

### Phase 2: Display Updates
1. Update dashboard to use getCropDisplay
2. Update inventory list views
3. Add localization strings

### Phase 3: Enhancement (Optional)
1. Add search/filter functionality
2. Add crop categories/grouping
3. Track user's frequently used crops
4. Add crop-specific metadata (growing season, typical yield, etc.)

### Future Extensibility

The design supports future enhancements:
- **Crop-specific advisories:** Weather alerts tailored to crop type
- **Crop-specific disease detection:** Scanner can provide crop-specific diagnoses
- **Yield benchmarking:** Compare yields across crop types
- **Seasonal recommendations:** Suggest crops based on season and location
- **Market prices:** Integrate crop-specific market price data

## Security Considerations

1. **Input Validation:**
   - Frontend validates crop type selection
   - Backend validates crop type is not empty
   - No SQL injection risk (using MongoDB with proper escaping)

2. **Data Integrity:**
   - Crop type IDs are validated against configuration
   - Fallback handling for unknown crop types
   - No user-generated crop type IDs (selected from predefined list)

## Performance Considerations

1. **Configuration Loading:**
   - Crop types loaded once at app initialization
   - No API calls required for crop type list
   - Minimal memory footprint (~1KB for 20-30 crop types)

2. **UI Rendering:**
   - Grid layout with 2 columns for mobile optimization
   - Lazy loading not required (small dataset)
   - Search/filter operates on client-side (fast)

3. **Database Queries:**
   - No changes to existing query patterns
   - Crop type stored as indexed string field
   - No performance impact on existing operations

## Accessibility

1. **Visual Indicators:**
   - Icons provide visual cues for all literacy levels
   - Color contrast meets WCAG AA standards
   - Touch targets minimum 44x44px

2. **Language Support:**
   - Full Bengali and English support
   - Consistent terminology across UI
   - Clear labels for all interactive elements

3. **Error Messages:**
   - Clear, actionable error messages
   - Displayed in user's preferred language
   - Visual feedback for validation errors
