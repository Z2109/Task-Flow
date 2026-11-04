# 🚀 TaskFlow — Smart Project & Team Management SaaS

**Turn ideas into progress. Plan work, manage teams, track projects, and improve productivity with TaskFlow.**

TaskFlow is a full-stack SaaS project and task management platform designed to help organizations manage projects, collaborate with teams, assign responsibilities, monitor progress, and control access through a flexible Role-Based Access Control (RBAC) system.

Built with **Next.js, React, Node.js, Express, MongoDB, and Tailwind CSS**, TaskFlow provides a modern workspace for managing the complete project lifecycle.

🔗 **Live Demo:** https://task-flow-frontend-virid.vercel.app

---

## ✨ Key Features

### 🔐 Authentication & Account Management
- User registration and login.
- JWT-based authentication.
- Forgot password and password reset.
- Secure password hashing.
- Invitation-based employee registration.
- Protected routes and authenticated API requests.

### 🏢 Multi-Tenant Organization Management
- Create and manage organizations.
- Organization-based data separation.
- Organization membership management.
- Owner-based organization management.
- Invite employees to organizations.
- Accept and manage team invitations.
- Organization-specific roles and permissions.

### 🛡️ Role-Based Access Control (RBAC)
TaskFlow uses a flexible permission-based authorization system.

- Create and manage custom roles.
- Assign permissions to roles.
- Assign roles to organization members.
- Organization-level and project-level role assignments.
- Permission-based API authorization.
- Protected frontend navigation and actions.

**Example roles:**
- Owner
- Project Manager
- Backend Developer
- UI/UX Designer
- Viewer

### 📁 Project Management
- Create, view, update, and delete projects.
- Manage project descriptions and categories.
- Set priorities and due dates.
- Manage project statuses.
- Assign team members to projects.
- Track project progress.
- Organize projects with tags and visual indicators.

### ✅ Task Management
- Create and manage tasks.
- Assign tasks to team members.
- Set task priorities and deadlines.
- Track task status.
- Organize tasks using a Kanban-style board.
- Filter and search tasks.
- Manage task details and attachments.

### 👥 Team Management
- Invite team members through email.
- Assign roles to employees.
- View organization members.
- Manage project membership.
- Remove team members.
- Control access based on permissions.

### 📊 Dashboard & Analytics
- Project overview.
- Total and active project statistics.
- Completed and archived project metrics.
- Task statistics.
- Task completion percentage.
- Project progress tracking.
- Visual analytics and productivity insights.

### 🔔 Notifications & Activity Tracking
- In-app notifications.
- Read and unread notification management.
- Activity logs.
- Project and task activity tracking.

### 📎 File Management
- Upload and manage project files.
- Cloudinary integration for file storage.
- Project-related file organization.

### 💳 Subscription & Payments
- Razorpay integration.
- Subscription plan configuration.
- Monthly and yearly subscription plans.
- Pro and Business plan support.

### 🤖 AI Assistant — In Development

TaskFlow is being extended with LLM-powered capabilities to make project management smarter.

Planned AI capabilities:

- Generate task descriptions from natural-language instructions.
- Summarize project progress.
- Recommend task priorities.
- Suggest deadlines based on task context.
- Generate project summaries and reports.
- Provide intelligent productivity insights.
- Convert natural-language requests into task creation workflows.

**LLM integration is currently under development.** These capabilities will be introduced in future releases.

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js | React framework and application routing |
| React | Component-based UI |
| JavaScript | Application development |
| Tailwind CSS v4 | Styling and responsive design |
| Redux | State management |
| Axios | API communication |
| React Toastify | Notifications and feedback |
| Recharts | Data visualization |
| Lucide React | Icons |

### Backend
| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API development |
| MongoDB | NoSQL database |
| Mongoose | Database modeling |
| JWT | Authentication |
| bcrypt | Password hashing |
| Joi | Request validation |
| Cloudinary | File and image storage |
| Nodemailer | Email services |
| Razorpay | Payment integration |

### Deployment & Infrastructure
- **Frontend:** Vercel
- **Backend:** Render
- **Database:** MongoDB Atlas
- **Version Control:** Git and GitHub

---

## 🏗️ System Architecture

```text
                   USERS
                     |
                     v
          NEXT.JS FRONTEND
          React + Tailwind CSS
                     |
                     | Axios / REST API
                     |
                     v
             EXPRESS BACKEND
                     |
          +----------+----------+
          |          |          |
          v          v          v
       AUTH        RBAC      BUSINESS
      SERVICE     SERVICE    LOGIC
          |          |          |
          +----------+----------+
                     |
                     v
                MONGODB
               ATLAS CLOUD
                     |
          +----------+----------+
          |          |          |
          v          v          v
      CLOUDINARY  NODEMAILER  RAZORPAY

          Future Integration
                     |
                     v
              LLM / AI SERVICE
```

---

## 📂 Project Repositories

TaskFlow is maintained in two separate GitHub repositories.

| Repository | Description |
|---|---|
| [TaskFlow-Frontend](https://github.com/Z2109/TaskFlow-Frontend) | Next.js frontend application |
| [Task-Flow](https://github.com/Z2109/Task-Flow) | Node.js and Express backend |

---

## ⚙️ Local Installation & Setup

### Prerequisites

Make sure you have installed:

- Node.js
- npm
- MongoDB Atlas account
- Git

### 1. Clone the repositories

**Frontend**

```bash
git clone https://github.com/Z2109/TaskFlow-Frontend.git
cd TaskFlow-Frontend
npm install
```

**Backend**

```bash
git clone https://github.com/Z2109/Task-Flow.git
cd Task-Flow
npm install
```

### 2. Configure Backend Environment Variables

Create a `.env` file in the backend root directory.

```env
PORT=3000

MONGODB_URL=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

FRONTEND_URL=http://localhost:3001
CLIENT_URL=http://localhost:3001

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

RAZORPAY_PRO_MONTHLY_PLAN_ID=your_plan_id
RAZORPAY_PRO_YEARLY_PLAN_ID=your_plan_id

RAZORPAY_BUSINESS_MONTHLY_PLAN_ID=your_plan_id
RAZORPAY_BUSINESS_YEARLY_PLAN_ID=your_plan_id
```

### 3. Configure Frontend Environment Variables

Create a `.env.local` file in the frontend root directory.

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 4. Start the Backend

```bash
npm run dev
```

### 5. Start the Frontend

Open another terminal:

```bash
npm run dev
```

Open your local application at:

```text
http://localhost:3001
```

**Note:** Adjust the local frontend port if your Next.js development server uses a different port. Never commit `.env` or `.env.local` files.

---

## 🔑 Core Application Concepts

### Multi-Tenant Architecture

TaskFlow supports multiple organizations with organization-specific membership, roles, and project access.

### Authorization Flow

```text
User Request
     |
     v
JWT Authentication
     |
     v
Organization Context
     |
     v
Membership Verification
     |
     v
Permission Verification
     |
     v
Controller
     |
     v
Database Operation
```

Access is granted according to the authenticated user's organization membership and assigned permissions.

---

## 🌐 Live Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |

**Live Application:** https://task-flow-frontend-virid.vercel.app

**Backend Health Check:** https://taskflow-backend-i7ax.onrender.com/

---

## 🗺️ Roadmap

- [x] User authentication and registration
- [x] Organization management
- [x] Multi-tenant membership management
- [x] Role-Based Access Control
- [x] Invitation and employee registration
- [x] Project management
- [x] Task management
- [x] Team management
- [x] Dashboard analytics
- [x] Notifications and activity logs
- [x] File management integration
- [x] Razorpay subscription integration
- [x] Production frontend and backend deployment
- [ ] Complete LLM-powered AI Assistant
- [ ] AI-generated task descriptions
- [ ] AI project summaries and recommendations
- [ ] Advanced productivity insights
- [ ] Further performance and security improvements

---

## 🔒 Security

TaskFlow uses several security practices:

- JWT-based authentication.
- Password hashing.
- Protected backend routes.
- Organization membership verification.
- Permission-based authorization.
- Environment-based secret management.
- Server-side request validation.

Never expose database credentials, API secrets, JWT secrets, or payment credentials in source code.

---

## 🤝 Contributing

Contributions, suggestions, and feature requests are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push your branch.
5. Open a Pull Request.

---

## 👨‍💻 Developer

**Zaid Zafar**

Full Stack Developer | MERN Stack | Next.js

GitHub: https://github.com/Z2109

---

## ⭐ Support

If you find TaskFlow interesting, consider giving the repositories a ⭐ on GitHub.

**TaskFlow — Plan Smarter. Collaborate Better. Deliver Faster.**
