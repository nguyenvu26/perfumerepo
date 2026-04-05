# Gemini Project Overview: Perfume-Sales

This document provides a comprehensive overview of the Perfume-Sales project, intended to be used as a context for AI-driven development.

## Project Description

The project is a full-stack e-commerce application for selling perfumes. It consists of three main parts: a backend server, a web-based frontend, and a mobile application.

## Project Structure

The repository is a monorepo containing three separate projects:

*   `backend/`: A NestJS application that serves as the API for the frontend and mobile apps.
*   `frontend/`: A Next.js web application for customers.
*   `mobile/`: A Flutter application for customers.

---

## Backend

The backend is a [NestJS](https://nestjs.com/) application.

### Key Technologies

*   **Framework**: NestJS
*   **Database ORM**: [Prisma](https://www.prisma.io/)
*   **Authentication**: JWT with Passport.js
*   **Payments**: [PayOS](https://payos.vn/)
*   **Language**: TypeScript

### Building and Running

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run start:dev
    ```

### Other Commands

*   **Build for production:** `npm run build`
*   **Run in production:** `npm run start:prod`
*   **Run tests:** `npm run test`
*   **Prisma migrate:** `npm run prisma:migrate`

---

## Frontend

The frontend is a [Next.js](https://nextjs.org/) application.

### Key Technologies

*   **Framework**: Next.js
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
*   **Internationalization**: `next-intl`
*   **Language**: TypeScript

### Building and Running

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Mobile

The mobile application is built with [Flutter](https://flutter.dev/).

### Key Technologies

*   **Framework**: Flutter
*   **State Management**: [Riverpod](https://riverpod.dev/)
*   **Navigation**: [go_router](https://pub.dev/packages/go_router)
*   **Backend Integration**: [Supabase](https://supabase.io/)
*   **Language**: Dart

### Building and Running

1.  **Navigate to the mobile directory:**
    ```bash
    cd mobile
    ```

2.  **Install dependencies:**
    ```bash
    flutter pub get
    ```

3.  **Run the application:**
    ```bash
    flutter run
    ```
