🧩 NestJS Project Structure & Naming Guidelines

> Standar penamaan & struktur folder/file untuk project berbasis NestJS Monorepo / Modular Architecture
> (disusun dengan mindset scalable + clean domain separation)

---

🧱 1. Tujuan

Agar semua orang di tim:

Paham di mana menaruh apa

Bisa navigasi codebase tanpa bingung

Bisa refactor atau split ke microservice tanpa chaos

---

🗂️ 2. Struktur Folder Utama (Monorepo)

```
project-root/
├── apps/
│   ├── api/                      # aplikasi utama (NestJS API Gateway)
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   └── bootstrap/
│   │   │       ├── swagger.config.ts
│   │   │       ├── validation.config.ts
│   │   │       └── global-filters.ts
│   │   └── test/
│   └── worker/                   # untuk job queue / background worker
│
├── libs/
│   ├── core/     # base layer (config, utils, guards, decorators, interceptors)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── decorators/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── utils/
│   │   └── index.ts
│   │
│   ├── domain/                   # domain modules (workspace, board, note, etc.)
│   │   ├── workspace/
│   │   │   ├── src/
│   │   │   │   ├── controllers/
│   │   │   │   ├── services/
│   │   │   │   ├── repositories/
│   │   │   │   ├── entities/
│   │   │   │   ├── dto/
│   │   │   │   ├── events/
│   │   │   │   ├── types/
│   │   │   │   └── workspace.module.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── board/
│   │   ├── note/
│   │   └── me/
│   │
│   ├── shared/                   # cross-domain helpers (pipes, exceptions, mappers, etc.)
│   │   ├── src/
│   │   │   ├── exceptions/
│   │   │   ├── pipes/
│   │   │   ├── filters/
│   │   │   ├── mappers/
│   │   │   └── constants/
│   │   └── index.ts
│   │
│   └── infra/                    # infrastructure layer (database, redis, mailer, s3, etc.)
│       ├── src/
│       │   ├── prisma/
│       │   ├── mail/
│       │   ├── storage/
│       │   └── queue/
│       └── index.ts
│
├── docs/                         # dokumentasi arsitektur, guideline, ERD, dll
│   ├── routes-design.md
│   ├── structure-guideline.md
│   └── architecture-overview.md
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── package.json
└── tsconfig.base.json
```

---

🧩 3. Penamaan File (Konsisten & Deskriptif)

📦 Modul

workspace.module.ts

board.module.ts

⚙️ Service

workspace.service.ts

workspace-member.service.ts

note.service.ts

> 🔸 Kalau service menangani sub-domain (misal workspace member), tambahkan sub-nya (workspace-member.service.ts).

🧠 Controller

workspace.controller.ts

board.controller.ts

me.controller.ts

> 🔸 Controller = endpoint-facing layer → 1 controller per resource utama.

🗃️ Repository

workspace.repository.ts

board.repository.ts

note.repository.ts

> 🔸 Repository = abstraksi query DB, khusus yang butuh join kompleks atau logic query.

📄 DTO (Data Transfer Object)

Gunakan format:

create-\*.dto.ts

update-\*.dto.ts

filter-\*.dto.ts

response-\*.dto.ts

Contoh:

dto/
├── create-workspace.dto.ts
├── update-workspace.dto.ts
├── filter-workspace.dto.ts
└── workspace-response.dto.ts

🧩 Entity (ORM Class)

workspace.entity.ts

board.entity.ts

> Kalau pakai Prisma, bisa bikin mirror model class di sini buat mapping response agar tidak expose entity mentah.

🪶 Type / Interface

File kecil dan ringan, biasanya di:

types/
└── workspace.types.ts

Isinya misal:

export interface WorkspaceSummary {
id: string;
name: string;
memberCount: number;
}

🛠️ Util & Helper

Penamaan wajib jelas fungsi-nya:

utils/
├── date.util.ts
├── string.util.ts
├── pagination.util.ts

Isi contoh:

export function paginate<T>(data: T[], page: number, limit: number) { ... }

---

⚙️ 4. Penamaan Class, Method, Variable

✅ Class Naming

Jenis Suffix Contoh

Controller Controller WorkspaceController
Service Service BoardService
Repository Repository NoteRepository
Guard Guard JwtAuthGuard
Pipe Pipe ValidationPipe
Interceptor Interceptor TransformResponseInterceptor

---

✅ Method Naming

Tipe Aksi Nama Method Contoh

Ambil semua findAll() findAll()
Ambil satu findOne(id: string) findOne(id)
Buat baru create(dto) create(dto)
Update update(id, dto) update(id, dto)
Hapus remove(id) remove(id)
Custom Gunakan kata kerja deskriptif inviteMember(), archiveBoard()

---

🧭 5. Layer Responsibility

Layer Folder Fungsi

Controller /controllers Handle HTTP, request → service
Service /services Logic domain utama
Repository /repositories Query ke DB / Prisma
DTO / Types /dto, /types Struktur input/output data
Entity /entities Representasi ORM
Event / Listener /events Domain event handler
Mapper / Transformer /shared/mappers Ubah entity → response
Guard / Interceptor / Decorator /core Infrastructure level concern

---

🧱 6. Contoh Real Folder (Workspace Module)

libs/domain/workspace/src/
├── controllers/
│ ├── workspace.controller.ts
│ └── workspace-member.controller.ts
├── services/
│ ├── workspace.service.ts
│ └── workspace-member.service.ts
├── repositories/
│ └── workspace.repository.ts
├── entities/
│ └── workspace.entity.ts
├── dto/
│ ├── create-workspace.dto.ts
│ ├── update-workspace.dto.ts
│ ├── invite-member.dto.ts
│ └── workspace-response.dto.ts
├── types/
│ └── workspace.types.ts
├── events/
│ └── workspace-invited.event.ts
└── workspace.module.ts

---

🧰 7. File Utility Bersama (Core Layer)

libs/core/src/
├── config/
│ ├── app.config.ts
│ ├── jwt.config.ts
│ ├── database.config.ts
│ └── env.validation.ts
├── decorators/
│ ├── current-user.decorator.ts
│ └── roles.decorator.ts
├── guards/
│ ├── jwt-auth.guard.ts
│ └── roles.guard.ts
├── interceptors/
│ ├── logging.interceptor.ts
│ └── response.interceptor.ts
└── utils/
├── date.util.ts
├── string.util.ts
└── pagination.util.ts

---

🎯 8. Quick Naming Cheat Sheet

Item Format Contoh

Module _.module.ts workspace.module.ts
Controller _.controller.ts me.controller.ts
Service _.service.ts board.service.ts
DTO verb-_.dto.ts create-workspace.dto.ts
Repository _.repository.ts note.repository.ts
Entity _.entity.ts workspace.entity.ts
Type _.types.ts workspace.types.ts
Util _.util.ts pagination.util.ts

---

🧠 9. Bonus — Project Philosophy

Prinsip Penjelasan

1. Domain-driven structure Pisahkan module per domain, bukan per layer global
2. Batas module = batas tanggung jawab Module tidak boleh import service module lain tanpa interface
3. DTO bukan entity Jangan return entity mentah ke controller
4. Repository hanya untuk query Service jangan langsung ke Prisma
5. Controller ringan Logic utama di Service, bukan Controller
6. File pendek (<300 baris) Kalau lebih, split ke file baru
7. Semua nama class PascalCase WorkspaceService, bukan workspaceService

---

🧾 10. Simpan Sebagai Dokumentasi

Simpan file ini di:

docs/structure-guideline.md

dan link-kan dari README:

📚 [Structure & Naming Guidelines](./docs/structure-guideline.md)

---

Kalau kamu mau, aku bisa bantuin lanjut bikin template folder + file kosong (monorepo ready) biar kamu tinggal pnpm run g:module workspace terus langsung kebentuk dengan layout di atas.
Mau aku buatin template-nya sekalian (auto-generate folder + sample code-nya)?
