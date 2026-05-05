# WhisperBox 🔐

A secure, end-to-end encrypted messaging application built for the Frontend Wizards Stage 4B challenge. The server never sees plaintext — all encryption and decryption happens on the client.

---

## Encryption Flow

WhisperBox uses a **hybrid encryption scheme** combining RSA-OAEP and AES-GCM via the browser's native Web Crypto API.

### Sending a Message

plaintext
│
▼
AES-GCM (random 256-bit key + 96-bit IV)
│
├──► ciphertext  ──────────────────────────────► stored on server
│
└──► raw AES key
│
├──► RSA-OAEP (recipient public key) ──► encryptedKey
│                                         (stored on server)
│
└──► RSA-OAEP (sender public key)   ──► encryptedKeyForSelf
(stored on server)

### Receiving a Message

encryptedKey (or encryptedKeyForSelf if sender)
│
▼
RSA-OAEP decrypt (your private key from IndexedDB)
│
▼
raw AES-GCM key
│
▼
AES-GCM decrypt (ciphertext + IV from server)
│
▼
plaintext  ◄── never left your device

---

## Key Management

### Registration

1. RSA-OAEP 2048-bit key pair is generated in the browser using `crypto.subtle.generateKey`
2. A random 128-bit salt is generated
3. The user's password is passed through PBKDF2 (310,000 iterations, SHA-256) to derive an AES-KW wrapping key
4. The RSA private key is wrapped (encrypted) with the AES-KW key using `crypto.subtle.wrapKey`
5. The public key, wrapped private key, and salt are sent to the server — the server stores them verbatim and never inspects them

### Login / Session Restore

1. The server returns `wrapped_private_key` and `pbkdf2_salt`
2. The client re-derives the AES-KW key from the user's password + salt
3. The private key is unwrapped back into a `CryptoKey` object using `crypto.subtle.unwrapKey`
4. The `CryptoKey` object is stored in **IndexedDB** — never serialized, never stringified

### Private Key Storage

| Location | What's stored | Safe? |
|----------|--------------|-------|
| IndexedDB | `CryptoKey` object (browser-native, non-exportable form) | ✅ |
| Server | `wrapped_private_key` (AES-KW encrypted blob) | ✅ |
| localStorage | Nothing sensitive | ✅ |
| sessionStorage | JWT access token + refresh token | ⚠️ Cleared on tab close |
| Memory | Derived AES-KW key (only during login flow) | ✅ |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v7 |
| Encryption | Web Crypto API (native browser) |
| Key storage | IndexedDB via `idb` |
| Validation | Zod |
| HTTP client | Axios |
| Real-time | WebSocket (native browser) |
| Icons | Lucide React |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/whisperbox.git
cd whisperbox
npm install
```

### Environment Variables

Create a `.env` file in the root:

```env
VITE_API_BASE_URL=https://whisperbox.koyeb.app
```

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

---

## Security Trade-offs

| Decision | Trade-off |
|----------|-----------|
| Private key stored in IndexedDB | If the user clears browser data, the private key is gone. There is no recovery mechanism — the user would need to re-register. |
| Password used to derive wrapping key | If a user forgets their password, their private key cannot be recovered. The server cannot help because it never sees the password. |
| JWT in sessionStorage | More secure than localStorage (cleared on tab close) but lost on page refresh — the app re-fetches from `/auth/me` on mount to restore session. |
| No key rotation | Once a key pair is generated at registration, it is used for the lifetime of the account. Forward secrecy is partially achieved via per-message AES-GCM keys, but the RSA key pair itself is not rotated. |
| PBKDF2 over Argon2 | PBKDF2 is supported natively by the Web Crypto API with no dependencies. Argon2 would be stronger but requires a WASM library. |

---

## Known Limitations

- **No cross-device support** — private keys live in IndexedDB on the device they were created on. Logging in on a new device will not restore the ability to read old messages.
- **No key recovery** — there is no "forgot password and keep messages" flow. Password reset would require generating a new key pair and losing access to historical messages.
- **No group messaging** — the current architecture supports only 1-to-1 conversations.
- **No message deletion** — once sent, messages cannot be deleted from the server.
- **No read receipts** — the double-tick indicator is display-only and does not reflect actual delivery confirmation beyond what the WebSocket delivers.
- **IndexedDB dependency** — private browsing / incognito mode may restrict IndexedDB, which would break the crypto session.

---

## API Reference

Base URL: `https://whisperbox.koyeb.app`  
Full docs: `https://whisperbox.koyeb.app/docs`

---

## Live Demo

[Live Url](https://stage4b.vercel.app/)

---

## Author

Built by [Your Name] for Frontend Wizards Stage 4B.