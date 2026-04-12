# Smart Scheduler

## What Is Used In This Project

### Backend
- Node.js + TypeScript
- Express
- MongoDB (via Mongoose)
- JWT authentication
- OpenAI SDK
- Zod validation

### Frontend
- React + TypeScript
- Vite
- Tailwind CSS
- React Router
- Axios
- FullCalendar

### Dev/Infra
- Docker + Docker Compose

## Project Structure

```text
Smart-Schedular/
├─ docker-compose.yml
├─ README.md
├─ balance-backend/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ controllers/
│  │  ├─ middleware/
│  │  ├─ models/
│  │  ├─ routes/
│  │  ├─ services/
│  │  ├─ types/
│  │  ├─ utils/
│  │  ├─ validators/
│  │  ├─ app.ts
│  │  └─ server.ts
│  ├─ package.json
│  └─ tsconfig.json
└─ smart-scheduler-frontend/
	├─ src/
	│  ├─ api/
	│  ├─ components/
	│  ├─ context/
	│  ├─ lib/
	│  ├─ pages/
	│  ├─ services/
	│  ├─ types/
	│  ├─ App.tsx
	│  └─ main.tsx
	├─ package.json
	└─ vite.config.ts
```

## How To Run

### Option 1: Run With Docker (Recommended)

1. Open terminal at project root:

2. Build and start both services:

	```bash
	docker compose up --build
	```

3. Open:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5050

4. Stop services:

	```bash
	docker compose down
	```

### Option 2: Run Locally (Without Docker)

### Prerequisites
- Node.js 20+
- npm

### 1. Start Backend

1. Go to backend folder:

	```bash
	cd balance-backend
	```

2. Install dependencies:

	```bash
	npm install
	```

3. Create `.env` file in `balance-backend` with:

	```env
	PORT=5050
	MONGO_URI=your_mongodb_connection_string
	JWT_SECRET=your_jwt_secret
	JWT_EXPIRES_IN=7d
	CORS_ORIGIN=http://localhost:5173
	OPENAI_API_KEY=your_openai_api_key
	```

4. Run backend in dev mode:

	```bash
	npm run dev
	```

### 2. Start Frontend

1. Open a new terminal and go to frontend folder:

	```bash
	cd smart-scheduler-frontend
	```

2. Install dependencies:

	```bash
	npm install
	```

3. Create `.env` file in `smart-scheduler-frontend` with:

	```env
	VITE_API_URL=http://localhost:5050/api
	```

4. Run frontend:

	```bash
	npm run dev
	```

5. Open:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5050
