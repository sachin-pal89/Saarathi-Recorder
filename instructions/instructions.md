# Saarathi Recorder — Product Requirements Document (PRD)

*Last updated: 15 Sep 2025 (IST)*

## 0) Purpose & Scope

Saarathi Recorder is a **mobile-first**, **SEO-friendly** web app for field agents to browse customers, view details, and **record audio interactions** that can be **revisited later**. It must reliably handle **mic permissions**, **long sessions** (segmenting & stitching), **low/no-network** capture with **IndexedDB buffering**, and keep the screen awake during capture via the **Screen Wake Lock API**. ([MDN Web Docs][1])

---

## 1) Goals & Non-Goals

**Goals**

* Smooth browser audio recording with clear permission UX.
* **Normal sessions**: keep audio **local-only** while recording; **upload only on user Stop**.
* **Long sessions**: **auto-segment every 15 minutes**, upload segments as they finish; on user Stop, **stitch to one file** server-side.
* **Supabase Auth (Google provider)** for sign-in. ([Supabase][2])
* **IndexedDB queue** for offline storage + reliable upload on reconnect.
* Screen **Wake Lock** held during recording to prevent the device from sleeping; release when recording stops. ([MDN Web Docs][1])
* Admin dashboard to browse users & their recordings (no export/download in v1).

**Non-Goals (v1)**

* Transcription/NLP.
* Admin export or bulk download policy (explicitly **out of scope**).
* PWA install banners.

---

## 2) Personas

* **Field Agent (User):** captures customer interactions, often in flaky network conditions.
* **Ops Admin (Admin):** audits recordings across users/customers.

---

## 3) Key Flows

### 3.1 Customer Listing

* **List view** with name and short address; chevron navigates to details.
* **Empty/Loading** states; pull-to-refresh on mobile.

### 3.2 Customer Details

* **Header**: name, email, address, lending status (badge).
* **Recordings**: list of prior items (date, purpose, duration, type) with inline playback.
* **CTA**: “New recording” → opens **Recorder Dialog** (Radix Dialog + Toast for messages).

### 3.3 Recorder (Dialog)

* **Form**: Date (default today), Purpose (required).
* **Controls**: Request Mic → Start → Pause/Resume → Stop → Save.
* **Permission UX**: if denied, Toast with remediation steps (enable mic in browser settings).
* **Wake Lock**: on Start, request **screen wake lock**; re-acquire on `visibilitychange`; release on Stop. ([MDN Web Docs][1])

### 3.4 Save Recording (normal session)

* While recording, audio stays **local** (memory/worker buffer).
* On **Stop**:

  * Create metadata (customer\_id, purpose, date, duration, mime).
  * If online → upload single Blob to Supabase Storage; insert metadata row.
  * If offline → persist Blob + metadata in **IndexedDB** and enqueue for retry.

### 3.5 Long Recording (≥15 min)

* **Segment loop**: auto stop every **15 minutes**, immediately upload that segment; instantly restart recording with the same stream. Keep mic tracks alive across segments for faster restarts.
* On user **Stop** (finalize):

  * Mark session complete, **stitch** all segments on the server (concat or transcode) into **one final asset**, update the recording row; keep segments for 7 days (GC later).

> **Note:** concatenation without transcoding requires identical container/codec across segments; otherwise transcode in the stitch step (see §6 Decision). Safari’s MediaRecorder emits **MP4/AAC**, while Chromium/Firefox typically prefer **WebM/Opus**; hence stitching may require transcoding for uniform playback. ([WebKit][3])

### 3.6 Revisit / Playback

* Fetch list; stream via short-lived signed URLs; inline `<audio controls>` uses uploaded MIME.

### 3.7 Admin Dashboard

* Filter by user/customer/date/purpose.
* Row click opens details with playback.
* **Export/Download: out of scope in v1** (policy TBD).

---

## 4) Architecture

### 4.1 Frontend (React + Redux)

* **Feature slices**: `customers`, `recordings`, `recorder` (status, timing, mime), `network` (online/offline).
* **Recording**

  * Permission via `navigator.mediaDevices.getUserMedia({ audio: true })` (HTTPS).
  * Capture via **react-media-recorder**; choose MIME at runtime using `MediaRecorder.isTypeSupported()`; expose `onStop(blob)` for normal and segment flows. ([MDN Web Docs][4])
* **Wake Lock**: controller that requests screen wake lock on Start; listens for `visibilitychange` to re-request if auto-released; releases on Stop. ([MDN Web Docs][1])
* **Offline queue (IndexedDB)**: pending blobs/segments + metadata; retry on `online` or manual “Sync now”.

### 4.2 Backend (Node/Express)

* **Auth**: verify **Supabase Auth** JWT on API calls. ([Supabase][5])
* **Upload paths**:

  * Standard upload to **Supabase Storage** for small blobs.
  * Optional TUS/resumable for larger/unstable networks (kept as capability; not required by this update).
* **Stitcher worker (ffmpeg)**:

  * Validates segment set; if mismatched codecs/containers, transcode to canonical output (see §6).
  * Writes final object and updates metadata.

### 4.3 Supabase

* **Auth**: **Google** provider enabled; rely on Supabase docs for client ID & dashboard configuration. ([Supabase][2])
* **Storage**: bucket `recordings/` with `{user}/{customer}/{yyyy-mm-dd}/{recordingId}/...`.
* **Postgres**: tables in §7 with **RLS** (users see only their own; admins see all).

---

## 5) Recording Pipeline — Technical Notes

* **MIME selection**: detect at runtime with `MediaRecorder.isTypeSupported()`; prefer:

  * Chromium/Firefox → `audio/webm;codecs=opus`
  * Safari/iOS → `audio/mp4` (AAC)
    Use the browser-supported MIME consistently within a session; record all segments with the same MIME to minimize server work. ([MDN Web Docs][6])
* **Normal session**: single Blob kept locally; post on Stop.
* **Long session**: 15-min segments uploaded as they end; maintain a segment index and checksum.
* **Events**: rely on `stop` for final chunk; guard against double-stop. ([MDN Web Docs][7])

---

## 6) **Decision: Canonical Output Format**

**We will force-transcode stitched finals to `.m4a` (MP4/AAC)** for **uniform playback** across all browsers/devices (especially iOS/Safari). Keep original segments for 7 days for audit/recovery. Rationale: Safari’s MediaRecorder and playback stack center on MP4/AAC; canonicalizing eliminates cross-codec edge cases for downstream tooling and ensures consistent UX. ([WebKit][3])

---

## 7) Data Model (Postgres)

**users**: `id (uuid, pk)`, `email (text, unique)`, `name (text)`, `role (enum: user|admin)`
**customers**: `id`, `name`, `email`, `address`, `lending_status (enum)`
**recordings**: `id`, `user_id → users.id`, `customer_id → customers.id`, `purpose`, `recorded_on (timestamptz)`, `duration_sec`, `mime`, `file_path` (final), `created_at`
**recording\_segments**: `id`, `recording_id → recordings.id`, `index`, `file_path`, `size_bytes`, `mime`, `created_at`

RLS: users can select/insert only their own recordings; admins can select all.

---

## 8) API Contract (Node)

**Customers**

* `GET /api/customers?search=&page=&pageSize=`
* `GET /api/customers/:id`

**Recordings**

* `POST /api/recordings` → `{ recording_id }` (create session: user\_id, customer\_id, purpose, recorded\_on, mime)
* `POST /api/recordings/:id/segments` → `{ segment_id, file_path }` (upload segment with `index`)
* `POST /api/recordings/:id/finalize` → stitches & sets final `file_path`, returns `{ file_path }`
* `GET /api/recordings?customer_id=&user_id=&from=&to=`
* `GET /api/recordings/:id`

**Admin**

* `GET /api/admin/recordings?user=&customer=&from=&to=` (read-only; **no export in v1**)

All endpoints require Supabase Auth JWT; backend verifies and applies per-user access.

---

## 9) Offline / Low-Network Strategy

* **Capture always** (no network required).
* **Normal session**: Blob saved to IndexedDB on Stop if offline; queued for retry.
* **Long session**: segments uploaded as they complete; if offline, each segment goes to IndexedDB with metadata and retries later.
* Retry triggers: `online` event, app foreground, or manual “Sync now”.
* TTL: prompt user if items remain local >7 days.

---

## 10) Security & Privacy

* HTTPS required for mic + wake lock. ([MDN Web Docs][1])
* Consent reminder before Start (recordings may include PII).
* Storage access via **short-lived signed URLs**.
* Enforce RLS for per-user data; admin role limited to read-only.

---

## 11) Non-Functional Requirements

* **Compatibility**: Latest Chrome/Edge/Firefox; Safari iOS 16+. (Safari targets MP4/AAC.) ([WebKit][3])
* **Resilience**: Retries with backoff; resumable uploads optional for very large segments (future).
* **Battery/Power**: Wake Lock only during active recording; auto-release on Stop or tab hidden; re-request when visible if recording resumes. ([MDN Web Docs][1])
* **Privacy**: No analytics on raw audio.

---

## 12) Error Handling (User-Facing)

* **Mic denied** → Toast with steps to enable mic in browser settings.
* **Wake Lock failure** (not supported/user declined) → proceed with recording; show non-blocking notice. ([Chrome for Developers][8])
* **Upload failed** (temporary) → toast + queue retry; (permanent) → offer “Export locally / Delete”.
* **Stitching failed** → keep segments playable; banner + background retry.

---

## 13) Testing Plan

* **MIME detection**: verify `isTypeSupported()` branching and consistent per-session MIME. ([MDN Web Docs][6])
* **Normal flow**: 3–5 min session: local-only until Stop → one upload.
* **Long flow**: 40-min session: segments every 15 min; verify server stitching to `.m4a`.
* **Offline**: airplane mode during recording; Stop queues to IndexedDB; auto-upload on reconnect.
* **Wake Lock**: screen stays awake while recording; lock auto-releases on Stop; re-request on `visibilitychange`. ([MDN Web Docs][1])
* **Cross-browser**: Chrome/Firefox (WebM/Opus), Safari (MP4/AAC).

---

## 14) Project Structure (frontend)

```
src/
  app/
    routes/               # Customers, CustomerDetails, Admin (protected)
  features/
    customers/
      components/         # Presentational items/cards
      containers/         # Data-bound views
      store/              # customersSlice.ts
    recordings/
      components/         # RecordingCard, Player, List
      containers/         # RecorderDialogContainer
      hooks/              # useRecorder(), useWakeLock(), useMimeSupport()
      store/              # recordingsSlice.ts, recorderSlice.ts
      lib/                # mime.ts, timers.ts
    offline/
      lib/                # idb-queue.ts, sync.ts
      store/              # networkSlice.ts
  services/
    api.ts                # Fetch/Axios wrappers with auth
    supabase.ts           # signed URLs, auth client
  components/ui/          # Radix Dialog/Toast wrappers
  styles/                 # Tailwind config & globals
```

*Backend (Node)*

```
src/
  api/
    customers.ts
    recordings.ts
    admin.ts
  services/
    supabase.ts        # storage + db
    stitcher.ts        # ffmpeg concat/transcode to m4a
  middleware/
    auth.ts            # Supabase JWT validation
    error.ts
  db/
    schema.sql
    rls.sql
  index.ts
```

---

## 15) Decisions (Updated)

* **Canonical final format**: **Yes**, force-transcode stitched finals to **`.m4a` (MP4/AAC)** for uniform playback. ([WebKit][3])
* **Auth source (v1)**: **Supabase Auth** with **Google** provider. ([Supabase][2])
* **Admin export/download**: **Not included in v1** (policy & UX TBD).
* **Normal vs Long uploads**: **Normal** → local-only until Stop; **Long** → 15-min segments uploaded as they finish; stitch on final Stop (server).

---

## 16) References

* **Screen Wake Lock API** (concepts, `Navigator.wakeLock`, `WakeLock.request`) — MDN & Chrome docs. ([MDN Web Docs][1])
* **Supabase Auth (Google)** — official guides. ([Supabase][2])
* **MediaRecorder MIME support & usage** — MDN & WebKit blog (Safari → MP4/AAC). ([MDN Web Docs][6])

If you want, I can also add **RLS policies** for the schema, or a short **UX spec** for the Dialog/Toast states next.

[1]: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API?utm_source=chatgpt.com "Screen Wake Lock API - Web APIs | MDN - Mozilla"
[2]: https://supabase.com/docs/guides/auth/social-login/auth-google?utm_source=chatgpt.com "Login with Google | Supabase Docs"
[3]: https://webkit.org/blog/11353/mediarecorder-api/?utm_source=chatgpt.com "MediaRecorder API"
[4]: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder?utm_source=chatgpt.com "MediaRecorder - Web APIs | MDN - Mozilla"
[5]: https://supabase.com/docs/guides/auth?utm_source=chatgpt.com "Auth | Supabase Docs"
[6]: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder/isTypeSupported_static?utm_source=chatgpt.com "MediaRecorder: isTypeSupported() static method - Web APIs"
[7]: https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API?utm_source=chatgpt.com "Using the MediaStream Recording API - Web APIs - MDN"
[8]: https://developer.chrome.com/docs/capabilities/web-apis/wake-lock?utm_source=chatgpt.com "Stay awake with the Screen Wake Lock API | Capabilities"
