# Deployment Guide for Next.js App to VPS using aaPanel

This guide covers deploying your Next.js dashboard (with Supabase backend) to a VPS using **aaPanel's Node.js Project Manager**.

---

## Prerequisites

- **VPS Setup**: aaPanel installed. If not:
  ```bash
  curl -sSO http://www.aapanel.com/script/install_7.0_en.sh && bash install_7.0_en.sh
  ```
- **Node.js 18+**: Install via aaPanel **Software Store** → Search "Node.js" → Install
- **Domain**: Configure in aaPanel (Website > Sites > Add Site)
- **Environment Variables**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 1: Upload Your Code

### Option A: Using Git (Recommended)

1. SSH into your server or use aaPanel's Terminal
2. Navigate to www directory and clone:
   ```bash
   cd /www/wwwroot
   git clone https://github.com/drjimmy1990/bot-dashboard.git dashboard
   ```

### Option B: Manual Upload

1. In aaPanel, go to **Files** (file manager)
2. Create directory: `/www/wwwroot/dashboard`
3. Upload all files **except**: `node_modules`, `.next`, `.env.local`

---

## Step 2: Create Environment File

1. In aaPanel **Files**, navigate to `/www/wwwroot/dashboard`
2. Create a new file: `.env.local`
3. Add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 3: Install Dependencies

1. In aaPanel, go to **Terminal** (or SSH)
2. Run:
   ```bash
   cd /www/wwwroot/dashboard
   npm install
   ```

---

## Step 4: Build the Application

```bash
cd /www/wwwroot/dashboard
npm run build
```

> **Note**: This creates the `.next` folder required for production.

---

## Step 5: Configure aaPanel Node.js Project Manager

1. Go to **Website** → **Node.js Project** → **Add Project**

2. Fill in the form:

   | Field | Value |
   |-------|-------|
   | Project Name | `dashboard` |
   | Root Directory | `/www/wwwroot/dashboard` |
   | Node.js Version | `18` or `20` |
   | Package Manager | `npm` |
   | Run Command | `next start -p 3099` |

3. **Environment Variables** (Add these):
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key-here`

4. Click **Submit** to save

5. Click **Start** to run the project

---

## Step 6: Configure Reverse Proxy

1. Go to **Website** → **Sites** → **Add Site**
2. Enter your domain name
3. Select the site → Click **Reverse Proxy** tab
4. Click **Add Reverse Proxy**:

   | Field | Value |
   |-------|-------|
   | Name | `dashboard` |
   | Target URL | `http://127.0.0.1:3099` |

5. Save

---

## Step 7: Enable SSL (HTTPS)

1. Go to **Website** → **Sites** → Select your domain
2. Click **SSL** tab
3. Click **Let's Encrypt** → Apply
4. Enable **Force HTTPS**

---

## Port Configuration

| Service | Port | Description |
|---------|------|-------------|
| Next.js App | **3099** | Internal application port |
| Nginx HTTP | 80 | Public HTTP (redirects to 443) |
| Nginx HTTPS | 443 | Public HTTPS access |

> **Changing the port**: Edit the Run Command in Node.js Project Manager:
> `next start -p YOUR_PORT`

---

## Managing the Application

### In aaPanel Node.js Project Manager:

| Action | How |
|--------|-----|
| Start | Click **Start** button |
| Stop | Click **Stop** button |
| Restart | Click **Restart** button |
| View Logs | Click **Logs** button |

### Updating the Application:

1. SSH into server or use aaPanel Terminal
2. Run:
   ```bash
   cd /www/wwwroot/dashboard
   git pull origin main
   npm install
   npm run build
   ```
3. In **Node.js Project Manager**, click **Restart**

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Change port in Run Command (e.g., `next start -p 3100`) |
| Build fails | Check Node.js version: needs 18+ |
| App not accessible | Verify Reverse Proxy points to correct port (3099) |
| 502 Bad Gateway | App not running - click Start in Node.js Project Manager |
| Environment vars not working | Add them in Node.js Project Manager settings |
| `.next` folder missing | Run `npm run build` first |

---

## System Requirements

- **RAM**: Minimum 1GB (2GB recommended)
- **Disk**: 2GB free space
- **Node.js**: Version 18 or higher
- **aaPanel**: Latest version with Node.js Project Manager plugin

---

## Quick Reference: Run Command

```
next start -p 3099
```

This is the exact command used in aaPanel's Node.js Project Manager to start the production server on port 3099.