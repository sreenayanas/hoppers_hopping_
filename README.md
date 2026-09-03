<img width="1280" height="640" alt="git (1)" src="https://github.com/user-attachments/assets/8920b256-2ba8-4988-b824-5351134eb4bd" />



# [Project Name] Hopper's Hopping


## Basic Details
### Team Name: The Glitch


### Team Members
- Team Lead: [Name] - Sree Nayana S
- Member 2: [Name] - Sreelakshmi A

### Project Description
The Grace Hopper Bug Hunt is a debugging game that turns Python coding errors into a chaotic, haunted 1947 computer-lab experience. Instead of simply showing the error, it detects the error type and sends the player into a Shakespearean-narrated mini-game where Grace Hopper battles moths.

### The Problem (that doesn't exist)
**Ridiculous problem we're solving:**
Turning the frustrating experience of debugging Python errors into an unnecessarily dramatic, chaotic game instead of actually helping you fix the code. Why debug normally when Grace Hopper can beat the bugs with a bat? 🦋🏏


### The Solution (that nobody asked for)
We’re not actually helping people debug. That would be far too sensible. 💀

Instead:
1. Player submits Python code → our backend runs it.
2. We detect the error type → TypeError, SyntaxError, NameError, etc.
3. We deliberately hide the actual error message because useful information is apparently overrated.
4. The bug becomes a moth → Grace Hopper enters the haunted 1947 computer lab with a bat.
5. Player fights the bug in a mini-game → because debugging should involve violence against insects.
6. Win or lose → the game gives you dramatic Shakespearean mockery instead of telling you how to fix your code.

Basically:

We take a normal debugging problem, remove the helpful part, add Grace Hopper, moths, Shakespeare, and chaos—and call it a solution. 💀🦋

## Technical Details
### Technologies/Components Used
For Software:
-Languages used: Python, HTML, CSS, JavaScript
-Frameworks used: Flask
-Libraries used: Flask-CORS, Gunicorn
-Tools used: VS Code, Git, GitHub, Netlify, Render, Canvas API, LocalStorage

For Hardware:
No hardware components used

### Implementation
For Software:
# Installation
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Run
Start the backend:

cd backend
venv\Scripts\activate
python app.py

Start the frontend in another terminal:

cd frontend
python -m http.server 5500

### Project Documentation
For Software:

Hopper's Hoppin (The Grace Hopper Bug Hunt) is a useless Python debugging game. The backend, built with Flask, receives Python code from the frontend and executes it. It determines whether the code runs successfully or identifies the type of error that occurred.

Instead of displaying the actual error message or line number, the frontend turns the error into a chaotic game where Grace Hopper battles bugs/moths in a haunted 1947 computer laboratory.

Backend API:

GET /health → Checks whether the backend is running.
POST /run → Receives Python code and returns either:
{"status":"clean"}
{"status":"error","error_type":"TypeError"}

The frontend communicates with this API using JavaScript and provides the game interface, animations, sounds, and player experience.

# Screenshots (Add at least 3)
![Screenshot1](Add screenshot 1 here with proper name)
*Add caption explaining what this shows*

![Screenshot2](Add screenshot 2 here with proper name)
*Add caption explaining what this shows*

![Screenshot3](Add screenshot 3 here with proper name)
*Add caption explaining what this shows*

# Diagrams
![Workflow](Add your workflow/architecture diagram here)
*Add caption explaining your workflow*

For Hardware:

# Schematic & Circuit
![Circuit](Add your circuit diagram here)
*Add caption explaining connections*

![Schematic](Add your schematic diagram here)
*Add caption explaining the schematic*

# Build Photos
![Components](Add photo of your components here)
*List out all components shown*

![Build](Add photos of build process here)
*Explain the build steps*

![Final](Add photo of final product here)
*Explain the final build*

### Project Demo
# Video
[Add your demo video link here]
*Explain what the video demonstrates*

# Additional Demos
[Add any extra demo materials/links]

## Team Contributions
- [Name 1]: [Specific contributions]
- [Name 2]: [Specific contributions]
- [Name 3]: [Specific contributions]

---
Made with ❤️ at TinkerHub Useless Projects 

![Static Badge](https://img.shields.io/badge/TinkerHub-24?color=%23000000&link=https%3A%2F%2Fwww.tinkerhub.org%2F)
![Static Badge](https://img.shields.io/badge/UselessProjects--26-26?link=https%3A%2F%2Ftinkerhub.org%2Fevents%2F1M8ORET9A1%2Fuseless-projects-3.0)



