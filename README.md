# 🌳 Collaborative Family Tree Application

A robust, full-stack application for building, visualizing, and sharing complex family lineage. 

Unlike standard binary tree visualizations, this project uses a custom **Recursive CSS Layout Engine** to handle complex real-world scenarios like multiple spouses, remarriages, single parents, and infinite generational depth without using canvas libraries.

## 🚀 Features

### 🎨 Visualization & UI
* **Recursive Graph Layout:** Custom CSS logic using a "Spacer & Bridge" strategy to ensure nodes are perfectly centered relative to their parents, regardless of tree width.
* **Zero Overlaps:** Dynamic spacing prevents family branches from colliding.
* **Multi-Spouse Support:** Visualizes multiple partners using an interactive toggle mechanism (`<` `>`).
* **Ghost Nodes:** Visual indicators for missing/unknown parents (dashed boxes) to maintain structural integrity.

### 👥 Genealogy Logic
* **Strict Relational Data:** Uses a `People` -> `Unions` -> `Children` model. Children belong to a *marriage*, not just a parent.
* **Smart Merging:** Automatically detects if a "Single Parent" adds a spouse and merges them into a unified family unit.
* **Gender Validation:** Enforces logic rules (e.g., Male-Female unions) while allowing flexibility for single parents.

### 🔐 Auth & Collaboration
* **Role-Based Access Control (RBAC):**
    * **Owner:** Full control, can delete tree.
    * **Editor:** Can add/edit people but cannot delete the tree.
    * **Viewer:** Read-only access.
* **Public Link Sharing:** Smart redirection for shared links.
* **Access Request System:** Viewers can request "Edit Access" directly from the UI; Owners can approve/reject requests.
* **JWT Authentication:** Secure stateless authentication.

---

## 🛠️ Tech Stack

### Frontend
* **React (Vite):** Core framework.
* **CSS3 (Flexbox):** Used for the complex tree calculation logic.
* **Axios:** API communication with Interceptors for JWT handling.
* **React Router:** Protected routes and navigation.

### Backend
* **Node.js & Express:** REST API architecture.
* **PostgreSQL:** Relational database for strict data integrity (Foreign Keys, Cascade Deletes).
* **Bcrypt & JWT:** Security and Session management.

---

## 💾 Database Schema

The application moves away from simple `parent_id` columns and uses a graph-like structure:

1.  **Users:** App accounts.
2.  **Trees:** Containers for families.
3.  **People:** The nodes (Name, Gender, Dates).
4.  **Unions:** The edges (Marriages). Connects Person A <-> Person B.
5.  **Union_Children:** Links a Child to a Union.

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v16+)
* PostgreSQL

### 1. Database Setup
1.  Create a PostgreSQL database (e.g., `family_tree_db`).
2.  Run the SQL script found in `backend/database.sql` to create the tables.

### 2. Backend Setup
```bash
cd backend
npm install

# Create a .env file based on the example below
# Start the server
npm run dev
```

```bash
# .env
PORT=5000
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=family_tree_db
JWT_SECRET=your_secret_key
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Access the app at http://localhost:5173.

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License.