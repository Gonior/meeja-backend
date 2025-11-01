# 🧭 API ROUTE DESIGN GUIDELINES BY CHAT-GPT

> Konvensi penamaan dan struktur REST API untuk proyek monorepo NestJS  
> (Contoh kasus: Trello / Notion clone)

---

## 📘 1. Tujuan

Dokumen ini menjelaskan standar penamaan **path URL**, **struktur controller**, dan **resource hierarchy**  
agar API tetap:

- Konsisten di seluruh module
- Mudah dikembangkan & di-maintain
- Scalable ke arah microservice di masa depan

---

## 🧱 2. Prinsip Utama

1. **URL mewakili _resource_, bukan halaman UI.**  
   → Hindari penamaan berbasis tampilan frontend.
   ✅ `/workspaces/:id/boards`  
   ❌ `/workspace-dashboard/:id`

```
project-root/
├── apps/
│   └── api/                      # Main NestJS app
│ ├── libs/
│   ├── core/                     # Global guards, interceptors, decorators
│   ├── domain/                   # Domain modules (workspace, board, note, me)
│   ├── shared/                   # Shared utils, pipes, constants
│   └── infra/                    # Infrastructure (DB, mail, queue, storage)
│ ├── prisma/                       # Prisma schema & migrations
├── docs/                         # Design & architecture guides
└── README.md
```

2. **Gunakan HTTP method untuk menentukan aksi, bukan kata kerja di URL.**
   | HTTP Method | Fungsi | Contoh Path |
   |--------------|---------|-------------|
   | `GET` | Ambil data | `/workspaces` |
   | `POST` | Tambah data baru | `/workspaces` |
   | `PATCH` / `PUT` | Update data | `/workspaces/:id` |
   | `DELETE` | Hapus data | `/workspaces/:id` |

   ✅ `POST /workspaces`  
   ❌ `POST /create-workspace`

3. **Gunakan bentuk jamak (plural) untuk nama resource.**
   ✅ `/users`, `/workspaces`, `/boards`, `/notes`  
   ❌ `/user`, `/workspace`, `/board`, `/note`

4. **Gunakan hierarki path untuk menunjukkan relasi domain.**
   `/workspaces/:workspaceId/boards/:boardId/notes`
   Bukan:
   `/notes?workspaceId=...`

5. **Gunakan `/me` untuk konteks user saat ini.**
   `/me`,
   `/me/workspaces`
   `/me/boards`
   `/me/activity`
   Ini digunakan untuk data yang hanya relevan dengan user login.

6. **Gunakan `/action` hanya untuk operasi non-CRUD.**

- `POST /boards/:id/archive`
- `POST /workspaces/:id/invite`
- `POST /workspaces/:id/transfer-ownership`

---

## 📂 3. Struktur Controller & Module

Setiap _domain_ memiliki modul dan controller sendiri:

```bash
libs/
├── workspace/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── workspace.controller.ts
│   │   │   ├── workspace-member.controller.ts
│   │   │   └── workspace-invite.controller.ts
│   │   ├── services/
│   │   ├── repositories/
│   │   └── dto/
└── me/
    │
    ├── src/
    │   ├── me.controller.ts
    │   └── me.service.ts
```

### Contoh mapping

| Path                 | Controller            | Service                       |
| -------------------- | --------------------- | ----------------------------- |
| `GET /workspaces`    | `WorkspaceController` | `WorkspaceService`            |
| `POST /workspaces`   | `WorkspaceController` | `WorkspaceService.create()`   |
| `GET /me/workspaces` | `MeController`        | `MeService.getMyWorkspaces()` |

---

## 🔍 4. Resource Hierarchy

Berikut contoh struktur API domain project Trello/Notion-style.

### 🧩 Workspace

| HTTP Method | Path            | Fungsi                    |
| ----------- | --------------- | ------------------------- |
| GET         | /workspaces     | List semua workspace user |
| POST        | /workspaces     | Buat workspace baru       |
| GET         | /workspaces/:id | Detail workspace          |
| PATCH       | /workspaces/:id | Update workspace          |
| DELETE      | /workspaces/:id | Hapus workspace           |

Sub-resource
| HTTP Method | Path | Fungsi |
|------|-------------|----------|
|GET | /workspaces/:id/members | Anggota workspace |
POST | /workspaces/:id/invite | Invite user ke workspac|e

### 📋 Board

| HTTP Method | Path                   | Fungsi                     |
| ----------- | ---------------------- | -------------------------- |
| GET         | /workspaces/:id/boards | → Semua board di workspace |
| POST        | /workspaces/:id/boards | → Buat board baru          |
| GET         | /boards/:id            | → Detail board             |
| PATCH       | /boards/:id            | → Edit board               |
| DELETE      | /boards/:id            | → Hapus board              |
| POST        | /boards/:id/archive    | → Arsipkan board           |

### 🗒️ Note

| HTTP Method | Path              | Fungsi               |
| ----------- | ----------------- | -------------------- |
| GET         | /boards/:id/notes | → List note di board |
| POST        | /boards/:id/notes | → Buat note baru     |
| GET         | /notes/:id        | → Detail note        |
| PATCH       | /notes/:id        | → Update note        |
| DELETE      | /notes/:id        | → Hapus note         |

### 👤 Me

| HTTP Method | Path           | Fungsi                           |
| ----------- | -------------- | -------------------------------- |
| GET         | /me            | → Profil user aktif              |
| GET         | /me/workspaces | → Semua workspace user tergabung |
| GET         | /me/boards     | → Semua board yang diakses user  |
| GET         | /me/activity   | → Aktivitas user                 |

### 🔐 Auth

| HTTP Method | Path           |
| ----------- | -------------- |
| POST        | /auth/register |
| POST        | /auth/login    |
| POST        | /auth/logout   |
| POST        | /auth/refresh  |

---

## 🧠 5. Query Parameters

Gunakan query parameter hanya untuk:

- Filtering (`?status=archived`)
- Pagination (`?page=2&limit=10`)
- Sorting (`?sort=createdAt:desc`)

Contoh
`GET /workspaces?owned=true `
`GET /boards?archived=false&page=2&limit=10`

---

## 📦 6. Versi API

Gunakan versi di level root:

`/api/v1/workspaces`
`/api/v1/me`

Atau gunakan prefix NestJS di `main.ts`:

```ts
app.setGlobalPrefix('api/v1');
```

---

🧩 7. Error & Response Format

Gunakan format JSON yang konsisten:

✅ Success

```Json
{
  "success": true,
  "data": {
    "id": "ws_123",
    "name": "My Workspace"
  }
}
```

❌ Error

```Json
{
  "success": false,
  "message": "Workspace not found",
  "statusCode": 404
}
```

## 🧠 8. Tips Tambahan

✅ Gunakan noun (kata benda) untuk path → /notes, bukan /takeNote.

✅ Hindari level nested lebih dari 3 → refactor ke query param kalau terlalu dalam

✅ Selalu pikir: “resource ini milik siapa?” untuk menentukan hierarchy

✅ Gunakan `@Controller('workspaces')` agar konsisten di semua module

✅ Buat dekorator `@CurrentUser()` untuk endpoint yang butuh user login

---

## 🧭 9. Contoh Mapping ke Controller (Kode)

```Ts
// libs/workspace/src/controllers/workspace.controller.ts
@Controller('workspaces')
export class WorkspaceController {
  @Get()
  findAll() {}

  @Post()
  create() {}

  @Get(':id')
  findOne() {}

  @Patch(':id')
  update() {}

  @Delete(':id')
  remove() {}
}

// libs/me/src/me.controller.ts
@Controller('me')
export class MeController {
  @Get()
  profile() {}

  @Get('workspaces')
  getWorkspaces() {}
}
```

---

## 🏁 10. TL;DR — Philosophy

Prinsip Ingat Selalu

1. Resource-based URL /workspaces, bukan /create-workspace
2. HTTP verb = aksi POST, GET, PATCH, DELETE
3. URL plural /boards, bukan /board
4. Hierarchy = relasi domain /workspaces/:id/boards
5. Composite endpoint via /me Data gabungan untuk user aktif
6. FE ≠ API Path API didesain berdasar domain, bukan tampilan

---

🧩 Dokumen ini wajib dibaca sebelum menambah atau mengubah endpoint baru.
Kalau kamu menambah resource baru, pastikan:

1. Namanya plural

2. Hierarkinya jelas

3. Konsisten dengan struktur domain lain

4. Diuji via Swagger sebelum merge PR

---
