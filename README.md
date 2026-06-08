# Gulmohar Resort Management System

A comprehensive full-stack web application designed to streamline the operations of a modern resort. This platform enables administrators to manage bookings, inventory, restaurant orders, and guest services seamlessly, while providing an intuitive interface for staff and a dedicated frontend for users.

**Deployed Link**: https://resort-management-system-user-front.vercel.app/

## Features

- **Admin Dashboard & Analytics**: Real-time overview of occupancy, revenue, and daily operations for administrators.
- **User Booking System**: A dedicated frontend for guests to view available rooms, book reservations, and manage their stays.
- **Booking Management**: Tools for staff to view, create, and manage guest reservations and room allocations.
- **Restaurant POS**: Dedicated interface for restaurant orders, billing, and menu management.
- **Inventory Tracking**: Monitor stock levels and manage procurement for the resort.
- **Authentication & Authorization**: Secure login system with role-based access control (JWT) to separate User and Admin access.

## Tech Stack

### Frontend
- **React.js (Vite)** - Fast, modern UI development
- **React Router** - Client-side routing for both Admin and User interfaces
- **Axios** - API communication
- **Lucide React** - Iconography
- **Date-fns** - Date formatting and manipulation

### Backend
- **Node.js & Express.js** - Scalable server architecture
- **MySQL2** - Relational database driver
- **JWT (JSON Web Tokens)** - Secure stateless authentication
- **Bcrypt** - Password hashing
- **Express Validator** - Robust input validation
- **Helmet & CORS** - Security middleware

## Deployment Architecture

This project utilizes a modern cloud-native deployment strategy:

- **Frontend**: Deployed and hosted on **Render** for fast global content delivery.
- **Backend**: Deployed on **Railway**, providing a reliable and scalable Node.js environment.
- **Database**: Cloud MySQL database hosted on **Aiven**, ensuring high availability and secure data storage.

## Local Setup & Installation

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js (v18+)
- Local MySQL instance (if not using the cloud database)

### 1. Clone the Repository
```bash
git clone <repository_url>
cd resort-management-system
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory with the following variables:
```env
PORT=5000
DB_HOST=your_aiven_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_db_name
DB_PORT=your_db_port
JWT_SECRET=your_super_secret_jwt_key
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Start the Vite development server:
```bash
npm run dev
```
The frontend will typically run on `http://localhost:5173`.

## Project Structure

```text
resort-management-system/
├── backend/            # Express server, controllers, models, routes
│   ├── package.json
│   └── server.js
├── frontend/           # React application
│   ├── src/
│   │   ├── admin/      # Admin dashboard interfaces and components
│   │   └── user/       # User/Guest frontend interfaces and components
│   └── package.json
└── README.md           # Project documentation
```

## License
This project is for educational and portfolio purposes.
