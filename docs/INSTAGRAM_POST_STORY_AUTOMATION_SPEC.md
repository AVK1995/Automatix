# Feature Specification: Instagram Post & Story Automation with Gemini / GPT & Google Drive

## 1. Executive Overview
This document specifies the architecture for the **Instagram Post & Story Automation Engine** in Automatix. 
It enables autonomous social media publishing by watching a user-selected Google Drive folder, analyzing uploaded images/videos with multimodal AI (**Google Gemini** or **OpenAI GPT-4o** using user-provided API keys), generating context-aware captions and titles, and publishing directly to Instagram (as a Feed Post, Reel, or Story) via the Meta Graph API, followed by automated cleanup.

```mermaid
flowchart TD
    A[Google Drive Folder Upload] --> B[Drive Polling / Webhook Watcher]
    B --> C{File Validation <= 100MB}
    C -- Valid --> D[Fetch Media & Stream to Temp/Memory]
    C -- Invalid --> E[Log Error & Skip / Alert]
    D --> F[AI Multimodal Analysis (Gemini / GPT-4o)]
    F --> G[Generate Dynamic Contextual Caption & Title]
    G --> H{Publish Target}
    H -- Post / Reel --> I[Meta Graph API /media Container -> /media_publish]
    H -- Story --> J[Meta Graph API STORIES Container -> /media_publish]
    I --> K{Publish Success?}
    J --> K
    K -- Success --> L[Auto-Delete Processed File from Google Drive]
    K -- Failure --> M[Preserve File in Drive + Mark Failed & Enable Retry]
    L --> N[Wait for Next Drive Upload]
```

---

## 2. Core Functional Requirements

### 2.1 Google Drive Watcher & Ingestion
* **Folder Selection**: User selects or provides a target Google Drive Folder ID via their connected Google Workspace / Drive Integration.
* **File Detection Mechanism**:
  * **Option A (Inngest Polling Cron)**: Runs on a recurring schedule (e.g., every 5–15 mins) checking `files.list` with `q: "'<folderId>' in parents and trashed = false"`.
  * **Option B (Google Drive Push Notifications / Webhooks)**: Listens for Google Drive file change webhooks (`changes.watch`).
* **Validation Guards**:
  * Maximum supported file size: **100 MB per file**.
  * Supported MIME types:
    * Images: `image/jpeg`, `image/png`, `image/webp`
    * Videos: `video/mp4`, `video/quicktime` (MOV)
* **Deduplication & State Tracking**:
  * Track processed `driveFileId` in database (`InstagramPublishLog`) with states: `PENDING` $\rightarrow$ `PROCESSING` $\rightarrow$ `PUBLISHED` $\rightarrow$ `DELETED_FROM_DRIVE` or `FAILED`.

### 2.2 Multimodal AI Analysis & Caption Generation (BYOK Model)
* **Bring Your Own Key (BYOK)**:
  * Users connect their own **Google Gemini API Key** or **OpenAI API Key** in Connections/Settings (`user.integrations` or connection vault).
* **Multimodal Visual Analysis**:
  * The image or video is passed directly to the AI model:
    * **Gemini 1.5 Pro / Flash**: Passes image buffer / video URI using Google Generative AI SDK with inline data / File API.
    * **GPT-4o / GPT-4o-mini**: Passes image base64 / vision payload for images, or extracted frames/audio for video.
* **Prompt Configuration**:
  * **System Persona**: Allows user to specify brand tone (e.g. *Professional, Humorous, Aesthetic, Promotional, E-commerce, Storyteller*).
  * **Dynamic Output**: Generates:
    1. **Post Title** (where applicable / Reels).
    2. **Context-Aware Caption**: Tailored to what is visually happening in the media.
    3. **Relevant Hashtags**: Curated hashtags based on visual content.
    4. **Call to Action (CTA)**: Configured by the user in the node settings.

### 2.3 Instagram Publishing via Meta Graph API

#### A. Instagram Feed Post & Reels (`media_type: IMAGE | VIDEO | REELS`)
1. Create Media Container:
   ```http
   POST https://graph.facebook.com/v21.0/{ig-user-id}/media
   Body:
     image_url or video_url: <public_temp_url>
     caption: <ai_generated_caption>
     media_type: "REELS" | "IMAGE"
     access_token: <user_meta_token>
   ```
2. For Video / Reels: Poll container status until `status_code === "FINISHED"`.
3. Publish Container:
   ```http
   POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
   Body:
     creation_id: <container_id>
     access_token: <user_meta_token>
   ```

#### B. Instagram Story (`media_type: STORIES`)
1. Create Story Media Container:
   ```http
   POST https://graph.facebook.com/v21.0/{ig-user-id}/media
   Body:
     image_url or video_url: <public_temp_url>
     media_type: "STORIES"
     access_token: <user_meta_token>
   ```
2. Publish Story:
   ```http
   POST https://graph.facebook.com/v21.0/{ig-user-id}/media_publish
   Body:
     creation_id: <story_container_id>
   ```

### 2.4 Post-Publish Cleanup & Error Resilience
* **Strict Cleanup Safety Rule**:
  * The Google Drive file is **ONLY deleted** (`drive.files.delete({ fileId })`) after receiving a `200 OK` + verified `id` from Meta's `/media_publish` endpoint.
* **Failure Handling**:
  * If AI generation fails (e.g., rate limit or invalid API key), **DO NOT delete the Drive file**.
  * If Meta rejects media format or Instagram publishing fails, **DO NOT delete the Drive file**.
  * Log detailed failure reason in Workflow Execution History and notify user.
  * Allow 1-click retry from the execution dashboard.

---

## 3. Workflow Node Architecture Options

We can implement this in the workflow canvas using either of two elegant patterns:

### Pattern 1: All-in-One Dedicated Trigger Node *(Recommended for Streamlined UX)*
* Node Name: **"Instagram Drive Auto-Publisher"**
* Trigger Configuration:
  * Google Drive Folder Picker
  * Target Type: `Feed Post`, `Reel`, or `Story`
  * AI Provider: `User Gemini Key` vs `User OpenAI Key`
  * Tone / Brand Guidelines prompt box
  * Auto-delete from Drive checkbox (Default: checked)
* Advantage: User configures one single node, drops files into Drive, and everything runs completely hands-free.

### Pattern 2: Modular Step-by-Step Flow
* Node 1: **Google Drive New File Trigger**
* Node 2: **AI Vision & Caption Generator Action**
* Node 3: **Instagram Publish Post / Story Action**
* Node 4: **Google Drive Delete File Action**
* Advantage: Maximum flexibility for users who want to add extra filters, delays, or multi-platform cross-posting (e.g. post to Instagram + Facebook + Twitter simultaneously).

---

## 4. Proposed Database Additions
```prisma
model InstagramDriveAutomation {
  id              String   @id @default(uuid())
  userId          String
  workflowId      String?
  folderId        String
  folderName      String
  publishType     String   // "POST", "REEL", "STORY"
  aiProvider      String   // "GEMINI", "OPENAI"
  tonePrompt      String?
  includeHashtags Boolean  @default(true)
  autoDeleteDrive Boolean  @default(true)
  status          String   @default("ACTIVE") // "ACTIVE", "PAUSED"
  lastCheckedAt   DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model InstagramPublishLog {
  id            String   @id @default(uuid())
  userId        String
  driveFileId   String
  fileName      String
  fileSizeBytes Int
  mediaType     String   // "IMAGE", "VIDEO"
  publishType   String   // "POST", "STORY", "REEL"
  generatedCaption String? @db.Text
  igMediaId     String?
  status        String   // "PENDING", "PROCESSING", "PUBLISHED", "FAILED"
  errorMessage  String?  @db.Text
  driveDeleted  Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

---

## 5. Next Steps for Implementation
When we are ready to build this:
1. **Google Drive Integration**: Add `drive.file` / `drive.readonly` scope refresh token handling.
2. **AI Vision Helper**: Create `analyzeMediaAndGenerateCaption({ mediaBuffer, mimeType, aiProvider, userApiKey, tone })`.
3. **Instagram Publishing Service**: Add story and feed container creator in `src/lib/integrations/meta.js`.
4. **Workflow Node & Inngest Polling Function**: Register the trigger and handler.
