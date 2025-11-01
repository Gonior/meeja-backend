<h1 align="center">Meeja (Trello/Notion Style)</h1>

<p align="center">
  A modular, scalable backend system built with <b>NestJS Monorepo</b> architecture.  
  Designed for multi-tenant workspace collaboration (like Trello or Notion).
</p>
---

![NestJS](https://img.shields.io/badge/NestJS-Framework-red)
![License: MIT](https://img.shields.io/badge/license-MIT-green)

## 🚀 Features

- 🧩 **Modular architecture** (Workspace, Board, Note, Me)
- 🗄️ **Drizzle ORM** with PostgreSQL
- 🔐 **JWT Authentication** with refresh tokens
- 📦 **DTO-based validation** with `class-validator`
- 🧠 **Domain-driven design** (service → repository → entity)
- 🧰 **Shared Core utilities** (guards, decorators, interceptors)
- 🧾 **Swagger API Docs** auto-generated
- 🧱 **Scalable foundation** for future microservices

---

## 🏗️ Project Structure

```
root-project/
│  src/
│  ├── app.module.ts
│  ├── main.ts
│  ├── config/
│  │   ├── database.config.ts
│  │   ├── redis.config.ts
│  │   └── rabbitmq.config.ts
│  ├── common/
│  │   ├── decorators/
│  │   ├── filters/
│  │   ├── guards/
│  │   ├── interceptors/
│  │   ├── dto/
│  │   └── utils/
│  ├── core/
│  │   ├── database/
│  │   │   ├── prisma.service.ts
│  │   │   └── prisma.module.ts
│  │   ├── cache/
│  │   └── queue/
│  ├── modules/
│  │   ├── auth/
│  │   ├── user/
│  │   ├── board/
│  │   ├── task/
│  │   └── comment/
│  └── shared/
│  │   └── entities/
└── README.md
└── package.json

```

> 📘 For detailed conventions:
>
> - [Route Design Guide](./docs/routes-design.md)
> - [Structure & Naming Guide](./docs/structure-guideline.md)

---

## ⚙️ Tech Stack

| Layer           | Technology        |
| --------------- | ----------------- |
| Framework       | NestJS            |
| Database ORM    | Drizzle           |
| Database        | PostgreSQL        |
| Auth            | JWT + Passport    |
| Validation      | class-validator   |
| Docs            | Swagger / OpenAPI |
| Runtime         | Node.js (v20+)    |
| Queue           | RabbitMq          |
| Package Manager | pnpm              |

---

## 🚦 Getting Started

### 1️⃣ Clone the project

```bash
git clone https://github.com/<yourname>/<yourproject>.git
cd <yourproject>
```

### 2️⃣ Install dependencies

```bash
pnpm install
```

### 3️⃣ Setup environment variables

Create `.env` in root:

```env

DATABASE_URL="postgresql://user:password@localhost:5432/workspace_db"
JWT_SECRET="supersecretkey"
PORT=3000
```

4️⃣ Setup database

```bash

pnpm run db:migrate

```

5️⃣ Run the API

```bash
pnpm start:dev
```

API Docs available at: 👉 http://localhost:3000/api/docs

---

🧱 Core Modules

| Module    | Description                              |
| --------- | ---------------------------------------- |
| Auth      | Handles registration, login, and JWT     |
| Workspace | CRUD for workspaces & members            |
| Board     | Boards within a workspace                |
| Note      | Notes within a board                     |
| Me        | Personal endpoints (/me, /me/workspaces) |

---

🧭 Route Overview

| Method | Path                   | Description             |
| ------ | ---------------------- | ----------------------- | --- |
| POST   | /auth/register         | Register new user       |
| GET    | /me                    | Get profile             |     |
| GET    | /me/workspaces         | Get user workspaces     |
| POST   | /workspaces            | Create workspace        |
| GET    | /workspaces/:id/boards | Get boards in workspace |
| POST   | /boards/:id/notes      | Create note in board    |

> 📜 Full route design: see docs/routes-design.md

---

🧰 Development Tools

| Tool              | Purpose               |
| ----------------- | --------------------- |
| Swagger           | API documentation     |
| Bruno             | API testing           |
| ESLint + Prettier | Code quality          |
| Husky             | Pre-commit checks     |
| Docker Compose    | Local dev environment |

---

🧩 Scripts

Command Description

```bash
pnpm start:dev	#Run NestJS in dev mode
pnpm prisma studio	#Open Prisma DB browser
pnpm lint	#Run linter
pnpm test	#Run unit tests
```

---

🧠 Project Philosophy

> “Code is read more often than it is written.”
> So we focus on clarity, consistency, and domain separation.

Guiding principles:

Clean, modular architecture

Separation of domain logic

Avoid circular dependencies

Explicit boundaries between layers

Controller = I/O boundary, Service = business logic, Repository = data access

---

🧑‍💻 Contributors

Name Role

Dedi Cahya Backend Developer

---

📜 License

MIT License © 2025 Dedi C.

---

## 📘 2. Penjelasan Per Bagian

| Bagian                    | Tujuan                                                               |
| ------------------------- | -------------------------------------------------------------------- |
| **Header**                | Nama & deskripsi singkat project (kasih konteks instan buat pembaca) |
| **Features**              | Ringkas tapi powerful — kasih kesan “production-ready”               |
| **Project Structure**     | Visual overview buat bantu developer baru orientasi                  |
| **Tech Stack**            | Ngasih snapshot semua dependency utama                               |
| **Getting Started**       | Harus _langsung jalan tanpa mikir_ (copy-paste friendly)             |
| **Modules / Routes**      | Biar orang ngerti sistem domain kamu                                 |
| **Philosophy**            | Nunjukin kamu ngerti prinsip arsitektur, bukan cuma koding           |
| **License / Contributor** | Bikin project kamu keliatan open & profesional                       |

---
