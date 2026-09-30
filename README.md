# The Agile Issue Tracker API

**Course:** Software Engineering
**Topic:** RESTful Web Services & Relational Databases
**Tech Stack:** Node.js, TypeScript, Express, Postgres, Kysely, Vitest, Supertest
**Total Points:** 20 (10 points Week 1, 10 points Week 2)

---

## Overview

For this project, you will build the backend engine that powers an Agile team's issue-tracking board.

You are stepping into an existing codebase. The starter repository has a database schema for users and tickets, along with a Data Access Layer (DAL) that connects to Postgres using the Kysely query builder. Your job is to build a robust Express API with middleware and automated testing (Week 1), and then extend the schema to support a new "time logging" feature (Week 2).

---

## 🚀 Getting Started

### Prerequisites by Operating System

- **macOS:**
  - Install [Node.js](https://nodejs.org/) (v20+ or v24 LTS recommended, e.g. via `brew install node` or `nvm`).
  - Install and start [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/). Make sure Docker Desktop is running before issuing Docker commands.
- **Windows (WSL2):**
  - You should be running everything inside your **WSL2 terminal** (e.g. Ubuntu). Do not run these commands from Windows PowerShell or Command Prompt.
  - Install [Node.js](https://nodejs.org/) directly inside WSL2 (using `nvm` or NodeSource).
  - Install [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/) and ensure **"Use the WSL 2 based engine"** and your WSL2 distribution integration are enabled in Docker Desktop settings. Make sure Docker Desktop is running.
- **Linux:**
  - Install [Node.js](https://nodejs.org/) (v20+ or v24 LTS).
  - Install Docker and the Docker Compose plugin (`docker-compose-plugin`). Ensure the docker daemon is active (`sudo systemctl start docker`) and your user is added to the docker group (`sudo usermod -aG docker $USER`).

---

### Step 1: Environment Setup

Create your local `.env` configuration file from the provided template:

```bash
cp .env.example .env
```

The default `.env` contents point to the PostgreSQL container:

```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/issue_tracker
```

---

### Step 2: Start the Postgres Database

From your terminal (macOS Terminal, WSL2 bash, or Linux terminal), start the database container:

```bash
docker compose up -d
```

Useful commands:

- Check container status: `docker compose ps`
- View database logs: `docker compose logs -f db`
- Stop the database: `docker compose down`

---

### Step 3: Install Dependencies

```bash
npm install
```

---

### Step 4: Run Database Migrations

Apply the initial database schema to create the `users` and `tickets` tables:

```bash
npm run migrate:up
```

> **Note for Week 2:** After you write your migration in `src/db/migrations/002_time_logs.ts`, run `npm run migrate:up` again to create the `time_logs` table.
> To rollback the most recent migration, run:
>
> ```bash
> npm run migrate:down
> ```

---

### Step 5: Seed the Database (Optional)

Prepopulate the database with realistic sample users and 25 tickets across various statuses (`TODO`, `IN_PROGRESS`, `DONE`) to easily test API endpoints, filters, and pagination:

```bash
npm run seed
```

---

### Step 6: Start the Development Server

Start the Express app in development mode with hot-reloading:

```bash
npm run dev
```

The server listens on `http://localhost:3000`.

---

### Step 7: Testing & Quality Checks

Run the automated test suite using Vitest:

```bash
npm test
```

Additional scripts:

- **Watch Mode for Tests:** `npm run test:watch`
- **Linting & Type Checking:** `npm run lint`
- **Format Code:** `npm run format`
- **Check Formatting:** `npm run format:check`
- **Build TypeScript:** `npm run build`

---

### 💡 Troubleshooting & Database Reset

- **Port 5432 Conflict:** If port 5432 is already in use because a local Postgres service is running natively on your system, stop it before starting Docker:
  - **macOS:** `brew services stop postgresql`
  - **Linux / WSL2:** `sudo systemctl stop postgresql` or `sudo service postgresql stop`
- **Reset Database:** To wipe the database and start fresh with an empty schema:
  ```bash
  docker compose down -v
  docker compose up -d
  npm run migrate:up
  ```

---

## Part 1: Express, Middleware & Integration Testing (10 Points)

Your first goal is to build out the API layer. Use the pre-written methods in `src/dal/tickets.ts` and `src/dal/users.ts` for database interactions.

### 1. Authentication Middleware (`src/middleware/auth.ts`)

Write an Express middleware function that checks for the presence of an `X-User-Id` HTTP header.

- If the header is missing or not a valid number, return `401 Unauthorized`.
- If present, attach the user ID to `res.locals` (e.g., `res.locals.userId`) so downstream routes can access it.
- Apply this middleware only to routes that create or modify data (`POST` and `PATCH`).

### 2. User Routes (`src/routes/users.ts`)

Implement basic CRUD for users to warm up:

- `GET /users`: Return all users in the system.
- `GET /users/:id`: Return a single user. Return `404 Not Found` if the user does not exist.
- `POST /users`: Create a new user. Expects `{ "name": "string", "email": "string" }` in the body. Return `201 Created`.

### 3. Ticket Routes (`src/routes/tickets.ts`)

Implement the ticket endpoints with strict payload validation:

- `GET /tickets`: Return all tickets. Must support query parameters for pagination (`?limit=10&offset=0`) and filtering (`?status=TODO`).
- `GET /tickets/:id`: Return a single ticket. Return `404 Not Found` if undefined.
- `POST /tickets`: Create a new ticket. Extract the `creator_id` from the `X-User-Id` header (via your middleware) and the `title`/`description` from the body. Return `201 Created`.
- `PATCH /tickets/:id/status`: Update a ticket's status. Return `200 OK`.

### 4. Integration Testing (`tests/api.test.ts`)

Using `supertest` and `vitest`, write integration tests for your Express routes. You do not need exhaustive coverage, but you should test key behaviors. Examples of good test cases:

- Successful user and ticket creation (returns `201`).
- Middleware rejection (returns `401` when `X-User-Id` is missing on a `POST` request).
- 404 handling on fetching a non-existent ticket or user.
- Pagination logic on `GET /tickets`.

---

## Part 2: Database Migrations & Aggregations (10 Points)

The product manager has submitted a new feature request: Developers need to log their hours against specific tickets.

### 1. The Migration (`src/db/migrations/002_time_logs.ts`)

Create a new migration file to create a `time_logs` table.

- Columns: `id` (Primary Key), `ticket_id` (Foreign Key to tickets), `user_id` (Foreign Key to users), `hours` (integer or numeric), and `logged_at` (defaulting to current timestamp).

### 2. The DAL (`src/dal/timeLogs.ts`)

Write two Kysely methods (ensure strict TypeScript return types):

- `insertTimeLog(ticketId, userId, hours)`: Inserts a row into `time_logs`.
- `getTotalHoursForTicket(ticketId)`: Uses Kysely's `sum` aggregate function to return the total hours logged against a specific ticket. Do not fetch all rows and sum them in JavaScript; you must do this at the SQL level.

### 3. The API Integration

Expose these new methods via Express in your ticket router:

- `POST /tickets/:id/time`: Accepts `{ "hours": number }`. Uses your auth middleware to get the `user_id`. Creates the log and returns `201 Created`.
- `GET /tickets/:id/time`: Returns `{ "ticket_id": number, "total_hours": number }`.

### 4. Testing (`tests/timeLogs.test.ts`)

Write tests to verify the math logic. Insert time logs for a single ticket, then `GET` the total hours endpoint and assert the sum matches your inputs.

---

## Grading Rubric

### Part 1: Express, Middleware & Integration Testing (10 Points Total)

- **Middleware (2 points):** Properly checks the header, extracts the ID, handles failures with a `401`, and attaches `userId` to `res.locals` for downstream handlers.
- **User Routes (3 points):** Correct HTTP verbs, URL structures, status codes (`200`, `201`, `404`), and successful integration with the DAL.
- **Ticket Routes (3 points):** Successfully implements pagination/filtering queries, body parsing, and utilizes the auth middleware for the `POST`/`PATCH` routes.
- **Testing (2 points):** Includes functional Supertest cases that hit the Express app and assert specific status codes and response shapes.

### Part 2: Database Migrations & Kysely (10 Points Total)

### AI Usage Disclaimer

GitHub Copilot was used as an assistive tool during production, with all code suggestions being reviewed line-by-line and proper testing being implemented. All lines added were human-checked to ensure they aligned with the assignment requirements and specifications. I understand the underlying logic of the code, and take full responsibility for its correctness and implementation.

- **Migration (2 points):** Accurately defines table schema with necessary Foreign Keys and data types. The `down` method correctly drops the table.
- **DAL (3 points):** Types compile successfully. The `getTotalHoursForTicket` method executes the sum using SQL aggregation, not in-memory JavaScript array methods.
- **Routes (3 points):** Correctly wires up the new HTTP endpoints, securely utilizing the auth middleware to track who logged the time.
- **Testing (2 points):** Includes Supertest assertions verifying the correct mathematical sum of multiple time log entries.
