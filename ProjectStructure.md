## 1. Project Concept & Structure

This is an **Event Management System (EMS)**. It operates in three layers:

1. **Public Layer:** Landing page, countdown, and registration (for all students).
2. **Participant Layer:** Personalized profiles and winner announcements (for registered students).
3. **Admin Layer:** Management dashboard for check-ins, media uploads, and winner selection (for organizers).

### **Recommended Folder Structure (MVC Architecture)**

```text
/freshero-portal
├── /public            # Static assets (images, logos, fonts)
├── /src
│   ├── /components    # Reusable UI (Navbar, Timer, Modal)
│   ├── /pages         # Full views (Home, Admin, Gallery)
│   ├── /middleware    # Auth checks (is the user an admin?)
│   ├── /styles        # Tailwind/CSS configurations
│   └── /utils         # Validation logic & API helpers
└── /database          # Schema files and seeds

```

---

## 2. Pages and Routes

You will need the following routes to ensure a smooth user journey:

| Route | Page Name | Access | Purpose |
| --- | --- | --- | --- |
| `/` | **Landing Page** | Public | Hero section, countdown, and "Register" button. |
| `/register` | **Registration** | Public | Custom form replacing the Google Form. |
| `/gallery` | **Media Hub** | Public | Grid of images/videos from the party. |
| `/hall-of-fame` | **Winners** | Public | Showcase of game winners (Posturize style). |
| `/admin` | **Dashboard** | Admin | Table of all participants with Check-in buttons. |
| `/admin/upload` | **Media Manager** | Admin | Upload interface for gallery and winner cards. |

---

## 3. Database & Authentication

To handle participant data and media, you need a structured database.

### **Database Schema (Relational)**

* **Users Table:** `id`, `name`, `roll_no`, `branch`, `email`, `phone`, `food_pref`, `check_in_status` (boolean), `timestamp`.
* **Media Table:** `id`, `url`, `uploader_id`, `type` (image/video), `category` (general/winner).
* **Winners Table:** `user_id`, `award_title` (e.g., Mr. Fresher), `image_url`.

### **Authentication**

* **Participant Auth:** Since it's a one-time college event, you can use **OTP-based login** (via phone or email) or just a **Roll Number + Phone** combination to view their personalized page.
* **Admin Auth:** Secure login (Email/Password) restricted to the organizing committee.

---

## 4. Form Validation Techniques

Validation ensures your data is clean before it hits the database. You should use a **two-tier validation strategy**:

### **A. Client-Side (Immediate Feedback)**

* **Required Fields:** Using HTML5 `required` attribute.
* **Regex Validation:** * *Email:* Must end with `@yourcollege.edu.in`.
* *Phone:* Must be exactly 10 digits ($^[0-9]{10}$$).
* *Roll Number:* Ensure it follows the college format (e.g., `24-CS-01`).


* **Real-time UI:** Changing the input border to **Red** (invalid) or **Green** (valid) as the user types.

### **B. Server-Side (Security)**

* **Sanitization:** Cleaning the input to prevent SQL Injection or XSS (Cross-Site Scripting).
* **Uniqueness Check:** Ensuring a Roll Number hasn't registered twice.

---

## 5. The "Check-in" Logic

For the maintaining records part, the Admin Dashboard should have a **QR Scanner** or a **Searchable Table**.

* When a student arrives, the admin searches their name.
* Clicks "Check-In".
* The system updates `check_in_status = true` and records the `check_in_time`.
* **Analytics:** You can then see a live counter: *“345/500 Students Arrived.”*
