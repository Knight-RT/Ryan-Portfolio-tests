# ICT3113 Week 06 acceptance specification

- R1: Exactly one section with each ID: hero, about, skills, projects, repos, contact.
- R2: No document horizontal overflow at viewport width 375 pixels.
- R3: Hero and contact each link to https://github.com/Knight-RT. Both hero and contact must show the email and LinkedIn links. Email and LinkedIn must be configured before deployment. When absent, visible “Email coming soon” and “LinkedIn coming soon” text replaces fake links. The configured values are ryan.tan.0310@gmail.com and https://www.linkedin.com/in/ryan-tan0310/. CONTACT_EMAIL and LINKEDIN_URL may override these defaults; explicitly empty values select pending contact details.
- R4: Successful GET https://api.github.com/users/Knight-RT/repos?sort=updated&per_page=12 renders public repository cards with name, description, language, star count, and repository URL. Null descriptions and languages are handled gracefully.
- R5: An empty repository array produces a clear empty message.
- R6: A failed repository request produces a clear error message.
- R7: A navigation button named “Toggle dark mode” toggles body.dark.
- R8: A fresh browser session starts dark. A selected light theme survives reload and same-tab navigation. A new browser context starts dark.
- R9: A button named “Back to top” is hidden whenever the hero is visible, appears once the hero bottom crosses the viewport top, and scrolls to the top and hides when clicked.


