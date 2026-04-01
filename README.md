# Online SDS Test System

Self-Directed Search Career Assessment Tool for the Ministry of Labor and Social Security - Kingdom of Eswatini.

## Branch Notes
- `SDS-remote-db` branch is configured for a managed remote PostgreSQL database.
- This version also includes frontend build script updates for environments where `node_modules/.bin/react-scripts` is not executable (for example, some shared hosting build runners).

## Features
- **Career Assessment**: Comprehensive SDS test implementation
- **User Management**: Registration, login, and profile management
- **Result Analysis**: Detailed career matching and reporting
- **Admin Dashboard**: For managing tests and user data

## Technology Stack
- **Frontend**: React.js with Tailwind CSS
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT with bcrypt
- **Testing**: Jest (unit tests), Cypress (E2E tests)

## Requirements
- Node.js v18+
- PostgreSQL v14+
- npm v9+

## Installation
```bash
# Clone the repository
git clone https://github.com/[organization]/sds-test-system.git
cd sds-test-system

# Install all dependencies
npm run install-all

# Setup environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Configure database details in backend/.env
```

## Running the Application
```bash
# Development mode (both frontend and backend)
npm run dev

# Production build
npm run build
npm start
```

## Testing
```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```

## Project Structure
```
sds-test-system/
├── backend/                 # Node.js/Express API
│   ├── controllers/        # Route controllers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   └── tests/              # Backend tests
├── frontend/               # React application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── tests/          # Frontend tests
└── README.md
```

## Documentation

For detailed information about the system:

- **[Database Schema](docs/DATABASE_SCHEMA_DOCUMENTATION.md)** - Complete database structure and relationships
- **[API Documentation](docs/API_DOCUMENTATION.md)** - Endpoint specifications and usage examples
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Installation and configuration instructions
- **[Remote DB Version Notes](docs/REMOTE_DB_VERSION_NOTES.md)** - Changes introduced in the `SDS-remote-db` deployment variant
- **[Test Credentials](docs/TEST_CREDENTIALS.md)** - Default login credentials for testing:
  - **Admin**: `admin@labor.gov.sz` / `Admin@123`
  - **Counselors**: `counselor1@labor.gov.sz`, `counselor2@labor.gov.sz`, `counselor3@labor.gov.sz` / `Counselor@123`
  - **School Students**: Username `20250101` through `20250301` / `Pass@2025`
  - **Demo**: `student@test.sz` / `Student@123`

## Environment Variables
See `.env.example` files in both frontend and backend directories for required variables.

## Deployment
For deployment instructions, refer to [SETUP_GUIDE.md](docs/SETUP_GUIDE.md)

## Contact
For support or questions, contact Coordinator Gwebu at coordinator@bitsandpc.co.za

## License
MIT License

