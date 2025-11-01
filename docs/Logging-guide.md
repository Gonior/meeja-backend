# 🧾 Logging Guide

> 📚 Panduan gaya penulisan log di proyek ini.
> Tujuannya: **konsisten, mudah dibaca, mudah dicari, dan mudah di-trace per request.**

---

## 🧩 Struktur Format Log

Setiap baris log **wajib mengikuti format:**

```
[<timestamp>] [<LEVEL>] [<Context>][reqId:<uuid>] <emoji opsional> <pesan>
```

**Contoh:**

```
[2025-10-25 21:06:47] [INFO] [UserService][reqId:5037546dcbe0] ✅ User registered successfully (id: 82)
```

---

## 🧭 Level Log

| Level     | Kapan digunakan                             | Contoh log                                 |
| --------- | ------------------------------------------- | ------------------------------------------ |
| **DEBUG** | Detail proses internal, step kecil          | 🔧 Hashing password...                     |
| **INFO**  | Event utama yang berjalan normal            | ✅ User registered successfully            |
| **WARN**  | Ada potensi masalah tapi sistem tetap jalan | ⚠️ Email already exists, skip registration |
| **ERROR** | Error yang bikin proses gagal               | ❌ Database connection failed              |

🪶 **Catatan:**
Jangan pakai `WARN` untuk hal normal seperti “Start register user”. Gunakan `DEBUG` untuk langkah-langkah kecil.

---

## 🔄 Pola Alur Log per Request

Gunakan pola berikut supaya mudah dilacak dari awal–akhir proses:

```
➡️ Start <aksi>
🔧 Process <step>
✅ Finish <aksi> (summary)
❌ Fail <aksi> (error detail)
```

**Contoh lengkap (register user):**

```
[DEBUG] ➡️ Start register user
[DEBUG] 🔧 Hashing password...
[DEBUG] 🔧 Uploading avatar...
[INFO] ✅ User registered successfully (id: 82)
```

---

## 🧠 Context

Gunakan **Context** untuk menunjukkan asal log, misalnya:

- `[UserService]`
- `[RegistrationService]`
- `[UploadService]`
- `[AppModule]`
- `[HTTP]`

Tujuannya agar log bisa di-_filter_ per modul.

---

## 🪶 Formatting & Newline

Setiap log **harus muncul di baris terpisah.**
Jangan menempelkan beberapa log dalam satu string.

❌ **Contoh salah:**

```
Server running on port 3000[2025-10-25 21:06:47] [INFO] ...
```

✅ **Contoh benar:**

```
Server running on port 3000
[2025-10-25 21:06:47] [INFO] ...
```

### Cara menulis di code (NestJS):

```ts
this.logger.log('📡 Server running on port http://localhost:3000');
this.logger.log('📖 Swagger docs at http://localhost:3000/docs');
```

Atau:

```ts
this.logger.log(`📡 Server running on port http://localhost:3000
📖 Swagger docs at http://localhost:3000/docs`);
```

---

## ⚙️ Rekomendasi Tools

### 🧱 **NestJS + Pino**

Gunakan `nestjs-pino` untuk performa tinggi + otomatis inject `reqId`.

```bash
npm install nestjs-pino pino-pretty
```

**Contoh config:**

```ts
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
  ],
})
export class AppModule {}
```

---

## 🧰 Custom LoggerService (optional)

Kalau ingin pakai NestJS `Logger` tapi dengan warna & emoji:

```ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AppLogger extends Logger {
  log(message: string, context?: string) {
    super.log(`✅ ${message}`, context);
  }

  warn(message: string, context?: string) {
    super.warn(`⚠️ ${message}`, context);
  }

  error(message: string, trace?: string, context?: string) {
    super.error(`❌ ${message}`, trace, context);
  }

  debug(message: string, context?: string) {
    super.debug(`🔧 ${message}`, context);
  }
}
```

---

## 🧾 Contoh Lengkap Output Log

```
[2025-10-25 21:06:21] [INFO] [AppModule] 📡 Server running on http://localhost:3000
[2025-10-25 21:06:21] [INFO] [AppModule] 📖 Swagger docs at http://localhost:3000/docs

[2025-10-25 21:06:47] [DEBUG] [RegistrationService][reqId:5037546dcbe0] ➡️ Start register user
[2025-10-25 21:06:47] [DEBUG] [UserService][reqId:5037546dcbe0] 🔧 Hashing password...
[2025-10-25 21:06:47] [DEBUG] [UserService][reqId:5037546dcbe0] 🔧 Saving user to database...
[2025-10-25 21:06:47] [INFO]  [RegistrationService][reqId:5037546dcbe0] ✅ User registered successfully (id: 82)
```

---

## ✅ Checklist Sebelum Commit

| Cek | Deskripsi                                                                  |
| --- | -------------------------------------------------------------------------- |
| ☐   | Gunakan level log yang sesuai (`DEBUG`, `INFO`, `WARN`, `ERROR`)           |
| ☐   | Pisahkan setiap log dengan newline                                         |
| ☐   | Gunakan context `[ServiceName]`                                            |
| ☐   | Tambahkan `reqId` untuk request-trace                                      |
| ☐   | Hindari log sensitif (password, token, dsb)                                |
| ☐   | Gunakan emoji atau kata kunci yang mudah dibaca (optional tapi dianjurkan) |

---

Kalau kamu mau, aku bisa bantu lanjutannya:

- bikin **versi `LoggerService` siap pakai (NestJS)** yang otomatis format seperti ini (ada `reqId`, emoji, warna, dan level handling).
- tinggal kamu import ke project.

Mau sekalian aku buatin file `logger.service.ts`-nya juga?
