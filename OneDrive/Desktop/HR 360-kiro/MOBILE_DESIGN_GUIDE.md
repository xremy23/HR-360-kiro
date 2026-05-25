# HR Crisis 360 - Mobile Design Guide

## 🎨 Design System

### Brand Identity
- **App Name**: 
  - Full: "HR Crisis 360" (for large screens)
  - Short: "HR 360" (for mobile/limited space)
- **Design Philosophy**: Minimalistic, clean, and intuitive
- **Target Audience**: HR professionals and employees during emergencies

### Color Palette

#### Primary Colors
| Color | RGB | Hex | Usage |
|-------|-----|-----|-------|
| Teal | R:3, G:143, B:141 | #038F8D | Primary actions, headers, highlights |
| White | R:255, G:255, B:255 | #FFFFFF | Backgrounds, text on dark |
| Black | R:0, G:0, B:0 | #000000 | Primary text, dark elements |

#### Secondary Colors
| Color | RGB | Hex | Usage |
|-------|-----|-----|-------|
| Dark Teal | R:2, G:79, B:69 | #024F45 | Hover states, secondary actions |
| Medium Teal | R:1, G:116, B:115 | #017473 | Gradients, accents |
| Light Teal | R:154, G:192, B:195 | #9AC0C3 | Backgrounds, subtle elements |

#### Semantic Colors
- **Success**: #10B981 (Green) - Safe status, confirmations
- **Warning**: #F59E0B (Amber) - Caution, warnings
- **Error**: #EF4444 (Red) - Danger, errors, missing status
- **Info**: #3B82F6 (Blue) - Information, medium alerts

### Typography

#### Font Families
1. **Funnel Display** (Primary)
   - Usage: Main headings, display text
   - Weight: 700 (Bold)
   - Size: 32px - 48px

2. **Funnel Sans** (Secondary)
   - Usage: Subheadings, labels
   - Weight: 600 (Semibold)
   - Size: 14px - 28px

3. **DM Sans** (Tertiary)
   - Usage: Body text, descriptions
   - Weight: 400 (Regular), 500 (Medium)
   - Size: 12px - 16px

#### Typography Scale

| Level | Font | Size | Weight | Line Height | Usage |
|-------|------|------|--------|-------------|-------|
| Display 1 | Funnel Display | 48px | 700 | 56px | Hero titles |
| Display 2 | Funnel Display | 40px | 700 | 48px | Page titles |
| Display 3 | Funnel Display | 32px | 700 | 40px | Section titles |
| H1 | Funnel Sans | 28px | 700 | 36px | Main headings |
| H2 | Funnel Sans | 24px | 700 | 32px | Subheadings |
| H3 | Funnel Sans | 20px | 600 | 28px | Card titles |
| H4 | Funnel Sans | 18px | 600 | 26px | Section headers |
| H5 | Funnel Sans | 16px | 600 | 24px | Labels |
| Body 1 | DM Sans | 16px | 400 | 24px | Main text |
| Body 2 | DM Sans | 14px | 400 | 20px | Secondary text |
| Label | DM Sans | 14px | 500 | 20px | Form labels |
| Caption | DM Sans | 11px | 400 | 16px | Hints, metadata |

### Spacing System

```
xs:   4px
sm:   8px
md:   12px
lg:   16px
xl:   24px
xxl:  32px
xxxl: 48px
```

### Border Radius

```
none: 0px
sm:   4px
md:   8px
lg:   12px
xl:   16px
full: 9999px (circles)
```

### Shadows

```
sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
md:  0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1)
xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1)
2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

## 📱 Mobile Screens

### 1. Login Screen
**Path**: `/login`

**Features**:
- Gradient background (Teal to Dark Teal)
- Centered login card
- Email and password inputs
- Login button with loading state
- Demo credentials section
- Decorative background elements

**Components**:
- Input fields with focus states
- Submit button with spinner
- Info box with demo credentials

**Responsive**: Mobile-first, optimized for 320px+

---

### 2. Home Dashboard
**Path**: `/`

**Features**:
- Sticky header with user greeting
- Status card showing current check-in status
- Quick action grid (4 items)
- Recent activity list
- Bottom navigation bar
- Hamburger menu for additional options

**Quick Actions**:
1. ✓ Check In
2. 🔔 Alerts
3. 📚 Knowledge Base
4. 👥 Contacts

**Recent Activity**:
- Last check-in timestamp
- Active alerts
- Status indicators

**Bottom Navigation**:
- Home (active)
- Check In
- KB
- Alerts
- Settings

---

### 3. Check-In Screen
**Path**: `/checkin`

**Features**:
- Status selection (4 options)
- Optional notes textarea
- Location information section
- Submit button
- Offline sync info

**Status Options**:
1. ✓ Safe (Green)
2. ⚠️ Injured (Amber)
3. ❌ Missing (Red)
4. ❓ Unknown (Gray)

**Location Section**:
- Shows location tracking status
- Enable location button
- Privacy notice

---

### 4. Alerts Screen
**Path**: `/alerts`

**Features**:
- Filter tabs (All, Critical, High, Medium, Low)
- Alert cards with severity indicators
- Alert details (title, description, time)
- View details button
- Empty state

**Alert Card**:
- Severity icon and color
- Title and timestamp
- Description
- Type badge
- Severity label
- View details action

**Severity Levels**:
- 🚨 Critical (Red)
- ⚠️ High (Amber)
- ℹ️ Medium (Blue)
- ✓ Low (Green)

---

### 5. Knowledge Base Screen
**Path**: `/kb`

**Features**:
- Search input
- Category filter buttons
- Guide list with cards
- Guide detail view
- Share button

**Guide Card**:
- Title
- Description
- Category badge
- Tag count
- Navigation arrow

**Guide Detail**:
- Full title
- Tags
- Content (formatted)
- Share button

---

### 6. Settings Screen
**Path**: `/settings`

**Features**:
- Profile section
- Notification settings
- Privacy & permissions
- App information
- Help & support
- Logout button

**Sections**:
1. **Profile**: Avatar, name, email, role, edit button
2. **Notifications**: Push, Email toggles
3. **Privacy**: Location, Camera toggles
4. **App**: Version, last updated, storage used
5. **Help**: FAQ, Contact, Privacy Policy
6. **Logout**: Red danger button

---

## 🎯 Component Library

### Buttons

#### Primary Button
```tsx
<button className="bg-primary-teal hover:bg-secondary-medium text-primary-white font-sans font-semibold py-3 px-4 rounded-lg transition">
  Action
</button>
```

#### Secondary Button
```tsx
<button className="border-2 border-primary-teal text-primary-teal hover:bg-primary-teal hover:text-primary-white font-sans font-semibold py-3 px-4 rounded-lg transition">
  Action
</button>
```

#### Danger Button
```tsx
<button className="bg-error hover:bg-opacity-90 text-primary-white font-sans font-semibold py-3 px-4 rounded-lg transition">
  Delete
</button>
```

### Cards

#### Standard Card
```tsx
<div className="bg-primary-white rounded-xl shadow-md p-4 border-l-4 border-primary-teal">
  {/* Content */}
</div>
```

#### Alert Card
```tsx
<div className="bg-primary-white rounded-xl shadow-md overflow-hidden border-l-4 border-primary-teal">
  {/* Content */}
</div>
```

### Input Fields

#### Text Input
```tsx
<input
  type="text"
  placeholder="Placeholder"
  className="w-full px-4 py-3 border-2 border-secondary-light rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition"
/>
```

#### Textarea
```tsx
<textarea
  placeholder="Placeholder"
  className="w-full px-4 py-3 border-2 border-secondary-light rounded-lg font-sans text-body2 focus:outline-none focus:border-primary-teal focus:ring-2 focus:ring-primary-teal focus:ring-opacity-20 transition resize-none"
  rows={4}
/>
```

### Toggle Switch
```tsx
<button className="w-12 h-7 rounded-full bg-primary-teal transition">
  <div className="w-6 h-6 rounded-full bg-primary-white transition transform translate-x-5"></div>
</button>
```

### Status Badge
```tsx
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success bg-opacity-10">
  <span className="w-2 h-2 rounded-full bg-success"></span>
  <span className="font-sans text-label2 text-success">Safe</span>
</span>
```

## 📐 Layout Guidelines

### Mobile Viewport
- **Min Width**: 320px
- **Max Width**: 640px (mobile breakpoint)
- **Padding**: 16px (lg spacing)
- **Safe Area**: Account for notches and home indicators

### Header
- **Height**: 56px (with content)
- **Sticky**: Yes
- **Shadow**: md
- **Gradient**: Primary to Secondary

### Bottom Navigation
- **Height**: 64px
- **Fixed**: Yes
- **Background**: White
- **Border**: Top border (neutral-200)

### Content Area
- **Padding Bottom**: 80px (for bottom nav)
- **Max Width**: 100% (mobile)
- **Spacing**: lg (16px) between sections

## 🎨 Design Patterns

### Empty States
- Large icon (5xl)
- Heading (h4)
- Description (body2)
- Optional action button

### Loading States
- Spinner animation
- Loading text
- Disabled state styling

### Error States
- Error icon (❌)
- Error message
- Retry button
- Error color (red)

### Success States
- Success icon (✓)
- Success message
- Success color (green)
- Auto-dismiss after 2-3 seconds

## 📱 Responsive Breakpoints

```
xs:  320px  (Mobile)
sm:  640px  (Mobile landscape)
md:  768px  (Tablet)
lg:  1024px (Desktop)
xl:  1280px (Large desktop)
2xl: 1536px (Extra large)
```

## ♿ Accessibility

- **Color Contrast**: WCAG AA compliant
- **Touch Targets**: Minimum 44x44px
- **Font Sizes**: Readable at 16px base
- **Focus States**: Visible focus indicators
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: For interactive elements

## 🎬 Animations & Transitions

- **Fast**: 150ms (hover states)
- **Base**: 200ms (standard transitions)
- **Slow**: 300ms (complex animations)
- **Easing**: ease-in-out

## 📋 Implementation Checklist

- ✅ Design system created
- ✅ Color palette configured
- ✅ Typography set up
- ✅ Login screen built
- ✅ Home dashboard built
- ✅ Check-in screen built
- ✅ Alerts screen built
- ✅ Knowledge base screen built
- ✅ Settings screen built
- ✅ Bottom navigation implemented
- ✅ Responsive design verified
- ✅ TypeScript compilation successful
- ✅ Build optimization complete

## 🚀 Next Steps

1. **Add Contacts Screen** - Emergency contacts management
2. **Implement Real Data** - Connect to backend API
3. **Add Animations** - Page transitions, micro-interactions
4. **Optimize Performance** - Image optimization, code splitting
5. **Test on Devices** - iOS and Android browsers
6. **Add PWA Features** - Install prompt, offline support
7. **Implement Notifications** - Push notifications
8. **Add Location Services** - GPS tracking for check-ins

---

**Design System Version**: 1.0.0  
**Last Updated**: May 25, 2026  
**Status**: ✅ Complete and Ready for Development
