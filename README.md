# 🌳 Legacy Builder - Collaborative Family Tree App

Legacy Builder is a modern, full-stack web application designed to help users create, visualize, and collaborate on family trees. It features a beautiful interactive graph, role-based access control, and powerful data validation to ensure genealogical accuracy.

## 🚀 Features

### 🎨 Visual & Interactive
- **Interactive Graph:** Built with Balkan FamilyTreeJS for smooth zooming, panning, and navigation.
- **Glassmorphism UI:** A stunning, modern interface with a "Roots & Heritage" theme.
- **Dark/Light Mode:** Fully responsive theming across all dashboards, modals, and lists.

### 👥 Collaboration & Access Control
- **RBAC System:** Granular permissions for **Owners** (Admin), **Editors** (Edit/Add), and **Viewers** (Read-only).
- **Sharing:** Generate unique public invite links or search for users by email to invite them directly.
- **Access Requests:** Viewers can request edit access via a dedicated workflow.
- **Notifications:** Real-time badge indicators for pending access requests.

### 🛠️ Data Management
- **Members List View:** A searchable, filterable grid view for quick profile management.
- **Profile Editing:** Update names, genders, dates, and profile photos (via Uploadcare).
- **Date Validation:** Logic checks to ensure logical consistency (e.g., Death Date cannot be before Birth Date).
- **Cycle Detection:** Advanced algorithms to prevent infinite loops (e.g., a child cannot be their own ancestor).

### 📊 Insights
- **Family Statistics:** detailed breakdown of demographics, living vs. deceased, gender split, and birth eras.
- **Birthday Tracker:** See upcoming birthdays for living family members.

## 🛠️ Tech Stack

### Frontend
- **React.js:** Component-based UI architecture.
- **Tailwind CSS:** Utility-first styling with custom gradients and animations.
- **Lucide React:** Modern, lightweight icon set.
- **Balkan FamilyTreeJS:** The core visualization engine.
- **React Router:** SPA routing and navigation.
- **Uploadcare:** Image handling and CDN.

### Backend
- **Node.js & Express:** RESTful API architecture.
- **MongoDB & Mongoose:** NoSQL database for flexible document storage.
- **JWT (JSON Web Tokens):** Secure authentication and session management.
- **Bcrypt:** Password hashing and security.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v14+)
- MongoDB (Local or Atlas)

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/legacy-builder.git](https://github.com/yourusername/legacy-builder.git)
cd legacy-builder
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd backend
npm install
```
Create a .env file in the backend folder:
```bash
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
```
Start the server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the client directory:
```bash
cd frontend
npm install
```
Create a .env file in the frontend folder (if using Vite):
```bash
VITE_API_URL=http://localhost:5000/api
```
Start the React application:
```bash
npm run dev
```

## 📖 API Endpoints
### 🔐 Authentication APIs
<details> <summary><strong>Show Auth Routes</strong></summary>

| Method | Endpoint            | Description                        | Access  |
|--------|----------------------|------------------------------------|---------|
| POST   | /api/auth/register   | Register new user                  | Public  |
| POST   | /api/auth/login      | Login user                         | Public  |
| GET    | /api/auth/me         | Get current logged-in user         | Private |
| GET    | /api/auth/search     | Search users by email/name         | Private |

</details>

### 🌳 Tree APIs
<details> <summary><strong>Show Tree Routes</strong></summary>

| Method | Endpoint                     | Description                               | Access  |
|--------|-------------------------------|-------------------------------------------|---------|
| GET    | /api/trees                    | Get all trees (owned + shared)            | Private |
| POST   | /api/trees                    | Create a new tree                         | Private |
| POST   | /api/trees/join/:shareToken   | Join a tree using a share token           | Private |
| GET    | /api/trees/:id                | Get a tree by ID                          | Private |
| PUT    | /api/trees/:id                | Update tree details                       | Editor+ |
| DELETE | /api/trees/:id                | Delete a tree                             | Owner   |

</details>

### 🧑‍🤝‍🧑 Collaborators & Roles
<details> <summary><strong>Show Collaborator Routes</strong></summary>

| Method | Endpoint                     | Description                               | Access                      |
|--------|-------------------------------|-------------------------------------------|-----------------------------|
| GET    | /api/trees/:id/collaborators | Get list of collaborators                 | Private                     |
| PUT    | /api/trees/:id/role          | Manage roles OR request access            | Private (Controller guarded)|

</details>

### 🧬 Member APIs
<details> <summary><strong>Show Member Routes</strong></summary>

| Method | Endpoint                                   | Description                          | Access  |
|--------|---------------------------------------------|--------------------------------------|---------|
| GET    | /api/trees/:treeId/members                  | Get all members                      | Viewer+ |
| POST   | /api/trees/:treeId/members                  | Add new member                       | Editor+ |
| PUT    | /api/trees/:treeId/members/:memberId        | Update member                        | Editor+ |
| DELETE | /api/trees/:treeId/members/:memberId        | Delete member                        | Editor+ |

</details>

### 🔐 Access Levels Explained
| Role       | Permissions                                    |
| ---------- | ---------------------------------------------- |
| **Owner**  | Can delete tree, manage roles, update all data |
| **Editor** | Can add/edit/delete members, update tree info  |
| **Viewer** | Read-only; can request edit access             |
| **Public** | Only allowed for login/signup                  |

## 🛡️ Validation Rules
The application enforces strict graph integrity:

1. Ancestry Loop Prevention: You cannot add a parent if that parent is already a descendant of the child.

2. Date Logic: Birth Date must be strictly less than Death Date.

3. Gender Logic: Fathers must be Male, Mothers must be Female (for biological linking context).

## 🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request for any features or bug fixes.

## 📄 License
This project is open-source and available under the MIT License.