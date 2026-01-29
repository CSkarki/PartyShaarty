# Invite App (Evite-style)

A minimal invite site you can share as a link. Guests RSVP with name, email, attending (Yes/No), and an optional message. Responses are stored in a **local JSON file** (`data/rsvps.json`). Only the host can view and download RSVPs (see Host page below).

## Quick start

1. **Image**  
   Put your invite image in the project as:
   ```
   public/invite-image.jpg
   ```
   (Use JPG, PNG, or WebP; the code references `invite-image.jpg`—rename your file or change `src` in `app/page.js` if you use another name.)

2. **Run locally**
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Share that URL as the invite link.

No Google or env setup needed. RSVPs are appended to `data/rsvps.json` (created automatically). The `data/` folder is in `.gitignore` so guest data is not committed.

3. **Host page (view & download RSVPs)**  
   Add to `.env.local` (restart dev server after changes):
   ```
   HOST_USERNAME=your-username
   HOST_PASSWORD=your-password
   HOST_SESSION_SECRET=any-random-string
   ```
   Then open [http://localhost:3000/host](http://localhost:3000/host), log in with that username and password, and you can view the RSVP table and download Excel or JSON. Only someone with these credentials can see the data.

## Getting your data

Go to **/host**, log in with your host credentials, then use **Download Excel** or **Download JSON** to get the RSVP data. The Excel file is built from `data/rsvps.json`.

## Optional: change event text

Edit `app/page.js` to change the title (“You're Invited”), subtitle, and the short event/date/location text in the details section.
