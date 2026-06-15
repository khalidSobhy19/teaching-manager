TeachFlow - Teaching Management App 📚⚡

TeachFlow is a modern, fast, and completely private web application designed specifically for tutors and teachers to effortlessly manage their teaching groups, track daily sessions, and automatically generate accurate salary reports.

✨ Key Features

👥 Group Management: Easily create and manage student groups with specific levels (Q1, Q2, Q3) and automated pricing per session.

🗓️ Weekly Schedules: Set up your weekly timetable for each group (Day & Time) for a clear overview of your week.

⚡ Smart Quick Add: Add sessions at lightning speed using our custom Smart Code parser. Just paste a string like 3c.Sr.pri.q2.12062026.3pm.7253 and the app will automatically extract the date, time, level, and even auto-create the group if it doesn't exist!

💰 Smart Salary Calculation: Automatically calculates total sessions and expected salary within a specific custom billing period (from the 26th of the previous month to the 25th of the current month).

📊 Export & Print: Export your monthly reports to CSV (Excel) or print them directly with a clean, print-optimized PDF layout.

🔒 100% Private (Local Storage): No backend required! All your sensitive data is stored securely in your browser's local storage.

🚀 The "Smart Code" Feature

The Quick Add input field is highly intelligent. You can paste a full tracking code, and it will parse the data automatically:

Example Input: 3c.Sr.pri.q2.12062026.3pm.7253

Level: Extracts q2 and assigns the correct price (110 EGP).

Date: Extracts 12062026 and sets the session date to June 12, 2026.

Time: Extracts 3pm and sets the session time.

Group Name: Uses the full original string as the group identity.

Note: You can always manually override the date using the date picker next to the input field.

🛠️ Technologies Used

Framework: React.js (via Vite for lightning-fast bundling)

Styling: Tailwind CSS v4

Icons: Lucide React

Data Persistence: Browser localStorage

💻 Getting Started (Local Development)

To run this project on your local machine:

Clone the repository:

git clone https://github.com/YourUsername/teaching-manager.git
cd teaching-manager


Install dependencies:

npm install


Start the development server:

npm run dev


Open your browser and visit http://localhost:5173

🌐 Deployment

This project is optimized for direct deployment on Vercel.
Simply import your GitHub repository into Vercel, leave the default Vite build settings, and deploy for free!

Built to make teaching management easier.
