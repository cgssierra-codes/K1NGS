Step 1: Install Node.js
Make sure you have Node.js installed on your system. You can download it from Node.js official website. Installing Node.js will also install npm (Node Package Manager).

To check if Node.js is installed:
bash
Copy code
node -v
npm -v
Version:  10.8.1

Step 2: Create a New React App
Run the following command in your terminal to create a new React project:

bash
Copy code
npx create-react-app k1ngs-pool-table-tracker
Navigate into the project folder:

bash
cd k1ngs-pool-table-tracker


Step 3: Install the Required Library
Install the xlsx library for handling Excel file creation:
Run this Commands to fix some issues:
npm install xlsx

Step 4: Some fixes
npm audit fix --force
set NODE_OPTIONS=--openssl-legacy-provider

Install nvm (Node Version Manager).
Use it to install and switch to Node.js version 16:
nvm install 16
nvm use 16