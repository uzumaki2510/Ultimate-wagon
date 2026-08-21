# Ultimate Wagon

Ultimate Wagon is a comprehensive, modern railway wagon repair, maintenance, and workflow management system. Designed to streamline operations across Sick Lines and Workshops, the application provides an intuitive interface for tracking wagon conditions, managing repair workflows (including BTPN and BTPGLN workflows), and generating operational memos.

## 🚀 Features

* **Wagon Registry & Directory:** Centralized management of all wagon records, statuses, and historical data.
* **Dynamic Workflows:** Step-by-step repair and inspection workflows (e.g., Yard Inspection, Steaming, Degassing, Final Inspection).
* **Defect & Condition Tracking:** Detailed recording of wagon conditions with precise defect locations and repair task assignments.
* **Role-Based Access Control (RBAC):** Secure authentication and authorization with dedicated dashboards for Super Admins, Admins, and Employees.
* **Audit & Security:** Immutable audit logs tracking all administrative and operational actions for accountability.
* **Master Data Management:** Configurable system-wide categories, railway zones, workshops, and defect codes.
* **Memo Generation:** Built-in tools for generating, archiving, and printing operational memos.
* **Live Dashboards:** Real-time visibility into the Sick Line and Workshop operations.

## 🛠️ Tech Stack

* **Frontend Framework:** [React 18](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **UI Components:** [shadcn/ui](https://ui.shadcn.com/) + Radix UI Primitives
* **Icons:** [Lucide React](https://lucide.dev/)
* **State Management:** [Zustand](https://github.com/pmndrs/zustand)
* **Routing:** [React Router](https://reactrouter.com/)
* **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest)

## 📦 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/uzumaki2510/Ultimate-wagon.git
   cd Ultimate-wagon
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## 🏗️ Build for Production

To create a production-ready build:

```bash
npm run build
```

This command generates an optimized bundle in the `dist` directory. You can preview the production build locally using:

```bash
npm run preview
```

## 🔒 Security

This application features robust client-side routing protection. Routes are strictly guarded based on user roles (`SuperAdminRoute`, `AdminRoute`, `ProtectedRoute`), ensuring that sensitive configurations and audit logs are only accessible to authorized personnel.

## 📄 License

This project is proprietary and confidential.
