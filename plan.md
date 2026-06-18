# Webhook & Chat Automation Engine - Master Architecture Plan

## 1. System Architecture & Multi-Tenancy
* **Framework:** Next.js (App Router).
* **Hosting & Execution:** Vercel (utilizing Vercel Workflows for long-running processes, `sleep()` functions, and delays).
* **Database:** DigitalOcean Managed PostgreSQL (4-Core, 8GB).
* **Connection Layer:** ALL serverless database queries MUST connect via the PgBouncer Connection Pooler port (e.g., `25061`) to handle high-frequency concurrent Vercel instances safely.
* **Role-Based Access Control (RBAC):**
    * **Admin Layer:** Has global read/write access. Master dashboard to monitor system-wide webhook usage, connection pool health, global throttle limits, and manage Stripe subscription tiers.
    * **Paid Client Layer:** Strict multi-tenant isolation. Users can only read/write assets, workflows, nodes, and tracking logs bounded strictly by their own `client_id` foreign key. They manage their own third-party API tokens (Meta, Calendly, Stripe) within their isolated workspace.

## 2. Feature Scope & Execution Logic
* **Triggers:** Universal Webhooks, Meta Lead Ads, Calendly Events, Google Sheets New Rows, WhatsApp Cloud API Keywords, and Instagram DM Graph API Keywords.
* **Actions:** Smart/Fixed Delays, Google Sheets Row Add/Update, Outbound Webhooks, Multi-channel Messaging (Email via Resend, WhatsApp, Instagram DM).
* **Smart Delay Engine:** Delay nodes evaluate target timestamps dynamically. If the time condition is in the future, the Vercel Workflow sleeps. If the time condition has expired, the node gracefully skips the wait, returns a `false` evaluation, and routes to the next fallback node.
* **Pre-Flight Guard (The Kill Switch):** * Every workflow run initiated by an external provider logs an `external_reference_id` (e.g., a Calendly `invitee_uuid`).
    * Incoming cancellation/reschedule webhooks instantly update matching active runs to `status = 'CANCELLED'` in the database.
    * *Crucial:* Before executing ANY action node (especially messaging), the workflow queries the runtime log status. If the record is flagged as `CANCELLED`, execution aborts immediately to prevent outdated or stale messaging.
* **Analytics Tracking:** * Email tracking via single-pixel open routes and rewritten redirect routes for clicks.
    * Chat statuses (Sent, Delivered, Read, Replied) captured dynamically via incoming Meta webhooks.

## 3. Database Schema Blueprint
* `users`: Authentication profiles, subscription tier, and roles (`admin`, `client`).
* `integrations`: Encrypted storage for client-specific API keys (Meta tokens, Calendly hooks).
* `workflows`: Stores the visual node trees, operational configurations, execution JSON, and activation toggles.
* `execution_logs`: Tracks every unique execution instance, `external_reference_id`, current node state, and global operational status (`ACTIVE`, `CANCELLED`, `COMPLETED`, `FAILED`).
* `analytics_events`: Logs atomic interactions (`email_open`, `email_click`, `msg_delivered`, `msg_read`) with precise timestamps for real-time dashboard calculations.

## 4. UI/UX Aesthetic & Component Design (The "Linear Minimalist" Theme)
The frontend MUST strictly adhere to this hyper-modern, developer-centric design system:
* **Color Palette:**
    * **Background / Canvas:** Deep Black (`#111111` or `bg-neutral-950`).
    * **Cards / Nodes:** Matte Charcoal (`#1A1A1A` or `bg-neutral-900`).
    * **Borders:** Extremely subtle 1px solid dark gray (`#333333` or `border-neutral-800`).
    * **Typography:** Pure White (`#FFFFFF`) for primary text, muted silver (`#A3A3A3`) for secondary text/labels.
    * **Accent / Interactive:** Electric Neon Violet (`#8C7AE6`) or Cobalt Blue (`#3B82F6`) for active nodes, primary buttons, and visual execution traces.
* **Typography & Shapes:** * Font Family: `Geist`, `Inter`, or similar geometric sans-serif. 
    * Border Radius: Sharp but smooth `4px` or `rounded-sm`. No heavily rounded pill shapes.
* **Animations & Hierarchy:** Flat design. Avoid heavy drop shadows. Use fast fade-ins (`duration-150`) for modals and smooth layout transitions for drag-and-drop workflow nodes. Data and logs must be presented in highly scannable, dense grid tables.

## 5. Strict Frontend Coding Rules (Non-Negotiable)
The codebase must strictly align with the following React architecture standards. Any violation will result in code rejection:

* **Structure & Boundaries:**
    * `App.jsx` (or primary Next.js page components): Controls operational state and handler interactions ONLY.
    * `Components`: Manages presentation layouts, widgets, node cards, and immediate local interface logic ONLY.
    * `constants.js`: System-wide static references, configuration matrices, default node JSON payloads, and static text. No hardcoded configuration strings inside markup layers.
    * `Icons.jsx`: Global repository for all SVG definitions. No inline SVG objects allowed in presentation components.
* **State Integrity:** State mutations must be strictly functional and immutable (`setLogs(prev => [...prev, newLog])`). Zero duplicate state definitions.
* **Styling Standards:** Native Tailwind CSS utilities only. Maintain existing structural patterns. No arbitrary or conflicting third-party styling libraries.
* **Naming Protocols:**
    * UI Elements & Components: `PascalCase`
    * Functional Subroutines & Operations: `camelCase`
    * Static Definitions & Dictionaries: `UPPER_SNAKE_CASE`
* **Pre-Flight Verification:** Prior to finalizing any code output, perform a structural audit to eliminate broken imports, duplicate logic, unused variables, and syntax errors. Make minimal, precise changes. Do not rewrite full files if only a small adjustment is needed. Output a short explanation of changes followed by the exact updated code.