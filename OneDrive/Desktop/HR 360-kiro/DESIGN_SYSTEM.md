# Design System - HR 360 Emergency Management PWA

## Design Philosophy

**Modern Minimalistic Design**

The HR 360 PWA follows a modern minimalistic design philosophy emphasizing:
- **Clarity** - Clear hierarchy and information architecture
- **Simplicity** - Minimal visual elements, maximum functionality
- **Efficiency** - Fast interactions, reduced cognitive load
- **Accessibility** - WCAG 2.1 AA compliant
- **Responsiveness** - Seamless experience across all devices

---

## Color Palette

### Primary Colors

| Color | Hex | Usage | Notes |
|-------|-----|-------|-------|
| Teal (Primary) | `#038F8D` | Main brand color, CTAs, primary actions | Primary brand identity |
| White | `#FFFFFF` | Background, text on dark | Clean, minimal aesthetic |
| Black | `#000000` | Text, accents | High contrast for readability |

### Secondary Colors (Teal Variations)

| Color | Hex | Usage |
|-------|-----|-------|
| Dark Teal | `#024645` | Deep accents, hover states |
| Medium Teal | `#017473` | Secondary actions |
| Light Teal | `#9AC0C3` | Subtle backgrounds, disabled states |
| Cyan | `#49D7D1` | Highlights, active states, accents |

### Semantic Colors

| Color | Hex | Usage | Meaning |
|-------|-----|-------|---------|
| Success | `#10B981` | Positive actions, confirmations | Safe, good status |
| Warning | `#F59E0B` | Caution, alerts, warnings | Attention needed |
| Error | `#EF4444` | Errors, critical states, danger | Action required |
| Info | `#3B82F6` | Information, notifications | Informational |

### Neutral Colors (Grayscale)

| Level | Hex | Usage |
|-------|-----|-------|
| 50 | `#F9FAFB` | Lightest backgrounds |
| 100 | `#F3F4F6` | Light backgrounds |
| 200 | `#E5E7EB` | Borders, dividers |
| 300 | `#D1D5DB` | Secondary borders |
| 400 | `#9CA3AF` | Secondary text |
| 500 | `#6B7280` | Tertiary text |
| 600 | `#4B5563` | Primary text |
| 700 | `#374151` | Dark text |
| 800 | `#1F2937` | Darker text |
| 900 | `#111827` | Darkest text |

### Accent Color

| Color | Hex | Usage |
|-------|-----|-------|
| Purple | `#8965F5` | Accent color for special elements |

### Background

| Color | Hex | Usage |
|-------|-----|-------|
| Light Background | `#f2f7f7` | Subtle background, minimal visual noise |

---

## Typography

### Font Families

```css
/* Display & Headings */
font-family: 'Outfit', 'Inter', sans-serif;

/* Body Text & UI */
font-family: 'Inter', sans-serif;

/* Code & Technical */
font-family: 'JetBrains Mono', monospace;
```

### Font Sizes & Weights

#### Display Sizes (Large Headings)

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display 1 | 48px | 700 | Page titles, hero sections |
| Display 2 | 40px | 700 | Major section titles |
| Display 3 | 32px | 700 | Section headers |

#### Heading Sizes

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| H1 | 32px | 900 | Main page heading |
| H2 | 28px | 900 | Section heading |
| H3 | 24px | 900 | Subsection heading |
| H4 | 20px | 900 | Card title |
| H5 | 18px | 700 | Subheading |
| H6 | 14px | 600 | Small heading |

#### Body Text

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Body 1 | 16px | 400 | Primary body text |
| Body 2 | 14px | 400 | Secondary body text |
| Body 3 | 12px | 400 | Tertiary body text |

#### Labels & Captions

| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Label 1 | 14px | 600 | Form labels, buttons |
| Label 2 | 12px | 600 | Small labels |
| Caption | 11px | 400 | Captions, hints |

---

## Spacing System

Consistent spacing creates visual harmony and improves usability.

```
Base Unit: 4px

Spacing Scale:
- xs: 4px
- sm: 8px
- md: 12px
- lg: 16px
- xl: 24px
- 2xl: 32px
- 3xl: 48px
```

### Usage Guidelines

- **Padding**: Use for internal spacing within components
- **Margin**: Use for spacing between components
- **Gap**: Use for spacing between flex/grid items

---

## Border Radius

Minimal, clean corners for modern aesthetic.

```
- xs: 4px (small elements, inputs)
- sm: 8px (cards, buttons)
- md: 12px (modals, larger cards)
- lg: 16px (large containers)
- full: 9999px (pills, avatars)
```

---

## Shadows

Subtle shadows for depth without visual clutter.

```
Elevation Levels:

sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
md: 0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1)
xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1)
2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

---

## Animations & Transitions

Smooth, purposeful animations enhance user experience.

```
Duration:
- fast: 150ms (hover states, quick feedback)
- normal: 300ms (standard transitions)
- slow: 500ms (important state changes)

Easing:
- ease-in: cubic-bezier(0.4, 0, 1, 1)
- ease-out: cubic-bezier(0, 0, 0.2, 1)
- ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)

Common Animations:
- fade-in: opacity 0 → 1
- slide-up: transform translateY(10px) → 0
- pulse-slow: opacity 1 → 0.5 → 1 (2s loop)
```

---

## Component Design Principles

### Minimalistic Approach

1. **Remove Unnecessary Elements**
   - No decorative borders unless functional
   - Minimal use of colors
   - Clean whitespace

2. **Emphasize Content**
   - Typography hierarchy guides attention
   - Ample whitespace around content
   - Clear visual hierarchy

3. **Functional Design**
   - Every element serves a purpose
   - Intuitive interactions
   - Clear affordances

4. **Consistency**
   - Uniform spacing
   - Consistent typography
   - Predictable interactions

### Component States

All components should support:
- **Default** - Normal state
- **Hover** - Interactive feedback
- **Active** - Selected/pressed state
- **Disabled** - Unavailable state
- **Loading** - Processing state
- **Error** - Error state
- **Success** - Success state

---

## Component Library

### Buttons

```
Variants:
- Primary (Teal background, white text)
- Secondary (Light background, teal text)
- Tertiary (No background, teal text)
- Danger (Red background, white text)

Sizes:
- sm: 32px height
- md: 40px height (default)
- lg: 48px height

States:
- Default, Hover, Active, Disabled, Loading
```

### Input Fields

```
Variants:
- Text input
- Email input
- Password input
- Number input
- Textarea

States:
- Default (border: #E5E7EB)
- Focus (border: #038F8D, ring: #038F8D/20%)
- Error (border: #EF4444)
- Disabled (background: #F9FAFB, opacity: 0.5)
- Success (border: #10B981)
```

### Cards

```
Structure:
- Padding: 16px or 24px
- Border radius: 12px
- Background: white
- Shadow: md (subtle elevation)
- Border: 1px solid #E5E7EB (optional)

Variants:
- Elevated (with shadow)
- Outlined (with border)
- Flat (no shadow/border)
```

### Modals

```
Structure:
- Overlay: rgba(0, 0, 0, 0.5)
- Modal: white background, rounded corners
- Padding: 24px
- Border radius: 16px
- Shadow: 2xl

Animation:
- Fade in overlay
- Slide up content
- Duration: 300ms
```

### Navigation

```
Mobile:
- Bottom navigation bar
- Icons + labels
- Active indicator (teal underline)

Desktop:
- Sidebar or top navigation
- Horizontal layout
- Active state highlight
```

---

## Responsive Design

### Breakpoints

```
Mobile:    < 640px
Tablet:    640px - 1024px
Desktop:   > 1024px
```

### Mobile-First Approach

1. Design for mobile first
2. Enhance for tablet
3. Optimize for desktop

### Touch Targets

- Minimum 44x44px for touch targets
- Adequate spacing between interactive elements
- Thumb-friendly layout on mobile

---

## Accessibility

### WCAG 2.1 AA Compliance

1. **Color Contrast**
   - Text: 4.5:1 ratio minimum
   - Large text: 3:1 ratio minimum
   - UI components: 3:1 ratio minimum

2. **Typography**
   - Readable font sizes (minimum 14px for body)
   - Adequate line height (1.5 minimum)
   - Clear font weights

3. **Interactive Elements**
   - Clear focus indicators
   - Keyboard navigation support
   - Descriptive labels

4. **Motion**
   - Respect `prefers-reduced-motion`
   - Avoid auto-playing animations
   - Provide pause controls

---

## Dark Mode (Future)

When implementing dark mode:

```
Dark Mode Palette:
- Background: #111827
- Surface: #1F2937
- Border: #374151
- Text: #F9FAFB
- Accent: #49D7D1 (lighter teal)
```

---

## Implementation Guidelines

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #038F8D;
  --color-primary-dark: #024645;
  --color-primary-light: #9AC0C3;
  --color-accent: #49D7D1;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  
  /* Typography */
  --font-display: 'Outfit', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
```

### Tailwind Configuration

The project uses Tailwind CSS with custom configuration:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          teal: {
            deep: '#024645',
            medium: '#038F8D',
            light: '#9AC0C3',
          },
          cyan: '#49D7D1',
          purple: '#8965F5',
          'bg-light': '#f2f7f7',
        },
      },
      fontFamily: {
        display: ['Outfit', 'Inter', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
};
```

---

## Design Tokens

### Token Naming Convention

```
{category}-{property}-{state}

Examples:
- button-primary-default
- input-text-focus
- card-elevated-default
- text-body-primary
```

---

## Best Practices

1. **Whitespace is Content**
   - Use ample whitespace
   - Don't fill every pixel
   - Let content breathe

2. **Typography Hierarchy**
   - Clear visual hierarchy
   - Consistent sizing
   - Proper weight variation

3. **Color Usage**
   - Limit color palette
   - Use colors purposefully
   - Maintain contrast

4. **Consistency**
   - Follow spacing system
   - Use consistent components
   - Maintain visual language

5. **Performance**
   - Optimize animations
   - Minimize repaints
   - Use CSS transforms

---

## Resources

- **Figma Design File**: [Link to design file]
- **Component Storybook**: [Link to storybook]
- **Tailwind CSS**: https://tailwindcss.com
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Last Updated:** June 1, 2026
**Version:** 1.0.0
