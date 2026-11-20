# DignityLink – Menstrual Hygiene Education Platform

DignityLink is a community-focused digital health platform designed to improve menstrual hygiene awareness among women and girls in Internally Displaced Persons (IDP) camps and rural communities.

The platform uses SMS and WhatsApp to deliver short, culturally appropriate menstrual hygiene education messages, making essential health information accessible even to people without smartphones or reliable internet connectivity.

Local volunteers can register beneficiaries, capture informed consent, manage registrations, and monitor message delivery and feedback through a centralized dashboard.

### Key Features

- **Beneficiary Registration:** Register beneficiaries with their names, phone numbers, preferred languages, and communities.
- **Consent Management:** Capture informed consent, including parental or guardian consent for beneficiaries under 18.
- **Automated Messaging:** Schedule educational messages using Node.js and node-cron.
- **SMS & WhatsApp Integration:** Configurable messaging architecture with mock providers for the prototype.
- **Multilingual Content:** Supports English and Hausa message libraries.
- **Feedback Management:** Capture beneficiary responses and display feedback on the dashboard.
- **Opt-out Management:** Allow beneficiaries to stop receiving messages.
- **Volunteer Dashboard:** Monitor registrations, message activity, and feedback by community.
- **JWT Authentication:** Secure volunteer and coordinator access with role-based permissions.

### Tech Stack

- Frontend: React, Tailwind CSS
- Backend: Node.js, Express.js
- Database: MongoDB, Mongoose
- Authentication: JSON Web Tokens (JWT)
- Scheduling: node-cron
- Messaging: Mock SMS and WhatsApp providers

### Project Goal

To make menstrual hygiene education more accessible, affordable, and sustainable by combining low-bandwidth digital communication with community-based support.

**Note:** This is a working hackathon prototype. SMS and WhatsApp delivery are simulated through mock providers. Real messaging integrations are planned for future deployment.
