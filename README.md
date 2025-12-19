# Requisition Management System

A Next.js application for internal requisition requests built with React and Tailwind CSS.

## Features

- **Create Requisitions**: Submit new requisition requests with employee details and purpose
- **View Requisitions**: Browse all submitted requisitions with status tracking
- **Dashboard**: Overview of requisition statistics (placeholder)
- **Responsive Design**: Mobile-friendly interface
- **Local Storage**: Data persistence without backend

## Tech Stack

- **Next.js 15** with App Router
- **React 18**
- **TypeScript**
- **Tailwind CSS** for styling
- **Local Storage** for data persistence

## Project Structure

```
├── app/
│   ├── components/
│   │   └── Sidebar.tsx          # Navigation sidebar
│   ├── dashboard/
│   │   └── page.tsx            # Dashboard page
│   ├── requisition/
│   │   └── create/
│   │       └── page.tsx        # Create requisition form
│   ├── requisitions/
│   │   └── page.tsx            # View all requisitions
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout component
│   └── page.tsx                # Home page (redirects to create)
├── .github/
│   └── copilot-instructions.md
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Creating a Requisition

1. Navigate to "Create Requisition" (default page)
2. Fill in the required fields:
   - Full Name
   - Employee ID
   - Email Address
   - Department (select from available options)
   - Purpose of Request
3. Click "Submit Requisition" to save

### Viewing Requisitions

1. Click "View Requisitions" in the sidebar
2. Browse submitted requisitions in a table format
3. See employee details, department, purpose, status, and creation date

### Dashboard

The dashboard provides an overview of:
- Total requests submitted
- Number of approved requests
- Number of pending requests

## Form Validation

The application includes client-side validation:
- All fields marked with * are required
- Email format validation
- Real-time error feedback

## Data Storage

Currently uses localStorage for data persistence:
- Data persists across browser sessions
- No backend required
- Data is stored locally in the browser

## Customization

### Adding New Departments

Edit the `departments` array in `app/requisition/create/page.tsx`:

```typescript
const departments = [
  'Finance',
  'Procurement', 
  'Operations',
  'Human Resources',
  'Marketing',
  // Add new departments here
]
```

### Styling

The application uses Tailwind CSS. Modify styles by:
- Editing existing component classes
- Adding custom styles in `globals.css`
- Updating `tailwind.config.ts` for theme customization

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Structure

- **Components**: Reusable UI components in `app/components/`
- **Pages**: Route-based pages using App Router
- **Styling**: Tailwind CSS classes throughout components
- **Type Safety**: TypeScript for type checking

## Future Enhancements

- Backend integration for data persistence
- User authentication and authorization
- Email notifications for requisition updates
- Advanced filtering and search
- Export functionality (PDF/Excel)
- Approval workflow management
- File attachments support

## Troubleshooting

### Common Issues

1. **Development server won't start**
   - Ensure Node.js 18+ is installed
   - Run `npm install` to install dependencies
   - Check for port conflicts (default: 3000)

2. **Styles not loading**
   - Verify Tailwind CSS is properly configured
   - Check `tailwind.config.ts` paths
   - Ensure `globals.css` imports are correct

3. **Data not persisting**
   - Check browser localStorage support
   - Verify localStorage isn't disabled
   - Clear browser cache if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for internal use only.