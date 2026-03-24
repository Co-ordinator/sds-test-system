# SDS Test System - System Design Document

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Data Model](#data-model)
6. [API Design](#api-design)
7. [Security Architecture](#security-architecture)
8. [Authentication & Authorization](#authentication--authorization)
9. [Frontend Architecture](#frontend-architecture)
10. [Backend Architecture](#backend-architecture)
11. [Database Design](#database-design)
12. [Integration Patterns](#integration-patterns)
13. [Performance Considerations](#performance-considerations)
14. [Scalability](#scalability)
15. [Deployment Architecture](#deployment-architecture)
16. [Monitoring & Logging](#monitoring--logging)
17. [Error Handling](#error-handling)
18. [Testing Strategy](#testing-strategy)
19. [Data Migration Strategy](#data-migration-strategy)
20. [Compliance & Governance](#compliance--governance)

---

## System Overview

### Purpose
The Online Self-Directed Search (SDS) Test System is a comprehensive career assessment platform designed for the Ministry of Labour and Social Security of the Kingdom of Eswatini. The system implements Holland's RIASEC model to help individuals identify suitable career paths based on their interests, abilities, and personality traits.

### Key Business Requirements
- **Career Assessment**: Implement the complete SDS questionnaire with RIASEC scoring
- **User Management**: Support multiple user types with role-based access control
- **Institution Integration**: Link with local educational institutions and employers
- **Reporting & Analytics**: Comprehensive analytics for administrators and counselors
- **Data Protection**: Compliance with Eswatini Data Protection Act 2022
- **Multi-language Support**: English and siSwati language support
- **Accessibility**: WCAG 2.1 AA compliance for inclusive access

### Stakeholders
- **Test Takers**: High school students, university students, and professionals
- **Test Administrators**: School counselors and career guidance professionals
- **System Administrators**: Ministry staff managing the system
- **Institutions**: Educational institutions and employers
- **Ministry of Labour**: Government oversight and policy makers

---

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (React SPA)   │◄──►│   (Express.js)  │◄──►│   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
    ┌─────────┐            ┌─────────┐            ┌─────────┐
    │  CDN    │            │  File   │            │  Audit  │
    │ (Assets)│            │ Storage │            │  Logs   │
    └─────────┘            └─────────┘            └─────────┘
```

### Architectural Patterns
- **Model-View-Controller (MVC)**: Backend follows MVC pattern with service layer
- **Component-Based Architecture**: Frontend uses React components with hooks
- **Repository Pattern**: Data access abstracted through Sequelize ORM
- **Service Layer Pattern**: Business logic separated from controllers
- **Middleware Pattern**: Express middleware for cross-cutting concerns
- **Observer Pattern**: Event-driven audit logging

### Design Principles
- **Separation of Concerns**: Clear boundaries between layers
- **Single Responsibility**: Each component has one clear purpose
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Open/Closed Principle**: Open for extension, closed for modification
- **Don't Repeat Yourself (DRY)**: Reusable components and utilities

---

## Technology Stack

### Frontend Stack
- **React 18**: Modern React with hooks and concurrent features
- **React Router v6**: Client-side routing with lazy loading
- **Tailwind CSS**: Utility-first CSS framework with custom design system
- **Lucide React**: Icon library for consistent UI
- **Axios**: HTTP client with interceptors and retry logic
- **React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **React PDF**: PDF generation for certificates and reports

### Backend Stack
- **Node.js 18+**: JavaScript runtime with ES2022 features
- **Express.js 4**: Web application framework
- **Sequelize 6**: ORM with PostgreSQL dialect
- **PostgreSQL 14+**: Primary database with JSONB support
- **JWT**: Stateless authentication with refresh tokens
- **bcrypt**: Password hashing with 10-round salt
- **Winston**: Structured logging with multiple transports
- **Multer**: File upload handling with validation
- **PDFKit**: PDF generation for certificates and reports

### Development Tools
- **Jest**: Unit testing framework
- **Cypress**: End-to-end testing
- **ESLint**: Code linting with React/Node configurations
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **nodemon**: Development server with hot reload

---

## System Components

### Frontend Components

#### Core Application Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Button, Input, etc.)
│   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   └── common/          # Shared business components
├── features/            # Feature-specific components
│   ├── admin/          # Administration features
│   ├── counselor/      # Counselor features
│   ├── assessment/     # Assessment features
│   └── analytics/      # Analytics features
├── pages/              # Route-level components
├── services/           # API service layer
├── hooks/              # Custom React hooks
├── context/            # React context providers
└── utils/              # Utility functions
```

#### Key Features
- **Authentication System**: Login, registration, password reset
- **Assessment Engine**: Interactive SDS questionnaire with progress tracking
- **Results Dashboard**: Career recommendations with detailed reports
- **Admin Panels**: User management, content management, analytics
- **Counselor Tools**: Student management, import/export, reporting
- **Profile Management**: User profile with qualifications and preferences

### Backend Components

#### Service Architecture
```
src/
├── controllers/        # HTTP request handlers
├── services/          # Business logic layer
├── models/            # Database models and associations
├── routes/            # API route definitions
├── middleware/        # Express middleware
├── utils/             # Utility functions
├── validations/        # Input validation schemas
└── templates/         # Email and PDF templates
```

#### Core Services
- **Authentication Service**: JWT token management, password handling
- **Assessment Service**: Test creation, progress tracking, scoring
- **User Service**: User management, profile updates, permissions
- **Analytics Service**: Data aggregation, reporting, insights
- **Notification Service**: Email notifications, system alerts
- **File Service**: Document upload, storage, retrieval
- **Audit Service**: Comprehensive audit trail logging

---

## Data Model

### Core Entities

#### User Management
- **Users**: Central user entity with role-based access
- **Permissions**: Granular permission system (49 permissions)
- **UserPermissions**: Many-to-many relationship
- **EducationLevels**: Educational attainment levels
- **Institutions**: Schools, universities, and employers
- **Occupations**: Career occupations with Holland codes

#### Assessment System
- **Assessments**: Test sessions with progress tracking
- **Questions**: SDS questionnaire items
- **Answers**: User responses with RIASEC scoring
- **Results**: Processed assessment results with recommendations
- **Certificates**: Generated completion certificates

#### Content Management
- **Subjects**: Academic subjects with RIASEC mappings
- **Courses**: Educational courses with institution links
- **CourseRequirements**: Prerequisites and requirements
- **SchoolStudents**: Bulk-imported student records

#### Audit & Compliance
- **AuditLogs**: Complete system activity logging
- **UserQualifications**: User-uploaded qualification documents

### Relationship Overview
```
Users ──┬──► Assessments ──► Answers ──► Questions
        │                      │
        └──► Results           └──► Subjects
        │
        ├──► Institutions ◄───┬──► Courses
        │                     │
        └──► Occupations ◄────┘
```

---

## API Design

### RESTful API Structure
```
/api/v1/
├── auth/              # Authentication endpoints
├── assessments/       # Assessment management
├── users/             # User management (admin)
├── admin/             # Administrative functions
├── counselor/         # Counselor functions
├── institutions/      # Institution management
├── occupations/       # Occupation data
├── analytics/         # Analytics and reporting
├── notifications/     # System notifications
├── certificates/      # Certificate management
└── qualifications/    # User qualifications
```

### API Design Principles
- **Resource-Oriented**: Clear resource hierarchy and naming
- **HTTP Semantics**: Proper use of HTTP verbs and status codes
- **Consistent Responses**: Standardized response format
- **Versioning**: API versioning via URL path
- **Documentation**: Comprehensive API documentation
- **Error Handling**: Consistent error response format

### Response Format
```json
{
  "status": "success|error",
  "data": {...},
  "message": "Human-readable message",
  "errors": [...] // Validation errors only
}
```

---

## Security Architecture

### Defense in Depth
1. **Network Security**: HTTPS, CORS, security headers
2. **Application Security**: Input validation, SQL injection prevention
3. **Authentication Security**: JWT with refresh tokens, password policies
4. **Authorization Security**: Role-based access control with granular permissions
5. **Data Security**: Encryption at rest and in transit
6. **Audit Security**: Comprehensive logging and monitoring

### Security Controls
- **Helmet.js**: Security headers (CSP, HSTS, XSS protection)
- **Rate Limiting**: Request throttling per IP and endpoint
- **Input Validation**: Joi schemas for all input data
- **SQL Injection Prevention**: Sequelize ORM with parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CSRF Protection**: SameSite cookies and CSRF tokens

### Data Protection
- **Encryption**: AES-256 for sensitive data at rest
- **Hashing**: bcrypt (10 rounds) for passwords
- **Token Security**: JWT with RS256 signing and short expiration
- **PII Protection**: Minimal data collection and purpose limitation
- **Data Retention**: Configurable retention policies
- **Right to Erasure**: Complete data deletion capabilities

---

## Authentication & Authorization

### Authentication Flow
```
1. User submits credentials
2. Backend validates credentials
3. JWT access token + refresh token issued
4. Access token stored in memory (not localStorage)
5. Refresh token stored in httpOnly cookie
6. Automatic token refresh on expiry
```

### JWT Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "Test Taker",
  "permissions": ["assessments.view", "results.view"],
  "iat": 1640995200,
  "exp": 1640998800
}
```

### Role-Based Access Control (RBAC)
- **System Administrator**: Full system access (49 permissions)
- **Test Administrator**: Test taker management (16 permissions)
- **Test Taker**: Assessment access (basic permissions)

### Permission Matrix
13 modules with 49 granular permissions:
- **users**: view, create, update, delete, export
- **institutions**: view, create, update, delete, export, import
- **questions**: view, create, update, delete, import, export
- **occupations**: view, create, update, delete, import, export
- **subjects**: view, create, update, delete, import, export
- **assessments**: view, create, update, delete, export
- **results**: view, export
- **analytics**: view, export
- **audit**: view
- **notifications**: view, manage
- **certificates**: view, generate, download
- **permissions**: view, manage
- **test_takers**: manage

---

## Frontend Architecture

### Component Architecture
- **Atomic Design**: Atoms → Molecules → Organisms → Templates → Pages
- **Component Composition**: Reusable components with props composition
- **State Management**: Local state + React Query for server state
- **Error Boundaries**: Graceful error handling at component level
- **Code Splitting**: Lazy loading for optimal performance

### State Management
```javascript
// Local Component State
const [loading, setLoading] = useState(false);

// Server State with React Query
const { data, error, isLoading } = useQuery({
  queryKey: ['assessments'],
  queryFn: assessmentService.getAssessments
});

// Global Context
const { user, logout } = useAuth();
```

### Routing Strategy
- **Protected Routes**: Authentication and authorization guards
- **Lazy Loading**: Code splitting for better performance
- **Route-based Code Splitting**: Dynamic imports per route
- **Breadcrumb Navigation**: Automatic breadcrumb generation
- **Route Guards**: Role-based access control

### Performance Optimizations
- **Memoization**: React.memo, useMemo, useCallback
- **Virtual Scrolling**: For large data tables
- **Image Optimization**: Lazy loading and compression
- **Bundle Optimization**: Tree shaking and minification
- **Caching Strategy**: Service worker and browser caching

---

## Backend Architecture

### Service Layer Pattern
```
Controller → Service → Model → Database
     ↓           ↓         ↓
Validation  Business  Data Access
Logic       Logic     Logic
```

### Controller Responsibilities
- HTTP request/response handling
- Input validation and sanitization
- Authentication and authorization
- Error handling and logging
- Response formatting

### Service Responsibilities
- Business logic implementation
- Data transformation
- External service integration
- Complex query orchestration
- Transaction management

### Model Responsibilities
- Database schema definition
- Data validation rules
- Association definitions
- Query scopes and methods

### Middleware Stack
1. **Request Logging**: Winston request logger
2. **Rate Limiting**: Express-rate-limit
3. **Security Headers**: Helmet.js
4. **CORS**: Cross-origin resource sharing
5. **Authentication**: JWT verification middleware
6. **Authorization**: Permission-based access control
7. **Validation**: Input validation middleware
8. **Error Handling**: Global error handler

---

## Database Design

### Database Schema
- **PostgreSQL 14+**: Primary database with advanced features
- **UUID Primary Keys**: Distributed-friendly primary keys
- **JSONB Fields**: Flexible data storage for complex objects
- **Indexes**: Optimized query performance
- **Constraints**: Data integrity enforcement
- **Triggers**: Automated data validation and audit

### Key Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  user_type VARCHAR(50),
  national_id VARCHAR(13) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  date_of_birth DATE,
  gender VARCHAR(20),
  institution_id UUID REFERENCES institutions(id),
  current_occupation_id UUID REFERENCES occupations(id),
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Assessments Table
```sql
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  status VARCHAR(20) NOT NULL,
  progress INTEGER DEFAULT 0,
  holland_code VARCHAR(3),
  score_r INTEGER,
  score_i INTEGER,
  score_a INTEGER,
  score_s INTEGER,
  score_e INTEGER,
  score_c INTEGER,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Database Relationships
- **One-to-Many**: User → Assessments, Institution → Users
- **Many-to-Many**: User → Permissions, Course → Institutions
- **One-to-One**: User → CurrentOccupation, Assessment → Results
- **Polymorphic**: AuditLogs (can reference any entity)

### Performance Optimizations
- **Indexing Strategy**: Composite indexes for common queries
- **Query Optimization**: Efficient joins and subqueries
- **Connection Pooling**: PgBouncer for connection management
- **Read Replicas**: Read scaling for analytics queries
- **Partitioning**: Time-based partitioning for large tables

---

## Integration Patterns

### External Integrations
- **Email Service**: SMTP for notifications and verification
- **File Storage**: Local filesystem with cloud storage readiness
- **PDF Generation**: PDFKit for certificates and reports
- **CSV Processing**: Stream processing for large imports
- **Analytics**: Built-in analytics with external service readiness

### Integration Patterns
- **Repository Pattern**: Abstract data access layer
- **Service Locator**: Dependency injection container
- **Observer Pattern**: Event-driven architecture for audit logs
- **Strategy Pattern**: Different authentication strategies
- **Factory Pattern**: Database connection and model creation

### API Integration
- **RESTful Design**: Standard HTTP methods and status codes
- **Versioning**: URL-based versioning strategy
- **Documentation**: OpenAPI/Swagger specification
- **Rate Limiting**: Protection against abuse
- **Caching**: Redis-ready caching layer

---

## Performance Considerations

### Frontend Performance
- **Bundle Size Optimization**: Code splitting and tree shaking
- **Lazy Loading**: Components and routes loaded on demand
- **Image Optimization**: WebP format and lazy loading
- **Caching Strategy**: Service worker implementation
- **Network Optimization**: HTTP/2 and compression

### Backend Performance
- **Database Optimization**: Query optimization and indexing
- **Caching Layer**: Redis-ready implementation
- **Connection Pooling**: Database connection management
- **Async Processing**: Background job processing
- **Load Balancing**: Horizontal scaling readiness

### Monitoring Metrics
- **Response Time**: API endpoint performance
- **Throughput**: Requests per second
- **Error Rate**: Application error tracking
- **Database Performance**: Query execution time
- **Memory Usage**: Application memory consumption
- **CPU Usage**: Processor utilization

---

## Scalability

### Horizontal Scaling
- **Stateless Design**: Easy horizontal scaling
- **Load Balancing**: Multiple instance support
- **Database Scaling**: Read replicas and sharding readiness
- **File Storage**: Distributed storage readiness
- **Session Management**: JWT stateless authentication

### Vertical Scaling
- **Resource Optimization**: Efficient resource utilization
- **Memory Management**: Proper memory cleanup
- **CPU Optimization**: Efficient algorithms and data structures
- **I/O Optimization**: Async I/O operations

### Capacity Planning
- **Concurrent Users**: 500+ concurrent users supported
- **Database Size**: Scalable to millions of records
- **File Storage**: Configurable storage limits
- **Network Bandwidth**: Optimized for low bandwidth
- **Geographic Distribution**: CDN readiness

---

## Deployment Architecture

### Environment Strategy
- **Development**: Local development with hot reload
- **Staging**: Production-like environment for testing
- **Production**: High-availability production environment
- **Disaster Recovery**: Backup and recovery procedures

### Deployment Pipeline
```
1. Code Commit → Git Repository
2. Automated Tests → CI/CD Pipeline
3. Build Process → Docker Images
4. Security Scan → Vulnerability Assessment
5. Deployment → Production Environment
6. Health Check → Monitoring & Alerting
```

### Infrastructure Components
- **Application Server**: Node.js application server
- **Web Server**: Nginx reverse proxy
- **Database Server**: PostgreSQL database
- **File Storage**: Local or cloud storage
- **Monitoring**: Application and infrastructure monitoring
- **Logging**: Centralized log aggregation

### Configuration Management
- **Environment Variables**: Sensitive configuration
- **Configuration Files**: Application settings
- **Secret Management**: Secure credential storage
- **Feature Flags**: Runtime feature toggling

---

## Monitoring & Logging

### Logging Strategy
- **Structured Logging**: JSON format with Winston
- **Log Levels**: Error, Warn, Info, Debug
- **Audit Logging**: Comprehensive audit trail
- **Performance Logging**: Request timing and metrics
- **Error Tracking**: Detailed error information

### Monitoring Components
- **Application Metrics**: Custom application metrics
- **System Metrics**: CPU, memory, disk, network
- **Database Metrics**: Query performance and connections
- **User Metrics**: User activity and engagement
- **Business Metrics**: Assessment completion and usage

### Alerting Strategy
- **Error Rate Alerts**: High error rate notifications
- **Performance Alerts**: Slow response time warnings
- **Resource Alerts**: Resource exhaustion warnings
- **Security Alerts**: Suspicious activity detection
- **Business Alerts**: Important business events

---

## Error Handling

### Frontend Error Handling
- **Error Boundaries**: React error boundaries
- **Global Error Handler**: Centralized error handling
- **User-Friendly Messages**: Clear error communication
- **Error Reporting**: Automatic error reporting
- **Fallback UI**: Graceful degradation

### Backend Error Handling
- **Global Error Handler**: Centralized error processing
- **Error Classification**: Different error types
- **Logging Integration**: Comprehensive error logging
- **User-Friendly Responses**: Clear error messages
- **Security Considerations**: Information disclosure prevention

### Error Types
- **Validation Errors**: Input validation failures
- **Authentication Errors**: Authentication failures
- **Authorization Errors**: Permission denied
- **Not Found Errors**: Resource not found
- **Server Errors**: Internal server errors
- **Network Errors**: Network connectivity issues

---

## Testing Strategy

### Frontend Testing
- **Unit Testing**: Jest + React Testing Library
- **Integration Testing**: Component integration tests
- **End-to-End Testing**: Cypress automation
- **Visual Testing**: Screenshot regression testing
- **Accessibility Testing**: WCAG compliance testing

### Backend Testing
- **Unit Testing**: Jest for services and utilities
- **Integration Testing**: API endpoint testing
- **Database Testing**: Database operation testing
- **Security Testing**: Authentication and authorization testing
- **Performance Testing**: Load and stress testing

### Testing Pyramid
```
E2E Tests (10%)     ← Critical user journeys
Integration Tests (20%) ← API and component integration
Unit Tests (70%)    ← Business logic and utilities
```

### Test Coverage
- **Frontend**: 80%+ code coverage target
- **Backend**: 90%+ code coverage target
- **Critical Paths**: 100% coverage for authentication and assessments
- **Business Logic**: 100% coverage for scoring algorithms

---

## Data Migration Strategy

### Migration Management
- **Sequelize Migrations**: Database schema versioning
- **Data Seeding**: Initial data population
- **Rollback Strategy**: Migration rollback procedures
- **Testing**: Migration testing in staging environment
- **Documentation**: Migration documentation

### Migration Types
- **Schema Migrations**: Database structure changes
- **Data Migrations**: Data transformation and migration
- **Feature Migrations**: Feature rollout migrations
- **Configuration Migrations**: Configuration changes

### Migration Process
```
1. Migration Development
2. Testing in Staging
3. Backup Production Database
4. Deploy Migration
5. Verify Migration Success
6. Monitor for Issues
```

---

## Compliance & Governance

### Data Protection Compliance
- **Eswatini Data Protection Act 2022**: Local data protection compliance
- **GDPR Principles**: Privacy by design and default
- **Data Minimization**: Collect only necessary data
- **Purpose Limitation**: Clear data usage purposes
- **Storage Limitation**: Retention policy implementation

### Accessibility Compliance
- **WCAG 2.1 AA**: Web accessibility standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Screen reader compatibility
- **Color Contrast**: Adequate color contrast ratios
- **Alternative Text**: Image alternative text

### Security Compliance
- **OWASP Top 10**: Protection against common vulnerabilities
- **Security Headers**: Implementation of security headers
- **Input Validation**: Comprehensive input validation
- **Output Encoding**: Prevention of XSS attacks
- **Secure Authentication**: Strong authentication mechanisms

### Audit Requirements
- **Audit Trail**: Complete system activity logging
- **Data Integrity**: Data integrity verification
- **Access Control**: Access control verification
- **Change Management**: Change tracking and approval
- **Incident Response**: Security incident response procedures

---

## Conclusion

The SDS Test System is designed as a scalable, secure, and maintainable platform for career assessment in Eswatini. The architecture follows modern software engineering principles and best practices, ensuring the system can meet current requirements while being adaptable to future needs.

Key architectural strengths:
- **Modular Design**: Clear separation of concerns enables maintainability
- **Scalable Architecture**: Designed for horizontal scaling and growth
- **Security First**: Comprehensive security controls and compliance
- **Performance Optimized**: Efficient resource utilization and caching
- **Testing Strategy**: Comprehensive testing approach for quality assurance
- **Documentation**: Detailed documentation for knowledge transfer

The system is positioned to serve the Ministry of Labour and Social Security's mission to provide quality career guidance services to the people of Eswatini while maintaining the highest standards of security, privacy, and accessibility.

---

**Document Version**: 1.0  
**Last Updated**: March 2026  
**Maintained By**: SDS Development Team  
**Contact**: coordinator@bitsandpc.co.za
