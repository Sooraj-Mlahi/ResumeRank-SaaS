# Design Guidelines: AI Resume Ranking SaaS Platform

## Design Approach

**System Selected**: Material Design 3 with professional SaaS refinements
**Justification**: Data-intensive application requiring clear hierarchy, strong feedback patterns, and enterprise credibility. Material's component library excels at forms, tables, and dashboard layouts while maintaining visual polish.

**Key Design Principles**:
- Trust & Professionalism: Clean, structured layouts that inspire confidence
- Data Clarity: Information hierarchy optimized for scanning and decision-making
- Efficiency: Minimal clicks to core actions (fetch CVs, rank, view results)

## Typography

**Font Families**:
- Primary: Inter (Google Fonts) - UI text, buttons, labels
- Display: Inter (600-700 weight) - Headings, page titles
- Mono: JetBrains Mono - Code snippets, file names, email addresses

**Hierarchy**:
- H1: text-4xl font-bold (Dashboard titles, page headers)
- H2: text-2xl font-semibold (Section headers)
- H3: text-xl font-semibold (Card titles, subsections)
- Body: text-base (Primary content, descriptions)
- Small: text-sm (Metadata, timestamps, helper text)
- Micro: text-xs (Tags, labels, badges)

## Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16
- Component padding: p-4 or p-6
- Section spacing: mb-8 or mb-12
- Card gaps: gap-4 or gap-6
- Page margins: px-4 md:px-8

**Grid System**:
- Dashboard: max-w-7xl mx-auto
- Two-column layouts: grid-cols-1 lg:grid-cols-2 gap-6
- Three-column stats: grid-cols-1 md:grid-cols-3 gap-4
- Tables: Full-width with horizontal scroll on mobile

## Component Library

### Navigation
**Top Navigation Bar**:
- Fixed header with glass-morphism effect (backdrop-blur-md)
- Logo left, user menu right
- Navigation links center (Dashboard, Fetch CVs, Rank Resumes, Results)
- Height: h-16
- Includes theme toggle (sun/moon icon)

### Authentication Pages
**Login Page**:
- Centered card layout (max-w-md mx-auto)
- Brand logo at top
- Two prominent OAuth buttons: "Continue with Google" and "Continue with Microsoft"
- Each button with provider logo icon
- Subtle background pattern or gradient

### Dashboard Cards
**Stats Cards**:
- Elevated cards with subtle shadow (shadow-md)
- Rounded corners (rounded-lg)
- Padding: p-6
- Icon + Label + Large Number layout
- Hover: Subtle lift effect (hover:shadow-lg transition-shadow)

**Action Cards**:
- Clear primary action buttons
- Description text explaining feature
- Icon representation of action
- Call-to-action aligned right

### Data Tables
**Resume Results Table**:
- Sticky header row
- Alternating row backgrounds for scannability
- Columns: Rank, Candidate Name, Score (with progress bar), Strengths (truncated), Actions
- Score visualization: Horizontal progress bar with gradient (0-100)
- Action buttons: View Details (eye icon), Download CV (download icon)
- Sortable column headers
- Pagination footer

**Table Styling**:
- Border between rows (border-b)
- Padding: px-6 py-4
- Hover state: Background highlight
- Responsive: Horizontal scroll on mobile with sticky first column

### Forms
**Job Prompt Form** (Rank Resumes page):
- Large textarea for job description (min-h-32)
- Character counter
- Submit button: "Analyze & Rank Resumes"
- Optional filters: Experience level, location preferences
- Clear spacing between fields (space-y-4)

**CV Fetch Settings**:
- Email provider toggle (Gmail/Outlook)
- Date range picker
- Search keywords input
- "Fetch CVs" primary button

### Modals & Details Views
**Resume Detail Modal**:
- Overlay with backdrop blur
- Large modal (max-w-4xl)
- Two-column layout: Left (CV preview/text), Right (Scoring details)
- Sections: Score breakdown, Strengths list, Weaknesses list, Full extracted text
- Download button prominent
- Close button (X) top-right

### Status Indicators
**Processing States**:
- Loading spinner with text feedback
- Progress bars for batch operations
- Toast notifications for success/errors (top-right position)

**Score Badges**:
- 80-100: Green badge
- 60-79: Blue badge
- 40-59: Amber badge
- 0-39: Red badge
- Rounded-full, px-3 py-1, font-semibold

## Page-Specific Layouts

### Dashboard (Home)
- Stats grid at top (3 cards): Total CVs Fetched, Last Analysis Date, Highest Score
- Quick action cards below: "Fetch New CVs" and "Rank Resumes"
- Recent activity feed

### Fetch CVs Page
- Two-column: Left (connection status + settings form), Right (preview of last fetch)
- Connection indicator with provider logo
- Fetch history table below

### Rank Resumes Page
- Prominent job prompt textarea centered
- "Analyze" button below
- Previously used prompts sidebar (optional quick access)

### Results Page
- Full-width table with all ranked resumes
- Filter bar above table (score range, keywords)
- Export functionality (CSV download button)

## Light/Dark Mode

**Implementation**:
- Dark mode: slate-900 backgrounds, slate-100 text
- Light mode: white/gray-50 backgrounds, gray-900 text
- Cards: Light mode (white), Dark mode (slate-800)
- Smooth theme transition: transition-colors duration-200
- Persist preference in localStorage

## Animations

**Minimal, Purposeful**:
- Page transitions: Fade-in only (opacity + slight translate-y)
- Button hover: Scale 1.02, shadow increase
- Modal entrance: Fade + scale from 0.95 to 1
- Loading states: Subtle pulse on skeleton loaders
- NO scroll-triggered animations
- NO complex parallax or decorative motion

## Images

**Hero Section**: NOT applicable for this dashboard application - login page uses simple card layout instead
**Icons**: Font Awesome via CDN for consistency
**Avatars**: User profile pictures in navigation (circular, w-10 h-10)
**Provider Logos**: Google and Microsoft logos for OAuth buttons (inline SVG or small PNGs)