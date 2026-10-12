
# ICSI 418Y - Programming Assignment 3

## Projects and Project Memberships

This is a full-stack project management application
built with React, Node.js, Express, and MongoDB.

## Features

- User Signup and Login
- Create software projects
- Assign a registered user as Project Lead
- View all projects
- Add registered users to projects
- View project memberships
- Remove non-lead members
- Prevent duplicate memberships
- Allow users to join multiple projects

## Technologies

- React
- Vite
- Node.js
- Express
- MongoDB Atlas

## Database Collections

### users
Stores registered user information.

### projects
Stores project name, description, status,
and Project Lead ObjectId.

### projectMemberships
Stores project_id and user_id as MongoDB
ObjectId references.

## How to Run

### Backend

1. Open a terminal.
2. Navigate to the server folder:

   cd server

3. Install dependencies:

   npm install

4. Create a .env file containing:

   MONGO_URI=your_mongodb_connection_string

5. Start the backend:

   node server.js

The backend runs at http://localhost:9000

### Frontend

1. Open another terminal.
2. Navigate to the client folder:

   cd client

3. Install dependencies:

   npm install

4. Start the frontend:

   npm run dev

5. Open http://localhost:5173

## Membership Rules

- A project must have a registered Project Lead.
- The Project Lead is automatically a member.
- A user cannot join the same project twice.
- A user can belong to multiple projects.
- A Project Lead cannot be removed.

## Course

ICSI 418Y - Software Engineering
Programming Assignment 3
