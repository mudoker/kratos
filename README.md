# KRATOS: Personal Strength & Physique OS

Kratos is a specialized strength planning and physique management system. It is designed to act as a high-performance operating system for your training, providing data-driven stimulus analytics and automated progression tracking.

> **Note:** This system is currently optimized for a single-user personal environment. All training plans, personal records, and biological data are scoped strictly to the authenticated user.

## 🛠 Features

### 📊 Biological Stimulus Analytics
*   **Weighted Stimulus Heatmap:** A shared anatomy component that visualizes muscle group focus using a non-monochrome intensity scale.
*   **Scientific Weighting:** Logic distinguishes between primary movers (100% credit) and secondary movers (20% credit) to prevent "ghost volume" from drowning out target muscle data.
*   **Absolute Volume Thresholds:** Stimulus is rated (1/4 to 4/4) based on absolute science-backed weekly set counts, ensuring your data is biologically accurate regardless of the plan.
*   **Interactive Interaction:** Brighter hover effects provide immediate feedback when inspecting specific muscle regions.

### 🏋️ Intelligent Plan Builder
*   **Vertical Split Library:** A collapsible, drag-and-drop reorderable library of training phases.
*   **Auto-Save Persistence:** Features a debounced auto-save (800ms) that persists your library order as you organize.
*   **Markdown Export:** Export any training split as a clean, structured `.md` document for external documentation.
*   **Multi-Plan Context:** The dashboard allows instant toggling between multiple splits to compare stimulus targets.

### 📈 Progression Lab
*   **Automatic PR Extraction:** Real-time detection of personal records (weight or reps) directly from logged workout sessions.
*   **Dynamic Visualizations:** Professional area charts (`recharts`) tracking strength trajectory, baseline-to-peak growth, and data density.
*   **Workout Studio:** Granular, set-by-set logging with support for weights, reps, and specific execution notes.

### ⚙️ Deep Context Settings
*   **Comprehensive Profiling:** Records personal identity, biological baseline (age/weight/height), recovery metrics (sleep/activity), and critical medical/injury context.
*   **AI Coach Integration:** The AI coach uses this entire context to anchor advice, audits, and suggestions.

---

## 🚀 Getting Started

### Prerequisites
*   **Bun:** The fast JavaScript all-in-one toolkit.
*   **Docker:** For running the PostgreSQL database.
*   **Google AI API Key:** For the Gemini 2.0 Flash coaching intelligence.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/mudoker/kratos.git
    cd kratos
    ```

2.  **Install dependencies:**
    ```bash
    bun install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the root directory (refer to `.env.example`):
    ```env
    DATABASE_URL="postgresql://kratos:kratos@localhost:5432/kratos"
    GOOGLE_GENERATIVE_AI_API_KEY="your_api_key_here"
    BETTER_AUTH_SECRET="your_auth_secret"
    NEXT_PUBLIC_BETTER_AUTH_URL="http://localhost:3003"
    ```

4.  **Database Startup:**
    Kratos uses Docker Compose to manage the database state.
    ```bash
    just db-up
    # or
    docker compose up -d db
    ```

5.  **Run Development Server:**
    ```bash
    just dev
    # or
    bun run dev
    ```

6.  **Production Build:**
    ```bash
    bun run build
    ```

---

## 🧪 Technical Stack
*   **Framework:** Next.js 15 (App Router)
*   **Language:** TypeScript
*   **Database:** PostgreSQL (with Kysely & pg-pool)
*   **Styling:** Tailwind CSS 4
*   **Animations:** Framer Motion
*   **Charts:** Recharts
*   **Auth:** Better Auth

---
*Stay sharp. Lift heavy. Get those gains.*
