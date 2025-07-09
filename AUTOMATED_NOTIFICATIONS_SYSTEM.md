# Automated Alerts & Notifications System Documentation

## Overview
The Automated Alerts & Notifications System provides intelligent, multi-channel notification delivery for compliance management. Built with React and Supabase, it offers enterprise-grade features for notification automation, user preferences, and delivery tracking.

## Features

### Core Features
- **Multi-Channel Delivery**: Email, SMS, Push notifications, and In-app alerts
- **Intelligent Scheduling**: Automated notification scheduling based on rules and events
- **User Preferences**: Granular notification settings per user and notification type
- **Notification Engine**: Background processing with queue management and retry logic
- **Real-time Updates**: Live notification updates and status tracking
- **Priority Handling**: High, medium, and low priority notification routing
- **Quiet Hours**: User-configurable quiet hours to pause notifications
- **Bulk Operations**: Mass notification management and actions
- **Audit Trail**: Complete logging of all notification activities
- **Bilingual Support**: English and Khmer language support

### Technical Features
- **Queue Processing**: Background job processing for reliable delivery
- **Rule Engine**: Configurable rules for automated notification generation
- **Escalation**: Automatic escalation for critical notifications
- **Rate Limiting**: Prevent notification spam and rate limiting
- **Delivery Tracking**: Success/failure tracking with retry mechanisms
- **Integration Points**: Seamless integration with permits, documents, and audits
- **Mobile Ready**: Progressive Web App notifications support
- **API Integration**: Ready for external email/SMS service integration

## Component Architecture

### Main Components

#### 1. Notifications.jsx
- **Purpose**: Main integration component with navigation and overview
- **Features**: 
  - Header with unread count and weekly statistics
  - Navigation tabs (Center, Engine, Settings, Analytics)
  - Statistics dashboard integration
- **Props**: `user`, `organizationId`

#### 2. NotificationCenter.jsx
- **Purpose**: Central notification management interface
- **Features**:
  - Notification list with filtering and search
  - Mark as read/unread functionality
  - Bulk operations (delete, archive)
  - Statistics overview
  - Tabbed view (All, Unread, Read)
- **Props**: `user`, `organizationId`

#### 3. NotificationSettings.jsx
- **Purpose**: User notification preferences management
- **Features**:
  - General notification settings
  - Channel preferences (Email, SMS, Push, In-app)
  - Quiet hours configuration
  - Notification frequency settings
  - Per-type channel configuration
- **Props**: `user`, `onClose`

#### 4. NotificationEngine.jsx
- **Purpose**: Notification automation and rule management
- **Features**:
  - Engine status monitoring
  - Scheduled notifications queue
  - Notification rules management
  - Processing metrics and analytics
  - Manual queue processing
- **Props**: `user`, `organizationId`

## Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  recipient_id UUID REFERENCES users(id),
  sender_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  priority VARCHAR(10) DEFAULT 'low' CHECK (priority IN ('low', 'medium', 'high')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Notification Settings Table
```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  push_notifications BOOLEAN DEFAULT true,
  in_app_notifications BOOLEAN DEFAULT true,
  notification_frequency VARCHAR(20) DEFAULT 'real_time',
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  channels JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Scheduled Notifications Table
```sql
CREATE TABLE scheduled_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  notification_id UUID REFERENCES notifications(id),
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  notification_type VARCHAR(50) NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Notification Rules Table
```sql
CREATE TABLE notification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trigger_type VARCHAR(50) NOT NULL,
  condition JSONB NOT NULL,
  action JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  last_run TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## API Functions

### Core Notification Management
- `getNotificationsByUser(userId, organizationId, filters)` - Get user notifications with filtering
- `markNotificationAsRead(notificationId, userId)` - Mark notification as read
- `markAllNotificationsAsRead(userId, organizationId)` - Mark all notifications as read
- `deleteNotification(notificationId, userId)` - Delete single notification
- `createNotification(notificationData)` - Create new notification
- `getNotificationStatistics(userId, organizationId)` - Get notification statistics

### Settings Management
- `getNotificationSettings(userId)` - Get user notification settings
- `updateNotificationSettings(userId, settings)` - Update user preferences
- `getNotificationChannels()` - Get available notification channels

### Engine & Processing
- `getScheduledNotifications(organizationId)` - Get scheduled notification queue
- `createScheduledNotification(scheduledData)` - Schedule notification for delivery
- `processNotificationQueue(organizationId)` - Process pending notifications
- `getNotificationMetrics(organizationId)` - Get processing metrics

### Rules Management
- `getNotificationRules(organizationId)` - Get notification automation rules
- `createNotificationRule(ruleData)` - Create new automation rule

### Automated Helpers
- `createPermitExpiryNotification(permit, organizationId)` - Auto-generate permit expiry alerts
- `createDocumentApprovalNotification(document, organizationId, approverId)` - Document approval alerts
- `createComplianceAlertNotification(alertData, organizationId)` - Compliance violation alerts

## Usage Examples

### Basic Implementation
```jsx
import Notifications from './components/notifications/Notifications'

function App() {
  return (
    <Notifications 
      user={currentUser} 
      organizationId={currentOrganization.id} 
    />
  )
}
```

### Standalone Notification Center
```jsx
import NotificationCenter from './components/notifications/NotificationCenter'

function Dashboard() {
  return (
    <NotificationCenter 
      user={currentUser} 
      organizationId={currentOrganization.id} 
    />
  )
}
```

### Creating Custom Notifications
```jsx
import { createNotification } from './lib/supabase-enhanced'

const sendCustomAlert = async () => {
  const notificationData = {
    organization_id: organizationId,
    recipient_id: userId,
    type: 'custom_alert',
    priority: 'high',
    title: 'Important Update',
    message: 'This is a custom notification message',
    send_immediately: true
  }

  const result = await createNotification(notificationData)
  if (result.success) {
    console.log('Notification sent successfully')
  }
}
```

### Automated Permit Expiry Alerts
```jsx
import { createPermitExpiryNotification } from './lib/supabase-enhanced'

const checkPermitExpiry = async (permit) => {
  const result = await createPermitExpiryNotification(permit, organizationId)
  if (result.success) {
    console.log('Permit expiry notification created')
  }
}
```

## Notification Types

### Predefined Types
1. **Permit Expiry** (`permit_expiry`) - Permit expiration warnings
2. **Permit Renewal** (`permit_renewal`) - Permit renewal reminders
3. **Document Approval** (`document_approval`) - Document approval requests
4. **Document Update** (`document_update`) - Document change notifications
5. **Audit Scheduled** (`audit_scheduled`) - Audit scheduling alerts
6. **Audit Reminder** (`audit_reminder`) - Audit preparation reminders
7. **Compliance Alert** (`compliance_alert`) - Critical compliance issues
8. **System Notification** (`system_notification`) - System updates and maintenance
9. **User Invitation** (`user_invitation`) - User invitation notifications

### Priority Levels
- **High Priority**: Critical alerts requiring immediate attention
- **Medium Priority**: Important notifications requiring timely action
- **Low Priority**: Informational notifications for awareness

## Notification Channels

### Supported Channels
1. **Email** - Traditional email notifications
2. **SMS** - Text message notifications (integration ready)
3. **Push Notifications** - Browser/mobile push notifications
4. **In-App** - Application-based notifications

### Channel Configuration
- **Per-User Settings**: Individual channel preferences
- **Per-Type Settings**: Different channels for different notification types
- **Fallback Logic**: Automatic fallback to alternative channels
- **Delivery Confirmation**: Track delivery success/failure

## Automation Rules

### Rule Types
1. **Time-based Rules**: Scheduled notifications based on dates/times
2. **Event-based Rules**: Triggered by system events
3. **Condition-based Rules**: Based on data conditions and thresholds
4. **Escalation Rules**: Automatic escalation for unread critical notifications

### Rule Configuration
```json
{
  "trigger_type": "permit_expiry",
  "condition": {
    "days_before_expiry": 30,
    "permit_types": ["environmental", "safety"]
  },
  "action": {
    "notification_type": "permit_expiry",
    "priority": "medium",
    "channels": ["email", "in_app"],
    "escalate_after_hours": 24
  }
}
```

## Quiet Hours Feature

### Configuration Options
- **Enabled/Disabled**: Toggle quiet hours functionality
- **Start/End Times**: Configurable time range (e.g., 10 PM - 8 AM)
- **Channel-Specific**: Different quiet hours for different channels
- **Override for Critical**: High-priority notifications can override quiet hours

### Implementation
```javascript
const isQuietHours = (userSettings) => {
  if (!userSettings.quiet_hours_enabled) return false
  
  const now = new Date()
  const currentTime = now.toTimeString().substring(0, 5)
  const startTime = userSettings.quiet_hours_start
  const endTime = userSettings.quiet_hours_end
  
  return currentTime >= startTime || currentTime <= endTime
}
```

## Notification Queue Processing

### Processing Logic
1. **Queue Discovery**: Find notifications ready for delivery
2. **User Preferences**: Check user notification settings
3. **Quiet Hours**: Respect user quiet hours (except critical alerts)
4. **Channel Selection**: Choose appropriate delivery channels
5. **Delivery**: Send notification via selected channels
6. **Tracking**: Update delivery status and timestamps
7. **Retry Logic**: Retry failed deliveries with exponential backoff

### Processing Metrics
- **Success Rate**: Percentage of successfully delivered notifications
- **Processing Time**: Average time to process notifications
- **Queue Length**: Number of pending notifications
- **Failure Rate**: Percentage of failed deliveries

## Integration Points

### Permit System Integration
- Automatic expiry notifications based on permit dates
- Renewal reminder sequences
- Compliance status change alerts
- Document upload notifications

### Document System Integration
- Document approval workflow notifications
- Version update alerts
- Access permission changes
- Storage quota warnings

### Audit System Integration
- Audit scheduling notifications
- Finding alerts and reminders
- Corrective action due dates
- Compliance score changes

## External Service Integration

### Email Service Integration
```javascript
// Example integration with SendGrid
const sendEmailNotification = async (notification, recipient) => {
  const emailData = {
    to: recipient.email,
    subject: notification.title,
    html: generateEmailTemplate(notification),
    from: 'notifications@angkorcompliance.com'
  }
  
  return await sendGridClient.send(emailData)
}
```

### SMS Service Integration
```javascript
// Example integration with Twilio
const sendSMSNotification = async (notification, recipient) => {
  const smsData = {
    to: recipient.phone,
    body: `${notification.title}: ${notification.message}`,
    from: '+1234567890'
  }
  
  return await twilioClient.messages.create(smsData)
}
```

## Performance Optimizations

### Database Optimization
- **Indexes**: Optimized indexes for notification queries
- **Partitioning**: Time-based partitioning for large notification tables
- **Archival**: Automatic archival of old notifications
- **Cleanup**: Periodic cleanup of processed notifications

### Queue Processing
- **Batch Processing**: Process notifications in batches for efficiency
- **Parallel Processing**: Multiple workers for high-volume processing
- **Rate Limiting**: Prevent service overload with rate limiting
- **Circuit Breaker**: Fault tolerance for external service failures

## Security Features

### Data Protection
- **Encryption**: Encrypted notification content at rest
- **Access Control**: Role-based access to notification management
- **Audit Logging**: Complete audit trail of notification activities
- **Data Retention**: Configurable data retention policies

### Privacy Compliance
- **Opt-out Options**: User ability to opt out of non-critical notifications
- **Data Minimization**: Store only necessary notification data
- **Consent Management**: Track user consent for different notification types
- **GDPR Compliance**: Support for data export and deletion requests

## Monitoring & Analytics

### Key Metrics
- **Delivery Rate**: Percentage of notifications successfully delivered
- **Open Rate**: Percentage of notifications read by users
- **Response Time**: Time from creation to delivery
- **User Engagement**: User interaction with notifications
- **Channel Performance**: Effectiveness of different delivery channels

### Alerting
- **System Health**: Monitor notification system health
- **Queue Backlog**: Alert when queue grows too large
- **Delivery Failures**: Alert on high failure rates
- **Processing Delays**: Alert on processing delays

## Troubleshooting

### Common Issues
1. **Notifications Not Delivered**: Check user settings and quiet hours
2. **High Queue Backlog**: Review processing capacity and external service health
3. **Email Delivery Issues**: Verify email service configuration and quotas
4. **SMS Delivery Issues**: Check SMS service credentials and phone number format
5. **Performance Issues**: Review database indexes and query optimization

### Error Handling
- **Graceful Degradation**: System continues functioning with reduced features
- **User Feedback**: Clear error messages and recovery options
- **Logging**: Comprehensive error logging for debugging
- **Fallback**: Alternative delivery methods when primary channels fail

## Future Enhancements

### Planned Features
- **Rich Notifications**: Support for rich content (images, buttons, actions)
- **Notification Templates**: Customizable notification templates
- **A/B Testing**: Test different notification strategies
- **Advanced Analytics**: Deep analytics and user behavior insights
- **Machine Learning**: AI-powered optimization of notification delivery
- **Webhook Support**: Webhook notifications for external integrations
- **Mobile App**: Native mobile app with push notification support
- **Slack/Teams Integration**: Integration with workplace communication tools

### Scalability Improvements
- **Microservices**: Split notification system into microservices
- **Message Queues**: Use dedicated message queue services (Redis, RabbitMQ)
- **Distributed Processing**: Multi-server processing for high volume
- **CDN Integration**: Content delivery network for rich notifications
- **Load Balancing**: Distributed load across multiple notification servers

This automated alerts and notifications system provides a robust foundation for compliance communication with comprehensive automation, user control, and enterprise-grade reliability. 