<div align="center">
  
# FitYo'l

### AI-Powered Calorie & Nutrition Tracking

[![React](https://img.shields.io/badge/React-19.2-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini_AI-4285f4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<img width="100%" alt="FitYo'l Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

[Live Demo](https://ai.studio/apps/drive/1kGO3OmV8z9p93nB_g8u-oIHToqpUNWXw) • [Report Bug](https://github.com/ctimothe/calorie-tracker/issues) • [Request Feature](https://github.com/ctimothe/calorie-tracker/issues)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Usage](#-usage)
- [API Integration](#-api-integration)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)
- [License](#-license)
- [Contact](#-contact)

---

## Overview

**FitYo'l** is a premium, AI-powered nutrition companion that leverages Google's Gemini AI to analyze food images and provide accurate nutritional information. Simply upload a photo of your meal, and our AI analyzes portion sizes, ingredients, and cooking methods to deliver realistic calorie counts and macro breakdowns.

### Why FitYo'l?

Traditional calorie counting is tedious and often inaccurate. FitYo'l eliminates manual entry by using state-of-the-art computer vision and natural language processing to:

- **Accurately identify** multiple food items in a single image
- **Estimate portion sizes** based on visual context
- **Analyze cooking methods** to adjust calorie calculations
- **Generate comprehensive** macro and micronutrient breakdowns
- **Provide instant results** in under 3 seconds

---

## Key Features

### AI-Powered Analysis
- **Multi-model AI detection** using Google Gemini's latest vision models
- **Context-aware estimation** considering plate size, food density, and preparation methods
- **Ingredient breakdown** with detailed nutritional composition

### Rich Data Visualization
- **Interactive macro charts** using Recharts for protein, carbs, and fats
- **Micronutrient tracking** including vitamins and minerals
- **Dietary insights** with health recommendations

### Modern UX/UI
- **Responsive design** optimized for mobile and desktop
- **Drag-and-drop** image upload with real-time preview
- **Smooth animations** and loading states for better user experience
- **Accessibility-first** approach with ARIA labels and keyboard navigation

### Performance Optimized
- **Sub-3-second** image analysis
- **Code splitting** and lazy loading for faster initial load
- **Optimized bundle size** with tree-shaking and minification

---

## Tech Stack

### Frontend
- **React 19.2** - UI library with latest concurrent features
- **TypeScript 5.8** - Type-safe development
- **Vite 6.2** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework

### AI & Data Visualization
- **Google Gemini AI** - Advanced vision and language models
- **Recharts 3.5** - Composable charting library
- **Lucide React** - Beautiful open-source icons

### Development Tools
- **ESLint** - Code quality and consistency
- **Prettier** - Code formatting
- **TypeScript Compiler** - Type checking and transpilation

---

## Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Google Gemini API Key** ([Get one here](https://ai.google.dev/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ctimothe/calorie-tracker.git
   cd calorie-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

---

## Project Structure

```
calorie-tracker/
├── components/              # React components
│   ├── UploadArea.tsx      # Image upload interface
│   ├── NutritionCard.tsx   # Results display component
│   └── MacroChart.tsx      # Data visualization
├── services/               # Business logic & API calls
│   └── geminiService.ts    # Gemini AI integration
├── types.ts               # TypeScript type definitions
├── App.tsx                # Main application component
├── index.tsx              # Application entry point
├── vite.config.ts         # Vite configuration
├── tsconfig.json          # TypeScript configuration
└── package.json           # Dependencies and scripts
```

---

## Usage

### Basic Workflow

1. **Upload Image**
   - Drag and drop a food image, or
   - Click to browse and select from your device

2. **AI Analysis**
   - The app sends your image to Gemini AI
   - Computer vision analyzes food items and portions
   - NLP extracts nutritional data

3. **View Results**
   - Total calories and macro breakdown
   - Individual food items with portion estimates
   - Health insights and recommendations

### Supported Image Formats
- JPEG/JPG
- PNG
- WebP
- HEIC/HEIF (on supported browsers)

### Tips for Best Results
- Use good lighting
- Capture entire plate/meal
- Include common objects (utensils, plate) for scale
- Avoid extreme angles or blurry images

---

## API Integration

### Gemini Service Architecture

```typescript
// services/geminiService.ts
export async function analyzeFoodImage(
  base64: string, 
  mimeType: string
): Promise<AnalysisResult>
```

**Request Flow:**
1. Image encoded to base64
2. Sent to Gemini Vision API with custom prompt
3. AI analyzes image and generates structured JSON
4. Response parsed and validated
5. Results rendered in UI

**Response Structure:**
```typescript
interface AnalysisResult {
  totalCalories: number;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
  };
  foods: Array<{
    name: string;
    portion: string;
    calories: number;
  }>;
  healthInsights: string;
}
```

---

## Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Code Quality

```bash
# Type checking
npm run type-check

# Linting (if configured)
npm run lint

# Format code (if configured)
npm run format
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API Key | Yes |

---

## Deployment

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

### Deploy to Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 5173
CMD ["npm", "run", "preview"]
```

---

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

---

## Roadmap

### Current Version: v0.1.0

### Planned Features

- User Authentication - Save meal history and track progress
- Meal Planning - AI-powered meal suggestions based on goals
- Barcode Scanner - Quick lookup for packaged foods
- Recipe Import - Analyze recipes from URLs
- Export Data - CSV/PDF reports of nutritional intake
- Multi-language Support - Internationalization (i18n)
- Dark Mode - Theme customization
- Progressive Web App - Offline functionality
- Social Features - Share meals and progress
- Integration with Fitness Apps - Apple Health, Google Fit, MyFitnessPal

### In Progress

- **Enhanced AI Accuracy** - Fine-tuning prompts for better results
- **Performance Optimization** - Reducing bundle size and load times
- **Mobile App** - React Native version
- **Backend API** - Node.js/Express server for data persistence

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Contact

**Christophe Timothe** - [@ctimothe](https://github.com/ctimothe)

Project Link: [https://github.com/ctimothe/calorie-tracker](https://github.com/ctimothe/calorie-tracker)

---

## Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - Powering the AI analysis
- [React Team](https://react.dev/) - Amazing UI library
- [Recharts](https://recharts.org/) - Beautiful data visualization
- [Lucide Icons](https://lucide.dev/) - Clean and modern icons
- [Vite](https://vitejs.dev/) - Lightning-fast build tool

---

<div align="center">
  
### Star this repo if you find it helpful

Made by [Christophe Timothe](https://github.com/ctimothe)

**Active Development** • **Open for Contributions** • **Portfolio Project**

</div>
