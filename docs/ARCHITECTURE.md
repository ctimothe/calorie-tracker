# NutriScan AI - Architecture Documentation

## System Overview

NutriScan AI is a single-page application (SPA) built with React and TypeScript that leverages Google's Gemini AI for food image analysis and nutritional estimation.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                       │
│                    (React Components)                    │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  UploadArea  │  │ NutritionCard│  │  MacroChart  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Application State                     │
│                  (React Hooks & Context)                 │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    Business Logic                        │
│                   (Service Layer)                        │
│                                                          │
│               ┌──────────────────────┐                   │
│               │  geminiService.ts    │                   │
│               └──────────────────────┘                   │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                   External Services                      │
│                                                          │
│            ┌──────────────────────────┐                  │
│            │   Google Gemini AI API   │                  │
│            └──────────────────────────┘                  │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. App.tsx (Main Container)
**Responsibility:** Application state management and routing logic

**State:**
- `state: AppState` - Current application state (IDLE, ANALYZING, SUCCESS, ERROR)
- `result: AnalysisResult | null` - AI analysis results
- `error: string | null` - Error messages

**Key Functions:**
- `handleImageSelected()` - Processes uploaded images
- `resetApp()` - Resets to initial state

### 2. UploadArea.tsx
**Responsibility:** Image upload and preview

**Features:**
- Drag-and-drop functionality
- File type validation
- Base64 encoding
- Visual feedback during upload

### 3. NutritionCard.tsx
**Responsibility:** Display analysis results

**Features:**
- Total calorie display
- Food item breakdown
- Macro distribution
- Health insights

### 4. MacroChart.tsx
**Responsibility:** Data visualization

**Features:**
- Pie chart for macronutrients
- Interactive tooltips
- Responsive sizing
- Custom color scheme

## Service Layer

### geminiService.ts

**Purpose:** Encapsulate all AI API interactions

**Main Function:**
```typescript
async function analyzeFoodImage(
  base64: string, 
  mimeType: string
): Promise<AnalysisResult>
```

**Process:**
1. Construct prompt for Gemini AI
2. Send image data with structured prompt
3. Parse JSON response
4. Validate and transform data
5. Return typed result

**Error Handling:**
- Network errors
- API rate limiting
- Invalid responses
- Malformed JSON

## Type System

### Core Types (types.ts)

```typescript
enum AppState {
  IDLE,
  ANALYZING,
  SUCCESS,
  ERROR
}

interface AnalysisResult {
  totalCalories: number;
  macros: MacroNutrients;
  foods: FoodItem[];
  healthInsights: string;
}

interface MacroNutrients {
  protein: number;
  carbs: number;
  fats: number;
}

interface FoodItem {
  name: string;
  portion: string;
  calories: number;
}
```

## Data Flow

### Upload → Analysis → Display

1. **User uploads image**
   - `UploadArea` component handles file input
   - Image converted to base64
   - `handleImageSelected()` called in `App.tsx`

2. **Image sent to AI**
   - `setState(AppState.ANALYZING)`
   - `analyzeFoodImage()` called from `geminiService`
   - Request sent to Gemini API

3. **AI processes image**
   - Computer vision analyzes food items
   - NLP generates nutritional estimates
   - Structured JSON response returned

4. **Results displayed**
   - Response parsed and validated
   - `setState(AppState.SUCCESS)`
   - `NutritionCard` renders results
   - `MacroChart` visualizes macros

## Build & Deployment

### Build Process (Vite)

```
Source Code (TypeScript + React)
        ↓
  Type Checking (tsc)
        ↓
  Transpilation (esbuild)
        ↓
  Bundling (Rollup)
        ↓
  Optimization (minification, tree-shaking)
        ↓
  Static Assets (dist/)
```

### Environment Configuration

- Development: `.env.local`
- Production: Environment variables in hosting platform
- Required: `VITE_GEMINI_API_KEY`

## Performance Optimizations

### Current
- Code splitting at route level
- Lazy loading of heavy components
- Optimized bundle size (~150KB gzipped)
- Image compression before API call

### Planned
- Service Worker for offline support
- IndexedDB for local caching
- Virtual scrolling for large lists
- Memoization of expensive calculations

## Security Considerations

### Current
- API key stored in environment variables
- Client-side input validation
- HTTPS-only communication
- No sensitive data stored

### Planned
- Rate limiting on client
- Content Security Policy headers
- CORS configuration
- User authentication

## Scalability

### Frontend
- Stateless components enable easy scaling
- No client-side database dependencies
- CDN-ready static assets

### Backend (Future)
- Microservices architecture planned
- API gateway for request routing
- Database sharding for user data
- Redis caching layer

## Testing Strategy

### Unit Tests
- Component rendering
- Service layer functions
- Type validation
- Error handling

### Integration Tests
- End-to-end user flows
- API integration
- State management

### Performance Tests
- Bundle size monitoring
- Lighthouse scores
- Load time optimization

## Monitoring & Logging

### Planned Integration
- Error tracking (Sentry)
- Analytics (Google Analytics / Plausible)
- Performance monitoring (Web Vitals)
- User feedback collection

---

**Last Updated:** February 2, 2026  
**Version:** 0.1.0  
**Author:** Christophe Timothe
