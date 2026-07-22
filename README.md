# AtulAudit — Website Audit & Lead-Generation Tool for AtulAutomation

AtulAudit is a free website health report and lead-generation tool built for [AtulAutomation](https://atulautomation.com). It analyzes public websites across SEO, performance, accessibility, conversion readiness, AI automation opportunities, and Google & Meta marketing presence.

---

## 🌟 Direct Lead Capture Workflow

AtulAudit captures leads directly on your server without requiring third-party middleware:

1. **Google Sheets (Direct Row Append):** Every unlocked report appends a new row to your Google Sheet via Google Apps Script Web App (`GOOGLE_SHEETS_WEBHOOK_URL`).
2. **Resend Email (Direct Delivery):**
   - Sends an instant branded report confirmation email to the lead.
   - Sends an internal lead notification alert to `hello@atulautomation.com`.
3. **WhatsApp (Direct Confirmation Message):** Sends an instant WhatsApp message to the lead's phone number with their domain score and direct report URL via Meta Cloud API / Interakt / Aisensy / WATI.
4. **Supabase Postgres Database:** Stores lead details securely under strict Row-Level Security (RLS) policies.

---

## 📊 Google Sheets Direct Setup (Apps Script)

To automatically record all leads in Google Sheets:

1. Open a new Google Sheet (e.g. named `AtulAudit Leads`).
2. Add header row in Row 1:
   `Timestamp | Domain | OverallScore | SeoScore | PerformanceScore | AccessibilityScore | ConversionScore | AutomationScore | Name | Email | Company | Phone | ReportUrl | AuditId`
3. Click **Extensions** > **Apps Script**.
4. Paste the following script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.Timestamp,
      data.Domain,
      data.OverallScore,
      data.SeoScore,
      data.PerformanceScore,
      data.AccessibilityScore,
      data.ConversionScore,
      data.AutomationScore,
      data.Name,
      data.Email,
      data.Company,
      data.Phone,
      data.ReportUrl,
      data.AuditId
    ]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```
5. Click **Deploy** > **New Deployment** > Select **Web app**.
6. Set **Execute as:** `Me` and **Who has access:** `Anyone`.
7. Click **Deploy**, copy the Web App URL, and set it as `GOOGLE_SHEETS_WEBHOOK_URL` in your `.env.local` or Hostinger environment.

---

## 🖥️ Deploying to Hostinger (Node.js Hosting / VPS)

### Option A: Hostinger VPS (Recommended for PM2 + Nginx)

1. **SSH into Hostinger VPS:**
   ```bash
   ssh root@your-hostinger-vps-ip
   ```
2. **Install Node.js 20 & PM2:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx git
   sudo npm install -g pm2
   ```
3. **Clone and Build AtulAudit:**
   ```bash
   cd /var/www
   git clone https://github.com/your-username/atul-audit.git
   cd atul-audit
   npm install
   cp .env.example .env.local  # Fill in production values
   npm run build
   ```
4. **Start Application with PM2:**
   ```bash
   pm2 start npm --name "atul-audit" -- start
   pm2 save
   pm2 startup
   ```
5. **Configure Nginx Reverse Proxy:**
   Create `/etc/nginx/sites-available/atul-audit`:
   ```nginx
   server {
       server_name audit.atulautomation.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Enable site and install free SSL:
   ```bash
   sudo ln -s /etc/nginx/sites-available/atul-audit /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d audit.atulautomation.com
   ```

---

## 🧪 Testing & Quality Suite

Run unit tests:
```bash
npm test
```

Run TypeScript type check:
```bash
npm run typecheck
```

Run ESLint:
```bash
npm run lint
```
