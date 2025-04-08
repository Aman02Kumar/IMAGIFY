# Imagify - Text-to-Image Generator

Imagify is a web application built using the MERN stack (MongoDB, Express, React, Node.js) that allows users to generate images from text prompts. The application uses AI to transform user-provided text into visually appealing images and integrates the Razorpay payment gateway to facilitate payments for premium image generations.

## Features
- **Text-to-Image Generation**: Users can input text, and the AI model will generate an image based on the provided text.
- **Payment Gateway**: Razorpay integration for making payments for premium features.
- **User Authentication**: Users can sign up and log in to access their generated images and manage their account.
- **Image Gallery**: Users can view and download their previously generated images.

## Tech Stack
- **Frontend**: React.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Payment Gateway**: Razorpay
- **AI Model**: Clipdrop.ai

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/43f2f9a5-02a0-4645-bc13-23e776139439" />
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/13a33c8b-11df-4a55-ac69-1f08421b77a6" />
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/67648bc6-12e6-45de-9679-51cd0a4246ca" />
<img width="400" alt="Image" src="https://github.com/user-attachments/assets/dd19ab67-6f3b-411d-be07-8b80ce3ccf81" />

## Setup Instructions

### Prerequisites
Before you begin, ensure that you have the following installed:
- Node.js (LTS version)
- MongoDB (locally or use a cloud service like MongoDB Atlas)
- Razorpay account (for API keys)

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/Imagify.git

Frontend:
- cd Imagify
- npm i
- npm run dev

Backend:
- npm i
- nodemon server.js
