# Feature Specification: Instagram Post & Story Automation with Multi-AI (BYOK) & Google Drive

## 1. Simple Summary (Executive Overview)
This feature allows clients to automate publishing to their Instagram account (as **Feed Posts**, **Reels**, or **Stories**) by dropping images or videos into a selected **Google Drive folder**. 
The system analyzes the media using the user's own connected **AI API key** (**Gemini**, **ChatGPT / OpenAI**, **Claude**, or any **Custom OpenAI-compatible provider**), writes a tailored caption & title based on the visual contents, publishes it to Instagram, and auto-cleans the Drive folder.

```mermaid
flowchart TD
    A[User Uploads Image/Video to Google Drive] --> B[Drive Watcher Detects File]
    B --> C{File Size <= 25 MB?}
    C -- No (>25MB) --> D[Workflow Error & Notification: File exceeds 25MB]
    C -- Yes --> E{User Storage Quota Checked}
    E -- Quota Exceeded / Storage Locked --> F[Workflow Warning Banner + Notification: Upgrade Storage]
    E -- Quota OK --> G[Multimodal AI Vision & Caption Generation (BYOK)]
    G --> H{Publish Type}
    H -- Post / Reel --> I[Meta Graph API: Feed Container -> Publish]
    H -- Story --> J[Meta Graph API: Story Container -> Publish]
    I --> K{Meta Success Confirmation (200 OK)}
    J --> K
    K -- Success --> L[Auto-Delete File from Google Drive]
    K -- Failed --> M[Preserve File in Drive + Show Error in Workflow History + Retry]
    L --> N[Wait for Next Upload in Drive]
```

---

## 2. Core Functional Requirements & Rules

### 2.1 Google Drive File Ingestion
* **Folder Selection**: User selects a dedicated Google Drive folder via their connected Google Drive integration.
* **File Size Limit**: **Maximum 25 MB per file** (strictly enforced to maintain fast processing and align with platform storage economics).
* **Supported Media**:
  * **Images**: JPG, PNG, WEBP.
  * **Videos**: MP4, MOV (H.264 / AAC, vertical 9:16 for Stories & Reels, 1:1 or 4:5 for Feed Posts).

### 2.2 Storage Quota & Plan Integration Safety Guard
* **Pre-Execution Quota Check**:
  * Before processing, the system calculates the user's current storage usage:
    $$\text{Total Used MB} + \text{Incoming File MB} \le \text{Max Plan Storage MB}$$
  * If the user's storage limit is reached, or their account is in `GRACE_PERIOD` / `LOCKED`:
    1. **Safely Abort & Preserve**: The file is **NOT deleted** from Google Drive.
    2. **Workflow Error Banner**: Displays an alert on the **All Workflows screen** and on the specific workflow card: *"⚠️ Trigger paused: Storage quota exceeded (e.g. 50 MB / 50 MB reached). Upgrade storage pack to resume."*
    3. **In-App Notification**: Fires an instant alert with a 1-click link to `/dashboard/billing`.

### 2.3 User Account-Level Multi-AI Engine (Universal BYOK)
* The platform does **not** consume global credits. Instead, users connect their own AI credentials under **Settings / AI Connections**:
  * **Google Gemini** (`gemini-1.5-flash` / `gemini-1.5-pro` via Gemini API Key).
  * **OpenAI ChatGPT** (`gpt-4o` / `gpt-4o-mini` via OpenAI API Key).
  * **Anthropic Claude** (`claude-3-5-sonnet` via Anthropic Key).
  * **Custom OpenAI-Compatible API** (DeepSeek, Groq, Ollama).
* **Contextual Vision Prompting**:
  * AI inspects the media visually to understand the scene, emotion, product, or topic.
  * Generates an engaging Instagram caption, relevant hashtags, hook line, and post title without generic filler text.

### 2.4 Instagram Publishing via Meta Graph Connection
* **Existing Connection Capability**:
  * Our existing Instagram OAuth connection (`instagram_content_publish`, `pages_read_engagement`, `instagram_business_account`) **already has full permission to publish both Posts and Stories**.
* **Publishing Flows**:
  * **Post Trigger**: Creates an Instagram Feed container (`/media`) with `caption` $\rightarrow$ awaits processing $\rightarrow$ triggers `/media_publish`.
  * **Story Trigger**: Creates an Instagram Story container (`/media` with `media_type: "STORIES"`) $\rightarrow$ triggers `/media_publish`.

### 2.5 Safe Deletion & Retry Lifecycle
* **Drive File Deletion Rule**:
  * The file is deleted from Google Drive **ONLY** when Meta responds with a successful publication confirmation (`id` returned from `/media_publish`).
* **Failure Safety**:
  * If AI generation fails (invalid user API key or rate limit) $\rightarrow$ **DO NOT delete the Drive file**.
  * If Instagram API rejects the aspect ratio or resolution $\rightarrow$ **DO NOT delete the Drive file**.
  * The file remains in Google Drive, the error reason is displayed in the Workflow Logs, and the user can trigger a 1-click retry.

---

## 3. Workflow Integration Architecture

### Option 1: All-in-One Dedicated Trigger Node *(Cleanest for users)*
* Node: **"Instagram Google Drive Auto-Publisher"**
* Configuration:
  * Google Drive Folder: Select folder from dropdown.
  * Publication Type: `Feed Post` or `Story`.
  * AI Provider: `My Gemini Key`, `My ChatGPT Key`, etc.
  * Brand Tone / Instructions (e.g., "Informative and high energy").

### Option 2: Modular Node Chain *(For advanced multi-channel workflows)*
* **Step 1**: Google Drive Trigger (New Media $\le$ 25MB).
* **Step 2**: AI Multimodal Vision Action (Analyzes media & returns caption/title).
* **Step 3**: Instagram Publish Action (Publishes Post or Story).
* **Step 4**: Google Drive Cleanup Action (Deletes file from Drive upon success).
