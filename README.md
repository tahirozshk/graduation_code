# Prof. Dux - Practice More Module (Graduation Project)

A sophisticated Next.js microservice UI for the **Prof. Dux** educational platform, designed to provide students with personalized, AI-driven practice sessions based on their performance analytics.

## 🚀 Key Features

*   **Smart Practice Engine**: Implements the "Practice Engine Module" logic, identifying student weak points based on 4 distinct data inputs.
*   **AI-Dynamic Analysis**: Visualizes the AI analysis process (Görsel 2) with real-time status tracking across Lecture Lists, Resources, Marks, and Past Quizzes.
*   **Interactive Practice Interface**: A premium quiz environment (Görsel 3) featuring:
    *   Dynamic mathematical graphs (SVG) and LaTeX-style formulas.
    *   **AI Coach & Resources Sidebar**: Personalized feedback based on historical mistakes and integrated study materials.
    *   Progress tracking and Focused Learner analytics.
*   **Professional UI/UX**:
    *   Collapsible Sidebar with modern Lucide icons.
    *   "Borgirux" design theme (Deep Burgundy & Premium White).
    *   Full responsiveness and smooth state transitions.

## 🛠️ Technology Stack

*   **Framework**: Next.js 15+ (App Router)
*   **Language**: TypeScript (Strongly typed data models)
*   **Styling**: Vanilla CSS (Custom design tokens & animations)
*   **Icons**: Lucide React
*   **State Management**: Custom Logic Store & React Hooks

## 🏗️ Backend Architecture (Integrated)

The system is architected to be "Plug-and-Play" for your Dux Backend APIs.

### The 4 Data Inputs (Image 4 Logic)
1.  **Lecture List**: Fetches the hierarchy of topics.
2.  **Lecture Resources**: Retrieves relevant PDFs, slides, and hints.
3.  **Student Marks**: Analyzes scores to identify weak topics.
4.  **Past Performance**: References tricky question patterns from previous quizzes.

### Centralized API Configuration
Manage all your endpoints from a single professional source:
-   **File**: `lib/api-config.ts`
-   **Service**: `lib/api-service.ts`

## 📂 Project Structure

```text
├── app/                  # Next.js App Router (Pages & Layouts)
│   ├── practice/         # Dynamic Practice Session Page
│   └── globals.css       # Core Design Tokens & Global Styles
├── components/           # Reusable UI Components
│   └── LayoutShell.tsx   # Main Shell with Collapsible Sidebar
├── lib/                  # Business Logic & API Layer
│   ├── api-config.ts     # Central API Configuration (URLs/Endpoints)
│   ├── api-service.ts    # Data Fetching Layer (4 Inputs)
│   ├── practice-engine.ts # AI Recommendation Logic
│   └── store.ts          # State Persistence between Dashboard & Practice
└── types/                # TypeScript Interfaces & Data Models
```

## 🏁 Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

3.  **View the application**:
    Open [http://localhost:3000](http://localhost:3000)

## 🔧 Deployment & Integration

To connect to your live backend:
1.  Update `BASE_URL` in `lib/api-config.ts`.
2.  Uncomment the `axios` or `fetch` calls in `lib/api-service.ts`.
3.  The `PracticeEngine` will automatically start using your real data to generate personalized sessions.

---
*Created as part of a Graduation Project for NEAR EAST UNIVERSITY INTERNATIONAL RESEARCH CENTER FOR AI AND IOT.*
