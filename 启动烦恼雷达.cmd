@echo off
cd /d "%~dp0"
start "Demand Radar" /min node serve.js
start "" http://127.0.0.1:4174
