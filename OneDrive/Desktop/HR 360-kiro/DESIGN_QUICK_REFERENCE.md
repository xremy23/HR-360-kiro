# Design System - Quick Reference

## 🎨 Color Palette

### Primary
- **Teal**: `#038F8D` - Main brand color, CTAs
- **White**: `#FFFFFF` - Backgrounds, text
- **Black**: `#000000` - Text, accents

### Secondary
- **Dark Teal**: `#024645` - Hover states
- **Medium Teal**: `#017473` - Secondary actions
- **Light Teal**: `#9AC0C3` - Disabled states
- **Cyan**: `#49D7D1` - Highlights, active states

### Semantic
- **Success**: `#10B981` - Positive actions
- **Warning**: `#F59E0B` - Caution, alerts
- **Error**: `#EF4444` - Errors, critical
- **Info**: `#3B82F6` - Information

### Neutral (Grayscale)
- **50**: `#F9FAFB` - Lightest
- **100**: `#F3F4F6`
- **200**: `#E5E7EB` - Borders
- **300**: `#D1D5DB`
- **400**: `#9CA3AF` - Secondary text
- **500**: `#6B7280`
- **600**: `#4B5563` - Primary text
- **700**: `#374151`
- **800**: `#1F2937`
- **900**: `#111827` - Darkest

---

## 📝 Typography

### Font Families
```css
Display: 'Outfit', 'Inter', sans-serif
Body: 'Inter', sans-serif
Mono: 'JetBrains Mono', monospace
```

### Font Sizes
| Level | Size | Weight | Usage |
|-------|------|--------|-------|
| Display 1 | 48px | 700 | Hero titles |
| Display 2 | 40px | 700 | Major titles |
| Display 3 | 32px | 700 | Section titles |
| H1 | 32px | 900 | Page heading |
| H2 | 28px | 900 | Section heading |
| H3 | 24px | 900 | Subsection |
| H4 | 20px | 900 | Card title |
| H5 | 18px | 700 | Subheading |
| H6 | 14px | 600 | Small heading |
| Body 1 | 16px | 400 | Primary text |
| Body 2 | 14px | 400 | Secondary text |
| Body 3 | 12px | 400 | Tertiary text |
| Label 1 | 14px | 600 | Form labels |
| Label 2 | 12px | 600 | Small labels |
| Caption | 11px | 400 | Captions |

---

## 📏 Spacing

```
Base Unit: 4px

xs:  4px
sm:  8px
md:  12px
lg:  16px
xl:  24px
2xl: 32px
3xl: 48px
```

---

## 🔲 Border Radius

```
xs:   4px   (inputs, small elements)
sm:   8px   (buttons, cards)
md:   12px  (modals, larger cards)
lg:   16px  (large containers)
full: 9999px (pills, avatars)
```

---

## 🌑 Shadows

```
sm:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
md:  0 4px 6px -1px rgba(0, 0, 0, 0.1)
lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1)
xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1)
2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

---

## ⏱️ Animations

```
Duration:
- fast:   150ms
- normal: 300ms
- slow:   500ms

Easing:
- ease-in:     cubic-bezier(0.4, 0, 1, 1)
- ease-out:    cubic-bezier(0, 0, 0.2, 1)
- ease-in-out: cubic-bezier(0.4, 0, 0.2, 1)

Common:
- fade-in:    opacity 0 → 1
- slide-up:   translateY(10px) → 0
- pulse-slow: opacity 1 → 0.5 → 1 (2s)
```

---

## 🎯 Component States

All components support:
- **Default** - Normal state
- **Hover** - Interactive feedback
- **Active** - Selected/pressed
- **Disabled** - Unavailable
- **Loading** - Processing
- **Error** - Error state
- **Success** - Success state

---

## 🔘 Button Variants

```
Primary:   Teal bg, white text
Secondary: Light bg, teal text
Tertiary:  No bg, teal text
Danger:    Red bg, white text

Sizes:
sm: 32px height
md: 40px height (default)
lg: 48px height
```

---

## 📝 Input States

```
Default:  border: #E5E7EB
Focus:    border: #038F8D, ring: #038F8D/20%
Error:    border: #EF4444
Disabled: bg: #F9FAFB, opacity: 0.5
Success:  border: #10B981
```

---

## 🎴 Card Structure

```
Padding:      16px or 24px
Border radius: 12px
Background:   white
Shadow:       md (subtle)
Border:       1px solid #E5E7EB (optional)

Variants:
- Elevated (with shadow)
- Outlined (with border)
- Flat (no shadow/border)
```

---

## 📱 Responsive Breakpoints

```
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: > 1024px
```

---

## ♿ Accessibility

### Color Contrast
- Text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### Touch Targets
- Minimum: 44x44px
- Adequate spacing between elements
- Thumb-friendly on mobile

### Keyboard Navigation
- Tab order logical
- Focus indicators visible
- All interactive elements accessible

---

## 🎨 CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #038F8D;
  --color-primary-dark: #024645;
  --color-primary-light: #9AC0C3;
  --color-accent: #49D7D1;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 16px;
  --spacing-xl: 24px;
  --spacing-2xl: 32px;
  --spacing-3xl: 48px;
  
  /* Typography */
  --font-display: 'Outfit', 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  
  /* Border Radius */
  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-full: 9999px;
}
```

---

## 🎯 Design Principles

1. **Clarity** - Clear hierarchy and information
2. **Simplicity** - Minimal visual elements
3. **Efficiency** - Fast interactions
4. **Accessibility** - WCAG 2.1 AA compliant
5. **Consistency** - Uniform spacing and typography

---

## 📚 Resources

- **Full Design System**: See `DESIGN_SYSTEM.md`
- **Setup Guide**: See `DEVELOPMENT_SETUP.md`
- **Project Overview**: See `START_HERE.md`

---

**Last Updated**: June 1, 2026
