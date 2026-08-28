@echo off
echo Starting Transit server...
cd server
start node server.js
cd ..
echo Server running at http://localhost:3000
echo Open index.html with Live Server
pause