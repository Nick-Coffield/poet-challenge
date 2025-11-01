# The Poet

Author: Nicholas Coffield  
Tech Stack: Angular • TypeScript • PoetryDB API • HTML/CSS  

A minimalist Angular web app that connects to the PoetryDB API to search poems by author or title, fetch random poems, and perform word-frequency analysis.  
Built for clarity, simplicity, and accessibility.

---

## Live Demo
https://Nick-Coffield.github.io/poet-challenge/

(Hosted via GitHub Pages — public and shareable.)

---

## Features
- Search poems by author, title, or both  
- Retrieve a random poem  
- Case-insensitive search  
- Optional "Find by Word" mode — shows poems where a word appears most frequently  
- Displays word occurrence counts for each poem  
- Clean, responsive interface  
- Clear error and loading messages  

---

## Tech Stack
| Category | Tools |
|-----------|--------|
| Frontend Framework | Angular 18 |
| Language | TypeScript |
| API Source | PoetryDB.org |
| Styling | Custom CSS (accessible light theme) |
| Hosting | GitHub Pages |

---

## Run Locally
```bash
# 1. Clone the repository
git clone https://github.com/Nick-Coffield/poet-challenge.git
cd poet-challenge

# 2. Install dependencies
npm install

# 3. Start the development server
ng serve

# Then open http://localhost:4200 in your browser
Deploy to GitHub Pages
bash
Copy code
# Build for production and output to the docs folder
ng build --output-path docs --base-href /poet-challenge/

# Commit and push the build
git add .
git commit -m "update build"
git push
Your live site will update automatically in about one to two minutes.

Notes
Uses Angular HttpClient for API calls

Search is case-insensitive and trimmed

Layout and design emphasize accessibility and simplicity

Error handling and feedback are built in

Author
Nicholas Coffield
Penn State University – B.S. in Computer Engineering
Blue Band Trombone Section • Bluecoats 2025

GitHub: https://github.com/Nick-Coffield
LinkedIn: https://linkedin.com/in/nick-coffield