# 📊 Dashboard Components Documentation

This document outlines the modern widget-based dashboard architecture for Angkor Compliance.

## 🧩 Widget System

The dashboard uses a modular widget-based architecture for maximum flexibility and reusability.

### Core Widgets

#### **StatWidget** (`src/components/widgets/StatWidget.jsx`)
Displays key metrics and statistics with trend indicators.

**Features:**
- Configurable icons and colors
- Trend indicators (up/down/same)
- Click handling for navigation
- Loading states
- Responsive design

**Props:**
- `title` - Widget title
- `value` - Main statistic value
- `subtitle` - Additional context
- `icon` - Lucide React icon component
- `color` - Background color class
- `trend` - Trend direction ('up', 'down', 'same')
- `trendValue` - Trend description text
- `onClick` - Click handler function
- `loading` - Loading state boolean

#### **ChartWidget** (`src/components/widgets/ChartWidget.jsx`)
Displays data visualizations with multiple chart types.

**Features:**
- Bar and line chart support
- SVG-based rendering
- Responsive design
- Legend support
- Empty state handling

**Props:**
- `title` - Chart title
- `subtitle` - Chart description
- `data` - Array of {label, value} objects
- `type` - Chart type ('bar' or 'line')
- `height` - Container height class
- `showLegend` - Show/hide legend
- `onMoreClick` - More options handler
- `loading` - Loading state

#### **AlertWidget** (`src/components/widgets/AlertWidget.jsx`)
Shows important notifications and alerts.

**Features:**
- Multiple alert types (error, warning, info, success)
- Dismissible alerts
- Action buttons
- Alert summaries
- Timestamp display

**Props:**
- `alerts` - Array of alert objects
- `title` - Widget title
- `maxItems` - Maximum alerts to display
- `onDismiss` - Alert dismissal handler
- `onViewAll` - View all alerts handler
- `loading` - Loading state

#### **ActivityWidget** (`src/components/widgets/ActivityWidget.jsx`)
Displays recent system activities and updates.

**Features:**
- Activity timeline
- Type-based icons and colors
- Relative timestamps
- Status indicators
- Activity links

**Props:**
- `activities` - Array of activity objects
- `title` - Widget title
- `maxItems` - Maximum activities to display
- `onViewAll` - View all activities handler
- `loading` - Loading state

## 🏗️ Dashboard Architecture

### **ModernDashboard** (`src/components/ModernDashboard.jsx`)
Main dashboard component with role-based content and layout options.

**Key Features:**
- **Role-based Content**: Shows widgets based on user permissions
- **Layout Modes**: Grid and compact layout options
- **Real-time Updates**: Live data refresh capabilities
- **Responsive Design**: Mobile-first responsive layout
- **Customizable Views**: User-specific dashboard configurations

### Layout Modes

#### Grid Layout
- Full-featured widget display
- 4-column responsive grid for stats
- 2-column chart section
- Side-by-side alerts and activity

#### Compact Layout
- Space-efficient design
- 6-column stats grid
- Combined alerts and activity section
- Optimized for smaller screens

## 🔐 Permission Integration

The dashboard integrates with the `usePermissions` hook to show role-appropriate content:

### Role-Based Widget Display
```javascript
if (permissions.canAccessModule('permits')) {
  stats.push({
    title: 'Active Permits',
    // ... widget config
  })
}
```

### Permission Checks
- `canAccessModule(module)` - Module access
- `canManageUsers()` - User management
- `canViewReports()` - Reporting access
- `canCreateCAPs()` - CAP creation

## 🎨 Styling System

### Color Scheme
- **Primary**: Amber/Gold (`bg-amber-500`)
- **Secondary**: Gray scales
- **Status Colors**: 
  - Success: Green (`bg-green-500`)
  - Warning: Yellow (`bg-yellow-500`)
  - Error: Red (`bg-red-500`)
  - Info: Blue (`bg-blue-500`)

### Responsive Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px
- **Large**: > 1280px

## 📱 Mobile Optimization

### Touch-Friendly Design
- Minimum 44px touch targets
- Swipe gestures support
- Optimized spacing

### Progressive Enhancement
- Core functionality without JavaScript
- Enhanced features with JavaScript
- Graceful degradation

## ⚡ Performance Features

### Loading States
- Skeleton screens for all widgets
- Progressive data loading
- Error state handling

### Optimization
- Lazy loading for charts
- Memoized components
- Efficient re-renders

## 🔧 Customization

### Widget Configuration
Widgets can be easily configured and extended:

```javascript
const customWidget = {
  id: 'custom_metric',
  title: 'Custom Metric',
  value: '42',
  icon: CustomIcon,
  color: 'bg-purple-500',
  onClick: handleClick
}
```

### Layout Customization
Dashboard layouts can be modified by:
- Adding new layout modes
- Configuring widget positions
- Adjusting responsive breakpoints

## 🚀 Future Enhancements

### Planned Features
- **Drag & Drop**: Widget repositioning
- **Custom Widgets**: User-created widgets
- **Themes**: Multiple color schemes
- **Export**: Dashboard export functionality
- **Real-time**: WebSocket integration

### Widget Roadmap
- **Calendar Widget**: Upcoming events
- **Map Widget**: Location-based data
- **Progress Widget**: Goal tracking
- **Table Widget**: Data tables

## 📊 Data Integration

### Mock Data Structure
Current widgets use mock data that follows the expected API format:

```javascript
// Stats Data
{
  id: 'unique_id',
  title: 'Display Title',
  value: 'Metric Value',
  subtitle: 'Additional Info',
  trend: 'up|down|same',
  trendValue: 'Trend Description'
}

// Activity Data
{
  id: 'unique_id',
  type: 'activity_type',
  title: 'Activity Title',
  description: 'Activity Description',
  user: 'User Name',
  timestamp: Date,
  status: 'completed|pending|failed'
}
```

### API Integration Points
Replace mock data functions with actual API calls:
- `getStatsData()` → API endpoint
- `getAlertsData()` → API endpoint
- `getActivitiesData()` → API endpoint
- `getChartsData()` → API endpoint

---

**Next**: Integrate with real backend data and add real-time updates via WebSocket connections. 