# Web Console UI Guide

## Design Overview

The web console follows a minimalistic design approach with a clean, professional aesthetic using the specified color palette and typography.

## Color Palette

### Primary Colors
- **Teal (#038F8D)**: Primary action buttons, active states, highlights
- **White (#FFFFFF)**: Backgrounds, text on dark backgrounds
- **Black (#000000)**: Text, borders, sidebar background

### Secondary Colors
- **Dark Teal (#024F45)**: Hover states, darker accents
- **Medium Teal (#017473)**: Alternative highlights
- **Light Teal (#9AC0C3)**: Subtle backgrounds, disabled states

### Semantic Colors
- **Success (#10B981)**: Safe status, positive actions
- **Warning (#F59E0B)**: Watch severity, caution states
- **Error (#EF4444)**: Emergency severity, critical alerts
- **Info (#3B82F6)**: Drill badges, informational messages

### Neutral Colors
- **50-100**: Light backgrounds
- **200-300**: Borders, dividers
- **400-500**: Secondary text
- **600-700**: Primary text
- **800-900**: Dark backgrounds

## Typography

### Font Families
- **Display**: Funnel Display (serif) - Large headings
- **Headings**: Funnel Sans (sans-serif) - Section titles
- **Body**: DM Sans (sans-serif) - Content text

### Font Sizes
- **Display 1**: 48px, 700 weight - Page titles
- **Display 2**: 40px, 700 weight - Main headings
- **Display 3**: 32px, 700 weight - Section headings
- **H1-H6**: 28px-14px, 600-700 weight - Various headings
- **Body 1-3**: 16px-12px, 400 weight - Content
- **Label 1-2**: 14px-12px, 500 weight - Form labels
- **Caption**: 11px, 400 weight - Timestamps, metadata

## Layout Components

### Sidebar Navigation
```
┌─────────────────────────────────────────────────────────────┐
│ 360 Crisis Management                                       │
├─────────────────────────────────────────────────────────────┤
│ 📊 Dashboard                                                │
│ 🚨 Incidents                                                │
│ 📢 Alerts                                                   │
│ ✓ Check-Ins                                                 │
│ 👥 Users                                                    │
│ ⚙️ Settings                                                 │
├─────────────────────────────────────────────────────────────┤
│ ◀ (Toggle)                                                  │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Collapsible to icon-only view
- Active state highlighting in teal
- Hover effects on navigation items
- Logo with organization name

### Top Navigation Bar
```
┌─────────────────────────────────────────────────────────────┐
│ Monday, May 26, 2026                    🔔  👤             │
└─────────────────────────────────────────────────────────────┘
```

**Features**:
- Current date display
- Notification button
- User profile button
- Light background with subtle border

## Page Layouts

### Dashboard Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Crisis Dashboard                              LIVE ●        │
├─────────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Incidents│ │Check-Ins │ │Pending   │ │Response  │        │
│ │    5     │ │   127    │ │ SOS  2   │ │ Rate 85% │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│ Active Incidents          │ Live Activity                   │
│ ┌─────────────────────┐   │ ┌──────────────────────────┐   │
│ │ 🚨 Fire             │   │ 🚨 Incident Created       │   │
│ │ Emergency - 2:30 PM │   │ Fire - Emergency - 2:30 PM│   │
│ ├─────────────────────┤   │ ├──────────────────────────┤   │
│ │ 🚨 Earthquake       │   │ 📢 Alert Broadcast        │   │
│ │ Watch - 1:45 PM     │   │ Evacuation Order - 2:25 PM│   │
│ └─────────────────────┘   │ └──────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│ Check-In Summary                                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Safe     │ │Need Help │ │ SOS      │ │Unaccounted
│ │  120     │ │   5      │ │  2       │ │   3      │        │
│ │  85%     │ │   4%     │ │  1%      │ │  2%      │        │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Incident Management Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Incident Management                  [Create Incident]      │
├─────────────────────────────────────────────────────────────┤
│ Create New Incident                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Incident Type: [Fire                                  ] │ │
│ │ Severity: [Emergency ▼]                                 │ │
│ │ ☑ This is a drill                                       │ │
│ │ [Create Incident]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Active Incidents                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Fire                              Emergency             │ │
│ │ Started: May 26, 2026 2:30 PM                           │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Earthquake                        Watch                │ │
│ │ Started: May 26, 2026 1:45 PM                           │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Alert Management Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Alert Management                     [Broadcast Alert]      │
├─────────────────────────────────────────────────────────────┤
│ Broadcast New Alert                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Alert Title: [Evacuation Order                        ] │ │
│ │ Message:                                                │ │
│ │ [Please evacuate the building immediately.            ] │ │
│ │ [                                                      ] │ │
│ │ Severity: [Emergency ▼]                                 │ │
│ │ ☑ This is a drill                                       │ │
│ │ [Broadcast Alert]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Recent Alerts                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Evacuation Order                                        │ │
│ │ Please evacuate the building immediately.              │ │
│ │ May 26, 2026 2:30 PM                    Emergency      │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Shelter in Place                                        │ │
│ │ Move to designated shelter areas.                       │ │
│ │ May 26, 2026 1:45 PM                    Watch          │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Component Styles

### Stat Card
```
┌──────────────────────────┐
│ Active Incidents         │
│                          │
│          5               │
└──────────────────────────┘
```
- Border: 2px colored (teal, error, warning, success)
- Padding: 16px
- Border radius: 8px
- Shadow: sm

### Incident Card
```
┌──────────────────────────────────────────────────────────┐
│ Fire                                    Emergency        │
│ Started at 2:30 PM                                       │
└──────────────────────────────────────────────────────────┘
```
- Border: 2px colored by severity
- Padding: 16px
- Border radius: 8px
- Shadow: md
- Flex layout with space-between

### Alert Panel
```
┌──────────────────────────────────────────────────────────┐
│ Evacuation Order                                    DRILL │
│ Please evacuate the building immediately.                │
│ 2:30 PM                                                  │
└──────────────────────────────────────────────────────────┘
```
- Border-left: 4px colored by severity
- Border: 1px neutral-200
- Padding: 16px
- Border radius: 8px
- Shadow: sm

### Check-In Summary
```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Safe     │ │Need Help │ │ SOS      │ │Unaccounted
│ │  120     │ │   5      │ │  2       │ │   3      │    │
│ │  85%     │ │   4%     │ │  1%      │ │  2%      │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ Total Check-Ins: 130                                    │
└──────────────────────────────────────────────────────────┘
```
- Grid layout with 4 columns
- Each item has top border in color
- Progress bar shows distribution
- Percentage display

### Activity Feed
```
┌──────────────────────────────────────────────────────────┐
│ 🚨 Incident Created                                      │
│    Fire - Emergency                                      │
│    2:30:45 PM                                            │
├──────────────────────────────────────────────────────────┤
│ 📢 Alert Broadcast                                       │
│    Evacuation Order                                      │
│    2:25:30 PM                                            │
├──────────────────────────────────────────────────────────┤
│ ✓ Check-In Received                                      │
│    Status: Safe                                          │
│    2:20:15 PM                                            │
└──────────────────────────────────────────────────────────┘
```
- Vertical list with dividers
- Icons for event types
- Scrollable container
- Custom scrollbar styling

## Spacing Guidelines

### Margins
- Between sections: 32px (xxl)
- Between components: 16px (lg)
- Between items: 12px (md)
- Between elements: 8px (sm)

### Padding
- Container padding: 24px (xl)
- Card padding: 16px (lg)
- Button padding: 12px (md) vertical, 16px (lg) horizontal
- Input padding: 12px (md)

## Button Styles

### Primary Button
```
┌─────────────────────────┐
│ Create Incident         │
└─────────────────────────┘
```
- Background: Teal (#038F8D)
- Text: White
- Padding: 12px 24px
- Border radius: 8px
- Shadow: md
- Hover: Dark Teal (#024F45)

### Secondary Button
```
┌─────────────────────────┐
│ Cancel                  │
└─────────────────────────┘
```
- Background: Neutral-100
- Text: Black
- Padding: 12px 24px
- Border radius: 8px
- Shadow: sm
- Hover: Neutral-200

## Form Elements

### Input Field
```
┌─────────────────────────────────────────────────────────┐
│ Incident Type                                           │
│ [Enter incident type...                               ] │
└─────────────────────────────────────────────────────────┘
```
- Border: 1px neutral-300
- Padding: 12px
- Border radius: 8px
- Font: DM Sans, 16px
- Focus: Teal border

### Select Dropdown
```
┌─────────────────────────────────────────────────────────┐
│ Severity Level                                          │
│ [Emergency                                           ▼] │
└─────────────────────────────────────────────────────────┘
```
- Border: 1px neutral-300
- Padding: 12px
- Border radius: 8px
- Font: DM Sans, 16px

### Checkbox
```
☑ This is a drill
```
- Size: 16x16px
- Border: 1px neutral-300
- Checked: Teal background
- Label: 14px, 500 weight

## Status Indicators

### Live Status
```
● LIVE
```
- Green background (#10B981)
- Pulsing animation
- 8px dot
- White text

### Offline Status
```
● OFFLINE
```
- Red background (#EF4444)
- No animation
- 8px dot
- White text

### Drill Badge
```
DRILL
```
- Blue background (#3B82F6)
- White text
- 12px font
- 4px padding

## Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Mobile Adjustments
- Sidebar collapses to icons
- Single column layout
- Larger touch targets (44px minimum)
- Simplified navigation

### Tablet Adjustments
- Sidebar visible but narrower
- Two column layout where applicable
- Adjusted spacing

### Desktop
- Full sidebar
- Multi-column layouts
- Optimal spacing

## Animations

### Transitions
- **Fast**: 150ms ease-in-out
- **Base**: 200ms ease-in-out
- **Slow**: 300ms ease-in-out

### Pulse Animation
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```
- Used for live status indicator
- 2 second duration
- Infinite loop

## Accessibility

- ✅ Sufficient color contrast
- ✅ Clear focus states
- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Screen reader friendly

## Dark Mode (Future)

When implementing dark mode:
- Invert neutral colors
- Adjust semantic colors for contrast
- Maintain teal as primary
- Use dark backgrounds

---

**Design System Version**: 1.0.0
**Last Updated**: May 26, 2026
**Status**: Complete
