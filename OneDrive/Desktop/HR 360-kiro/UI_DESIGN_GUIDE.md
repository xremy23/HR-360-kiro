# HR 360 UI Design Guide

**Version**: 1.0  
**Last Updated**: June 1, 2026  
**Status**: Ready for Frontend Development

---

## 📐 Design Overview

The HR 360 Emergency Management PWA uses a modern, minimalistic design system emphasizing clarity, efficiency, and accessibility. The design is optimized for both desktop and mobile views with a responsive layout.

---

## 🎨 Color Palette

### Primary Colors
- **Teal/Cyan**: `#0D9488` - Primary action, navigation, highlights
- **Dark Teal**: `#134E4A` - Sidebar, dark backgrounds
- **Black**: `#000000` - Text, dark elements
- **White**: `#FFFFFF` - Backgrounds, text on dark

### Status Colors
- **Safe/Success**: `#10B981` (Green) - Safe status, positive actions
- **Warning/Caution**: `#F59E0B` (Amber) - Need help, warnings
- **Danger/SOS**: `#DC2626` (Red) - SOS, critical alerts
- **Info**: `#3B82F6` (Blue) - Information, neutral alerts

### Neutral Colors
- **Light Gray**: `#F3F4F6` - Light backgrounds
- **Medium Gray**: `#D1D5DB` - Borders, dividers
- **Dark Gray**: `#6B7280` - Secondary text
- **Very Dark Gray**: `#1F2937` - Primary text

---

## 🔤 Typography

### Font Family
- **Primary**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- **Monospace**: "Courier New", monospace (for code, technical info)

### Font Sizes & Weights

#### Headings
- **H1**: 32px, Bold (700) - Page titles
- **H2**: 24px, Bold (700) - Section titles
- **H3**: 20px, Semibold (600) - Subsection titles
- **H4**: 16px, Semibold (600) - Card titles

#### Body Text
- **Large**: 16px, Regular (400) - Main content
- **Regular**: 14px, Regular (400) - Standard text
- **Small**: 12px, Regular (400) - Secondary text, labels
- **Tiny**: 11px, Regular (400) - Metadata, timestamps

#### Special
- **Button Text**: 14px, Semibold (600)
- **Label Text**: 12px, Semibold (600)
- **Badge Text**: 11px, Semibold (600)

---

## 🏗️ Layout Structure

### Desktop Layout (1024px+)
```
┌─────────────────────────────────────────────────────────┐
│ Header (Navigation, Status, User Menu)                  │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│  Sidebar     │  Main Content Area                       │
│  (180px)     │  (Responsive Grid)                       │
│              │                                          │
│              │  - Dashboard: 4-column grid              │
│              │  - Lists: Full width with sidebar        │
│              │  - Forms: Centered or 2-column           │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

### Mobile Layout (< 768px)
```
┌──────────────────────────────┐
│ Header (Compact)             │
├──────────────────────────────┤
│                              │
│  Main Content (Full Width)   │
│  - Single column             │
│  - Stacked cards             │
│  - Full-width buttons        │
│                              │
├──────────────────────────────┤
│ Bottom Navigation (Tabs)      │
└──────────────────────────────┘
```

---

## 📱 Component Library

### Header
- **Height**: 64px (desktop), 56px (mobile)
- **Background**: White with subtle shadow
- **Contains**:
  - Logo (left)
  - Status indicators (center-right)
  - User menu (right)
  - PWA badge, connection status, latency indicator

### Sidebar
- **Width**: 180px (desktop), hidden (mobile)
- **Background**: Dark teal (`#134E4A`)
- **Text Color**: White
- **Items**:
  - Navigation links (14px, regular)
  - Active state: Teal background highlight
  - Icons + text for each section
  - Safety Tip Box at bottom

### Cards
- **Border Radius**: 12px
- **Padding**: 20px
- **Background**: White or dark (depending on context)
- **Shadow**: Subtle (0 1px 3px rgba(0,0,0,0.1))
- **Variants**:
  - **Info Card**: Light teal background, teal text
  - **Alert Card**: Light red/pink background, red text
  - **Dark Card**: Black background, white text
  - **Status Card**: Colored background based on status

### Buttons
- **Height**: 44px (mobile), 40px (desktop)
- **Padding**: 12px 24px
- **Border Radius**: 8px
- **Font**: 14px, Semibold
- **Variants**:
  - **Primary**: Teal background, white text
  - **Secondary**: White background, teal text, teal border
  - **Danger**: Red background, white text
  - **Warning**: Amber background, white text
  - **Ghost**: Transparent, colored text

### Input Fields
- **Height**: 44px (mobile), 40px (desktop)
- **Padding**: 12px 16px
- **Border Radius**: 8px
- **Border**: 1px solid `#D1D5DB`
- **Focus**: Teal border, subtle shadow
- **Placeholder**: Gray text (`#9CA3AF`)

### Badges & Labels
- **Height**: 24px
- **Padding**: 4px 12px
- **Border Radius**: 12px (pill-shaped)
- **Font**: 11px, Semibold
- **Variants**:
  - **Status**: Green (Safe), Amber (Need Help), Red (SOS)
  - **Category**: Dark background, colored text
  - **Info**: Light background, dark text

### Status Indicators
- **Size**: 12px (small), 16px (medium), 24px (large)
- **Shape**: Circle
- **Colors**: Green (Safe), Amber (Caution), Red (Danger), Gray (Offline)
- **Animation**: Subtle pulse for active states

---

## 📐 Spacing System

### Base Unit: 4px

- **xs**: 4px (0.25rem)
- **sm**: 8px (0.5rem)
- **md**: 12px (0.75rem)
- **lg**: 16px (1rem)
- **xl**: 20px (1.25rem)
- **2xl**: 24px (1.5rem)
- **3xl**: 32px (2rem)
- **4xl**: 40px (2.5rem)

### Common Spacing
- **Padding**: 16px (cards), 20px (sections)
- **Margin**: 16px (between sections), 8px (between items)
- **Gap**: 12px (grid items), 8px (list items)

---

## 🎯 Desktop View Layouts

### 1. Dashboard Hub
**Grid**: 4 columns
- **Top Row**: 4 metric cards (Total Roster, Safe Roster, Needs Assistance, SOS Signals)
- **Middle Row**: 2 large cards (Broadcasted Hazards, Team Status Feeds)
- **Bottom Row**: Safety Tip Box (sidebar)

### 2. Disaster Library
**Layout**: 2-column
- **Left**: Category list (scrollable)
- **Right**: Guide detail view with sections

### 3. Staff Directory
**Layout**: 3-column grid
- **Cards**: Staff profile cards with contact info
- **Responsive**: 2 columns on tablet, 1 on mobile

### 4. Call Directory
**Layout**: 2-column grid
- **Cards**: Emergency hotline cards
- **Each Card**: Title, description, phone number, icon

### 5. Admin Console
**Layout**: 2-column
- **Left**: Emergency Profile form
- **Right**: Active Corporate Directory list

### 6. Organization Workspace
**Layout**: 3-column
- **Left**: Roster profiles list
- **Center**: Organization chart
- **Right**: Selected profile detail

### 7. Admin Dashboard & SOS Desktop
**Layout**: 2-column
- **Left**: Emergency Protocol editor
- **Right**: Live sync list of protocols

---

## 📱 Mobile View Layouts

### 1. Status Screen
- **Header**: User profile, offline status, alerts
- **Main**: Broadcast message, status buttons (Safe, Need Help, SOS)
- **Content**: Team safe count, community hazard feed
- **Bottom**: Navigation tabs

### 2. Guides Screen
- **Header**: Search bar, category filters
- **Content**: Guide list (full width)
- **Detail**: Expandable guide with sections
- **Bottom**: Navigation tabs

### 3. Go-Bag Screen
- **Header**: Kit readiness percentage
- **Content**: Add item form, item list
- **Bottom**: Navigation tabs

### 4. Emergency Directory
- **Header**: Search bar
- **Content**: Emergency contact cards (full width)
- **Bottom**: Navigation tabs

### 5. Chatbot Screen
- **Header**: Chatbot title, clear conversation
- **Content**: Chat messages, suggested scenarios
- **Input**: Message input field, send button
- **Bottom**: Navigation tabs

---

## 🎨 Design Patterns

### Card Pattern
```
┌─────────────────────────────┐
│ Title / Header              │
├─────────────────────────────┤
│                             │
│ Content Area                │
│ (Text, data, form fields)   │
│                             │
├─────────────────────────────┤
│ Action Buttons (optional)   │
└─────────────────────────────┘
```

### List Item Pattern
```
┌─────────────────────────────┐
│ Icon  Title          Badge  │
│       Subtitle              │
│       Metadata              │
└─────────────────────────────┘
```

### Form Pattern
```
┌─────────────────────────────┐
│ Form Title                  │
├─────────────────────────────┤
│ Label                       │
│ [Input Field]               │
│                             │
│ Label                       │
│ [Input Field]               │
│                             │
│ [Primary Button]            │
└─────────────────────────────┘
```

### Status Indicator Pattern
```
● Status Text (with colored dot)
- Green: Safe
- Amber: Need Help
- Red: SOS
- Gray: Offline
```

---

## 🔄 Responsive Breakpoints

- **Mobile**: < 640px (single column, full-width elements)
- **Tablet**: 640px - 1024px (2 columns, adjusted spacing)
- **Desktop**: 1024px+ (3-4 columns, full layout)
- **Large Desktop**: 1440px+ (optimized for large screens)

---

## ✨ Interactive States

### Buttons
- **Default**: Base color
- **Hover**: Slightly darker shade
- **Active**: Darker shade with subtle shadow
- **Disabled**: Gray, reduced opacity

### Links
- **Default**: Teal color
- **Hover**: Underline
- **Active**: Darker teal
- **Visited**: Slightly faded

### Form Fields
- **Default**: Gray border
- **Focus**: Teal border, subtle shadow
- **Error**: Red border, error message below
- **Disabled**: Gray background, reduced opacity

### Cards
- **Default**: Subtle shadow
- **Hover**: Slightly elevated shadow
- **Active**: Teal border highlight

---

## 🎬 Animations & Transitions

### Timing
- **Fast**: 150ms (hover states, small interactions)
- **Normal**: 300ms (transitions, modal opens)
- **Slow**: 500ms (page transitions, complex animations)

### Easing
- **Default**: ease-in-out
- **Entrance**: ease-out
- **Exit**: ease-in

### Common Animations
- **Fade**: Opacity transition (300ms)
- **Slide**: Transform transition (300ms)
- **Scale**: Transform scale (300ms)
- **Pulse**: Subtle scale animation for status indicators

---

## 📐 Mobile Navigation

### Bottom Tab Navigation
- **Height**: 56px
- **Items**: 6 tabs (Status, Guides, Safe Chat, Go-Bag, Hotlines, Control)
- **Icons**: 24px, centered
- **Labels**: 10px, below icon
- **Active**: Teal icon and text
- **Inactive**: Gray icon and text

---

## 🎯 Key Design Principles

1. **Clarity**: Information is easy to understand at a glance
2. **Efficiency**: Users can complete tasks quickly
3. **Accessibility**: WCAG AA compliant, high contrast
4. **Consistency**: Patterns repeated throughout
5. **Responsiveness**: Works seamlessly on all devices
6. **Minimalism**: Clean, uncluttered interface
7. **Safety**: Clear visual hierarchy for critical actions

---

## 🔍 Accessibility Guidelines

### Color Contrast
- **Text on Background**: Minimum 4.5:1 ratio
- **UI Components**: Minimum 3:1 ratio
- **Don't rely on color alone**: Use icons, text, patterns

### Typography
- **Minimum Font Size**: 12px for body text
- **Line Height**: 1.5 for readability
- **Line Length**: 50-75 characters for optimal reading

### Interactive Elements
- **Minimum Touch Target**: 44px x 44px (mobile)
- **Focus Indicators**: Visible focus states
- **Keyboard Navigation**: All interactive elements accessible

### Images & Icons
- **Alt Text**: Descriptive for all images
- **Icon Labels**: Text labels for clarity
- **Sufficient Contrast**: Icons meet contrast requirements

---

## 📦 Component Specifications

### Metric Card
- **Size**: 280px x 140px (desktop), full-width (mobile)
- **Layout**: Icon (left), metric (center), label (right)
- **Colors**: Varies by type (info, warning, danger)

### Status Button
- **Size**: 120px x 60px (mobile), 140px x 70px (desktop)
- **Colors**: Green (Safe), Amber (Need Help), Red (SOS)
- **Text**: Bold, white, centered

### Profile Card
- **Size**: 320px x 200px (desktop), full-width (mobile)
- **Content**: Name, department, contact info, role badge
- **Actions**: Edit, delete icons

### Alert Card
- **Size**: Full-width
- **Height**: Auto (min 100px)
- **Content**: Icon, title, description, timestamp
- **Colors**: Based on severity

---

## 🎨 Dark Mode (Future)

The design system is prepared for dark mode implementation:
- **Background**: `#1F2937` (dark gray)
- **Surface**: `#111827` (very dark)
- **Text**: `#F3F4F6` (light gray)
- **Accent**: `#06B6D4` (lighter teal)

---

## 📋 Implementation Checklist

### Desktop Components
- [ ] Header with navigation
- [ ] Sidebar with menu items
- [ ] Metric cards (4-column grid)
- [ ] Large content cards
- [ ] Forms and input fields
- [ ] Buttons (all variants)
- [ ] Status indicators
- [ ] Badges and labels

### Mobile Components
- [ ] Responsive header
- [ ] Bottom navigation tabs
- [ ] Full-width cards
- [ ] Touch-friendly buttons (44px+)
- [ ] Mobile-optimized forms
- [ ] Collapsible sections
- [ ] Swipeable content

### Shared Components
- [ ] Typography system
- [ ] Color palette
- [ ] Spacing system
- [ ] Shadow system
- [ ] Border radius system
- [ ] Animation system

---

## 🚀 Development Notes

### CSS Framework
- Use Tailwind CSS for utility-first styling
- Custom colors defined in tailwind.config.js
- Responsive classes for breakpoints

### Component Library
- Build reusable React components
- Props for variants (primary, secondary, danger, etc.)
- Consistent naming conventions

### Responsive Design
- Mobile-first approach
- Test on actual devices
- Use CSS media queries for breakpoints

### Performance
- Optimize images
- Minimize CSS/JS
- Lazy load components
- Use CSS Grid for layouts

---

## 📞 Design System Maintenance

### Updates
- Document all changes
- Version the design system
- Communicate updates to team
- Update component library

### Consistency
- Regular design audits
- Component usage guidelines
- Brand compliance checks
- Accessibility reviews

---

**Design System Version**: 1.0  
**Last Updated**: June 1, 2026  
**Status**: ✅ Ready for Implementation  
**Next Review**: After Phase 2 Frontend Completion
