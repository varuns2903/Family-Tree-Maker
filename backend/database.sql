-- Database Schema for Family Tree App

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Trees Table
CREATE TABLE trees (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) DEFAULT 'My Family Tree',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tree Collaborators (Sharing & Permissions)
CREATE TABLE tree_collaborators (
    id SERIAL PRIMARY KEY,
    tree_id INT REFERENCES trees(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) CHECK (role IN ('editor', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tree_id, user_id) 
);

-- 4. Access Requests (Pending invites/requests)
CREATE TABLE access_requests (
    id SERIAL PRIMARY KEY,
    tree_id INT REFERENCES trees(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tree_id, user_id)
);

-- 5. People Nodes
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    tree_id INT REFERENCES trees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    death_date DATE,
    is_alive BOOLEAN DEFAULT TRUE,
    contact_info VARCHAR(255),
    photo_url VARCHAR(500),
    is_placeholder BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Unions (Marriages/Relationships)
CREATE TABLE unions (
    id SERIAL PRIMARY KEY,
    tree_id INT REFERENCES trees(id) ON DELETE CASCADE,
    partner_a_id INT REFERENCES people(id) ON DELETE CASCADE,
    partner_b_id INT REFERENCES people(id) ON DELETE CASCADE,
    marriage_date DATE,
    is_current_spouse BOOLEAN DEFAULT TRUE,
    UNIQUE(partner_a_id, partner_b_id) 
);

-- 7. Union Children Link (The edges of the graph)
CREATE TABLE union_children (
    union_id INT REFERENCES unions(id) ON DELETE CASCADE,
    child_id INT REFERENCES people(id) ON DELETE CASCADE,
    PRIMARY KEY (union_id, child_id)
);