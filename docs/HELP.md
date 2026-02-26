# Utsavé — Help & How-To

Use **Ctrl+F** (or Cmd+F on Mac) to search this page for a word or phrase (e.g. *RSVP*, *export*, *gallery*, *reminder*, *password*).

---

## Account & login

### How do I create an account?
Go to the home page → **Get started free** or **Create your event**. Enter your name, email, and a password (at least 8 characters), then click **Create account**. You’ll get a verification email next.

### I didn’t get the verification email
Check your **spam/junk** folder. If it’s not there, try **Sign up again** with the same email or use **Log in** — sometimes the link was already used. Make sure you typed your email correctly.

### How do I log in?
Click **Log in** (top right or on the verify-email page). Enter the **email** and **password** you used to sign up. After login you’ll go to your Dashboard.

### I forgot my password
Use the “Forgot password?” flow from the login page if the app supports it. Otherwise you may need to sign up again with the same email (if your provider allows) or contact support.

### How do I log out?
Click **Log out** in the top-right of the Dashboard or any event dashboard.

---

## Events

### How do I create a new event?
On the **Dashboard**, click **+ Create Event**. Enter event name (required), and optionally date/time and location. Click **Create Event**. You’ll be taken to that event’s dashboard.

### How do I edit my event (name, date, location, message)?
Open the event → click **Event Settings** (or **Set up →** next to “Add event details”). Change the fields and click **Save Settings**.

### Where is my invite link?
On the **Event Dashboard**, the **Invite link** is at the top (e.g. `yoursite.com/your-event/invite`). Use **Copy** to copy it. You can also see it on **Event Settings** at the bottom of the form.

### How do I change my cover photo?
Go to **Event Settings** for that event. Under **Cover Image**, use **Choose image** or **Replace** to pick a new image, then **Save Settings**.

### I have multiple events — where do I see them?
On the main **Dashboard** you see all your events as cards. Click **Manage →** on a card to open that event’s dashboard.

---

## RSVPs & guest list

### How do guests RSVP?
Share your **invite link** (e.g. `yoursite.com/event-slug/invite`). Guests open it, enter name, email, and whether they’re attending (Yes/No). They can add an optional phone and message, then submit. No app or account needed for guests.

### Where do I see who RSVP’d?
On the **Event Dashboard**, scroll to **Guest List**. You’ll see name, email, status (Attending/Declined), message, and date. Use the **All / Attending / Declined** tabs to filter.

### How do I export my guest list?
On the Event Dashboard, click **Export ↓** next to the guest list, or use **Export Excel** in the **Manage Event** section. This downloads an Excel file (e.g. `rsvps.xlsx`) with your guest data.

### How do I add many guests at once (import)?
1. Click **Import CSV** in the Manage Event section.
2. Click **Download Template** to get the correct CSV format.
3. Fill the template (required columns are usually name, email, attending “Yes” or “No”).
4. Click **Choose file**, select your CSV, then **Import**.
5. Check the result message (e.g. “X imported, Y skipped”).

### What columns does the RSVP import need?
Use the **Download Template** from the Import panel. Typically you need **name**, **email**, and **attending** (exactly “Yes” or “No”). Other columns (e.g. phone, message) may be optional. The import panel explains which are required.

### Can guests change their RSVP after submitting?
They would need to submit again with the same email; behavior depends on the app (e.g. update vs duplicate). For exact behavior, try it once with a test email.

---

## Photo gallery

### How do I create a photo album?
Open the event → **Photo Gallery** → **+ New Album**. Enter an album name and create it. Then open the album to upload photos.

### How do I upload photos?
Open an album from **Photo Gallery**. Use **Choose Photos** or **drag and drop** images. Only image files are accepted. You’ll see a message when uploads finish.

### How do I share an album with guests?
Inside an album, go to the **Sharing** tab. Add guests by selecting them from the list (guests who RSVP’d Yes) and clicking **Add**, or use **Share with All** to add all attending guests. Guests access the gallery via a link (e.g. from reminders or thank-you emails).

### How do guests view the gallery?
Guests use the gallery link you share (e.g. from an email or reminder). They may need to enter their **email** and a **verification code** sent to that email to see albums shared with them.

### Can I move or copy a photo to another album?
Inside an album, use the **move** (→) or **copy** (+) action on a photo. Choose the destination album and confirm.

### How do I delete an album or a photo?
- **Album:** In the album list, use **Delete** on the album card. Confirm; this usually deletes all photos in that album.
- **Photo:** Inside the album, use the delete (x) action on the photo and confirm.

---

## Reminders & thank you

### How do I send reminders?
From the Dashboard, open **Send Reminders** (or from an event, use the Reminders link). Select **Email** or **WhatsApp**, choose recipients (attending guests), enter subject (for email) and message, then click send. For WhatsApp, only guests with a phone number can receive messages.

### How do I send thank-you messages?
Open **Send Thank You**. Pick a template (e.g. Heartfelt, Fun & Casual, Short & Sweet) or **Custom**. Compose your message, optionally add photos or an album link. Select recipients, then send. Email and WhatsApp options work like reminders.

### Why can’t I send WhatsApp to some guests?
WhatsApp is only sent to guests who have a **phone number**. If they didn’t enter one when RSVPing, they won’t get WhatsApp. You can still send them email. Ask guests to add their phone when they RSVP if you want to use WhatsApp later.

### Can I add a photo gallery link to my reminder or thank-you?
Yes. When composing an **email**, use the **Insert album link** dropdown to pick an album; click **Insert Link** to add the gallery link into your message.

---

## Invite page (guests)

### What do guests see when they open my link?
They see your **event name**, **cover image**, **date/location**, and **personal message**, plus a form to enter name, email, attending (Yes/No), and optional phone and message. After submitting they see a confirmation (e.g. “Your RSVP has been recorded”).

### Do guests need an account?
No. Guests only need to open the link and fill the form. They don’t sign up or log in.

### The invite page doesn’t show my cover photo
Make sure you’ve **saved** a cover image in **Event Settings**. If you just saved, refresh the invite page. If it still doesn’t show, try re-uploading the image and saving again.

---

## Event setup checklist

The Event Dashboard shows **Event Setup** with 3 steps:

1. **Add event details** — Name, date, location, and message in **Event Settings**.
2. **Upload a cover photo** — In **Event Settings**, under Cover Image.
3. **Share & collect RSVPs** — Copy your invite link and share it; as responses come in, this step completes.

Complete all three for a full setup. The **Manage Event** section has shortcuts to Settings, Gallery, Reminders, Thank You, Export, and Import.

---

## Troubleshooting

### “Supabase is not configured”
The app needs backend configuration (e.g. `NEXT_PUBLIC_SUPABASE_URL` and keys). This is an admin/setup issue, not something you fix in the browser. Contact whoever hosts the app.

### “Unauthorized” or “Host profile not found”
You’re not logged in or your account doesn’t have a host profile. **Log in** with the account you used to sign up. If you just signed up, complete **email verification** first.

### Export or import fails
- **Export:** Ensure you have at least one RSVP; try again. If it still fails, check your connection.
- **Import:** Use the **Download Template** and keep required columns. Ensure **attending** is exactly “Yes” or “No”. Check the error message for row numbers and fix those rows.

### Reminder or thank-you “failed” or “skipped”
- **Email:** Check that subject and message are filled. If some send and others don’t, invalid or bouncing addresses may cause failures.
- **WhatsApp:** Only guests with a phone number receive. “Skipped” usually means no phone. Ask guests to add phone when RSVPing.

### Gallery verification code not received
Check spam. Use the same email the host used when sharing the album. Request the code again; if it still doesn’t arrive, the host may need to re-share the album with that email.

---

## Quick links (for hosts)

| I want to…              | Where to go                    |
|------------------------|--------------------------------|
| Create an event        | Dashboard → **+ Create Event** |
| Edit event & cover     | Event → **Event Settings**     |
| Copy invite link       | Event Dashboard → **Copy**     |
| See guest list         | Event Dashboard → **Guest List** |
| Export to Excel        | Event Dashboard → **Export ↓** or **Export Excel** |
| Import CSV guests      | Event Dashboard → **Import CSV** |
| Create/upload gallery  | Event → **Photo Gallery**      |
| Send reminders         | **Send Reminders**             |
| Send thank you         | **Send Thank You**             |
| Log out                | **Log out** (top right)        |

---

*Still stuck? Search this page for a keyword (e.g. export, gallery, password) or re-read the section that matches what you’re trying to do.*
