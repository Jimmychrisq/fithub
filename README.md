# FitHub - Smart Fitness Club Management System

FitHub is a modern gym and fitness clubs web application built with frontend (HTML/JS/Tailwind) and a Supabase backend. Gym members purchase digital access passes online, check-in at the gym via QR codes, book group fitness classes, and interact with an AI Fitness Coach.

Core Features
- Users accept Terms of Service during registration, their acceptance recorded securely in the database (which users are not able to manipulate).
- Buy and renew Monthly and Annual membership passes; generate a unique Member ID, auto calculate membership expiration date.
- Members get their unique QR code on their Digital membership card for seamless gym front desk check-in.
- Class Bookings: 
- Members browse, book, and cancel group fitness classes.
- Coaches/Admins: Can add, edit, or delete classes.
- Integrated with Groq AI to offer your gym members personalized workouts and recovery tips.
- Switch your web app languages instantly between English, Chinese, and Vietnamese.
- Coaches and Admins can create and send gym announcements to your members.

Tech Stack
- Frontend and CSS HTML5 and vanilla JavaScript. Tailwind CSS (CDN – no build step necessary).
- Supabase backend (Auth, PostgreSQL DB, and Row-Level Security).
- Third-Party APIs Groq API (AI Chat) MyMemory API (Free translation) qrcodejs (QRCode generation).

Project Structure
fithub-project/
├── index.html        # Landing page (Hero, Login, Register)
├── portal.html       # Member Dashboard (Buy pass, Classes, AI Chat)
├── test.html         # Automated test report (Open in browser to run)
├── css/custom.css    # Custom UI animations
└── js/
    ├── config.js     # Put your Supabase keys here
    ├── auth.js       # Login/Register logic
    ├── classes.js    # Class booking logic
    ├── membership.js # Membership pass logic
    └── ... (other modules)


How to Run the Project
There's no need to install anything, create a database or setup API keys. The project is connected to a real, live Supabase cloud database already.
Option 1: github release
Go to the Releases section on the right side of this GitHub repository, download the .zip file, extract it.
Option 2: github repository
1. Download or clone this repository.
2. Just double click on index.html and it will open in your default web browser.
Option 3: View Online 
You can view the fully deployed application instantly without downloading anything:
https://fithub.jimmychrisq.workers.dev/

How to Test
No commands, no complicated build step necessary. You can open test.html in a browser and see the automated tests with green ticks!
It covers 8 core logic tests, including:
- Role permissions (Member vs. Coach vs. Admin)
- Booking conflict prevention (cannot double-book)
- UI button states (Terms checkbox behavior)
- Membership renewal calculations

