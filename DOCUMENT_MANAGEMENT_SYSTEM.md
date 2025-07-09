# Document Management System Documentation

## Overview
The Document Management System provides centralized storage, organization, and management of all compliance-related documents. Built with React and Supabase, it offers enterprise-grade features for document lifecycle management.

## Features

### Core Features
- **Centralized Storage**: All documents stored securely in Supabase with organized folder structure
- **Document Categories**: 10 predefined categories (Policy, Procedure, Permits, Certificates, etc.)
- **Version Control**: Track document versions with change notes and history
- **Access Control**: Public/private document access with role-based permissions
- **Search & Filter**: Advanced search with full-text search and category filtering
- **Metadata Management**: Rich metadata including tags, descriptions, and custom fields
- **File Upload**: Drag & drop upload with progress tracking and validation
- **Document Preview**: In-browser preview for supported file types
- **Approval Workflow**: Document approval process with audit trails
- **Bilingual Support**: English and Khmer language support

### Technical Features
- **File Types**: PDF, Word, Excel, Images, Text files (up to 50MB each)
- **Storage**: Supabase Storage with CDN delivery
- **Database**: PostgreSQL with Row Level Security
- **Real-time**: Real-time updates and notifications
- **Mobile**: Responsive design with mobile optimization
- **Audit Trail**: Complete audit logging for compliance

## Component Architecture

### Main Components

#### 1. Documents.jsx
- **Purpose**: Main integration component with navigation and statistics
- **Features**: 
  - Header with document count and storage usage
  - Navigation tabs (Manager, Analytics, Categories)
  - Statistics dashboard integration
- **Props**: `user`, `organizationId`

#### 2. DocumentManager.jsx
- **Purpose**: Primary document management interface
- **Features**:
  - Grid and list view modes
  - Search and filtering capabilities
  - Bulk operations (delete, download)
  - Document selection and management
  - Statistics overview
- **Props**: `user`, `organizationId`

#### 3. DocumentUpload.jsx
- **Purpose**: Advanced document upload component
- **Features**:
  - Drag & drop file upload
  - Multiple file selection
  - Metadata capture (title, description, tags)
  - File validation and progress tracking
  - Document categorization
- **Props**: `organizationId`, `user`, `onSuccess`, `onCancel`

#### 4. DocumentViewer.jsx
- **Purpose**: Detailed document viewing and management
- **Features**:
  - Document preview (images, PDFs)
  - Metadata display
  - Version history
  - Approval workflow
  - Sharing capabilities
  - Download functionality
- **Props**: `documentId`, `user`, `onClose`, `onEdit`, `onDelete`

## Database Schema

### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  title_khmer TEXT,
  description TEXT,
  description_khmer TEXT,
  document_type VARCHAR(50) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(100),
  version VARCHAR(20) DEFAULT '1.0',
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Document Versions Table
```sql
CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL,
  file_url TEXT NOT NULL,
  change_notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## API Functions

### Document Management
- `getDocumentsByOrganization(organizationId, filters)` - Get documents with filtering
- `getDocumentById(documentId)` - Get single document with details
- `createDocument(documentData)` - Create new document record
- `updateDocumentMetadata(documentId, documentData)` - Update document metadata
- `deleteDocument(documentId, userId, organizationId)` - Delete document and file
- `getDocumentStatistics(organizationId)` - Get document statistics
- `getDocumentCategories(organizationId)` - Get document categories
- `searchDocuments(organizationId, searchQuery, filters)` - Search documents

### Version Management
- `getDocumentVersions(documentId)` - Get document version history
- `createDocumentVersion(documentId, versionData)` - Create new version
- `approveDocument(documentId, approverId)` - Approve document

### File Operations
- `uploadDocument(file, documentType, organizationId)` - Upload file to storage

## Usage Examples

### Basic Implementation
```jsx
import Documents from './components/documents/Documents'

function App() {
  return (
    <Documents 
      user={currentUser} 
      organizationId={currentOrganization.id} 
    />
  )
}
```

### Standalone Document Manager
```jsx
import DocumentManager from './components/documents/DocumentManager'

function CompliancePage() {
  return (
    <DocumentManager 
      user={currentUser} 
      organizationId={currentOrganization.id} 
    />
  )
}
```

### Custom Upload Component
```jsx
import DocumentUpload from './components/documents/DocumentUpload'

function UploadModal() {
  const handleSuccess = () => {
    console.log('Documents uploaded successfully')
    // Refresh document list
  }

  return (
    <DocumentUpload
      organizationId={currentOrganization.id}
      user={currentUser}
      onSuccess={handleSuccess}
      onCancel={() => setShowUpload(false)}
    />
  )
}
```

## Document Categories

### Predefined Categories
1. **Policy Documents** (`policy`) - Company policies and guidelines
2. **Procedures** (`procedure`) - Standard operating procedures
3. **Permits & Licenses** (`permit`) - Government permits and licenses
4. **Certificates** (`certificate`) - Certification documents
5. **Audit Reports** (`audit_report`) - Internal and external audit reports
6. **Training Materials** (`training_material`) - Educational content
7. **Meeting Minutes** (`meeting_minutes`) - Committee and meeting records
8. **Form Templates** (`form_template`) - Standard forms and templates
9. **Legal Documents** (`legal_document`) - Contracts and legal papers
10. **Other Documents** (`other`) - Miscellaneous documents

## File Upload Specifications

### Supported File Types
- **Documents**: PDF, DOC, DOCX, TXT, RTF
- **Spreadsheets**: XLS, XLSX, CSV
- **Images**: JPG, JPEG, PNG, GIF, BMP
- **Archives**: ZIP, RAR (if needed)

### File Size Limits
- **Maximum Size**: 50MB per file
- **Bulk Upload**: Up to 10 files simultaneously
- **Storage Quota**: Configurable per organization

### Validation Rules
- File type validation based on MIME types
- Virus scanning (if implemented)
- Duplicate file detection
- Metadata validation (title, category required)

## Security Features

### Access Control
- **Row Level Security**: Database-level access control
- **Role-Based Access**: Different permissions by user role
- **Organization Isolation**: Documents isolated by organization
- **Public/Private Settings**: Document-level access control

### Audit Trail
- **Document Actions**: Create, update, delete, approve, download
- **User Attribution**: All actions logged with user information
- **Timestamp Tracking**: Precise timing of all actions
- **Change Detection**: Before/after state tracking

## Performance Optimizations

### File Storage
- **CDN Delivery**: Fast file delivery through Supabase CDN
- **Compression**: Automatic file compression where applicable
- **Lazy Loading**: Progressive loading of document lists
- **Caching**: Browser caching for improved performance

### Database Optimization
- **Indexes**: Optimized database indexes for search performance
- **Pagination**: Efficient pagination for large document sets
- **Query Optimization**: Optimized database queries
- **Connection Pooling**: Efficient database connection management

## Integration Points

### Compliance Dashboard
- Document statistics and metrics
- Recent document activity
- Expiring document alerts
- Compliance score contribution

### Permit System
- Automatic permit document association
- Renewal document requirements
- Compliance status tracking
- Alert integration

### Audit System
- Audit report storage
- Finding documentation
- Corrective action documentation
- Evidence management

## Future Enhancements

### Planned Features
- **AI-Powered Search**: Semantic search capabilities
- **OCR Text Extraction**: Extract text from scanned documents
- **Advanced Analytics**: Document usage analytics
- **Workflow Automation**: Automated document routing
- **Digital Signatures**: Electronic signature integration
- **Collaboration Tools**: Document commenting and review
- **Template System**: Document template management
- **Bulk Operations**: Advanced bulk editing capabilities

### Integration Opportunities
- **Third-party Storage**: Integration with Google Drive, OneDrive
- **Email Integration**: Email document attachments
- **Calendar Integration**: Document deadline tracking
- **Mobile Apps**: Native mobile applications
- **API Endpoints**: RESTful API for external integrations

## Troubleshooting

### Common Issues
1. **Upload Failures**: Check file size limits and supported formats
2. **Preview Issues**: Ensure file is accessible and format is supported
3. **Search Problems**: Verify database indexes and search syntax
4. **Permission Errors**: Check user roles and document access settings
5. **Storage Issues**: Monitor storage quota and usage

### Error Handling
- **Graceful Degradation**: System continues functioning with reduced features
- **User Feedback**: Clear error messages and recovery suggestions
- **Logging**: Comprehensive error logging for debugging
- **Fallback Options**: Alternative methods when primary features fail

## Maintenance

### Regular Tasks
- **Database Cleanup**: Remove orphaned records and files
- **Storage Monitoring**: Track storage usage and costs
- **Performance Monitoring**: Monitor query performance and optimization
- **Security Updates**: Keep dependencies and libraries updated
- **Backup Verification**: Ensure backups are working correctly

### Monitoring Metrics
- **Upload Success Rate**: Track successful uploads vs failures
- **Search Performance**: Monitor search query response times
- **User Activity**: Track document access and usage patterns
- **Storage Growth**: Monitor storage usage trends
- **Error Rates**: Track and analyze error patterns

This document management system provides a robust foundation for compliance document management with room for future enhancements and integrations. 