# Deployment Guide for Next.js App to VPS using aaPanel

To deploy your Next.js app (a dashboard using Supabase for backend) to a VPS using aaPanel, follow these steps. This assumes your VPS is running Linux (aaPanel supports CentOS, Ubuntu, etc.) and you have aaPanel installed and configured. If not, install aaPanel first via their official installer script.

## Prerequisites
- **VPS Setup**: Ensure aaPanel is installed. If not, SSH into your VPS and run: `curl -sSO http://www.aapanel.com/script/install_7.0_en.sh && bash install_7.0_en.sh`. Follow the prompts to set up (creates admin account).
- **Node.js Version**: Your app uses Next.js 15.5.6, which requires Node.js 18+. Install via aaPanel's Software Store if not already.
- **Domain/SSL**: If exposing publicly, configure a domain in aaPanel (Website > Sites > Add Site). Use Let's Encrypt for SSL.
- **Environment Variables**: Your app needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (from your Supabase project settings). Set these securely on the server.
- **Build Locally First**: Test `npm run build` locally to ensure no errors.

## Step-by-Step Deployment
1. **Upload Your Code to the VPS**:
   - In aaPanel, go to **Files** (file manager).
   - Create a directory for your app, e.g., `/www/wwwroot/your-app`.
   - Upload all project files (excluding `node_modules`, `.next`, and `.env.local` for security) via FTP/SFTP or aaPanel's upload tool. Alternatively, use Git if aaPanel has Git manager installed.

2. **Install Dependencies and Build**:
   - In aaPanel, go to **Website** > **Node.js Project** > **Add Project**.
   - **Project Name**: e.g., "chat-dashboard".
   - **Root Directory**: Select the uploaded folder (e.g., `/www/wwwroot/your-app`).
   - **Node.js Version**: Select 18 or 20 (match your local setup).
   - **Run Command**: Set to `npm start` (this runs `next start` after build).
   - **Port**: If aaPanel has a "Port" or "Listen Port" field in the form, set it to 3001 (or your chosen port). If not, the app will use 3000.
   - **Environment Variables**: Add your Supabase keys here (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY). Do not hardcode them in files.
   - Save the project. aaPanel will auto-run `npm install`.
   - If `npm` is not available in the project's environment or aaPanel's terminal:
     - Use aaPanel's web-based terminal (top-right "Terminal" button) or SSH into your VPS.
     - Install npm: Run `curl -L https://www.npmjs.com/install.sh | sh` (this installs npm globally).
     - Alternatively, if on Ubuntu: `sudo apt update && sudo apt install npm`
     - Or on CentOS: `sudo yum install npm` (adjust for your OS).
     - Then, navigate to your project directory (e.g., `cd /www/wwwroot/your-app`) and run:
       - `npm install` (to install dependencies).
       - `npm run build` (to build the app).
   - If aaPanel supports a "Build Command" field, set it to `npm run build`.

3. **Configure the App**:
   - **Port**: Next.js defaults to port 3000. If port 3000 is in use, choose another (e.g., 3001). If aaPanel's Node.js form has a "Port" field, set it there. If not, add `PORT=3001` to Environment Variables or modify Run Command to `PORT=3001 npm start`. Update the reverse proxy accordingly (e.g., localhost:3001). Restart the project after changes.
   - **Domain Binding**: In **Website** > **Sites**, bind your domain to the Node.js project (reverse proxy to localhost:port).
   - **Firewall/Security**: Ensure ports 80/443 are open. Use aaPanel's firewall to restrict access if needed.
   - **SSL**: Enable in the site settings for HTTPS.

4. **Start and Test**:
   - In **Node.js Project**, click **Start** for your project.
   - Check logs in aaPanel for errors (e.g., missing env vars or build failures).
   - Access via your domain/IP. If issues, verify env vars and rebuild.

## Additional Notes
- **Performance**: For production, consider PM2 (install via aaPanel Software Store) to manage the process, or use aaPanel's built-in process manager.
- **Database**: Since you're using Supabase, no server-side DB setup needed—just ensure env vars point to your Supabase project.
- **Updates**: To redeploy, upload new files, rebuild (`npm run build`), and restart the project.
- **Troubleshooting**: If build fails, check aaPanel logs or run commands manually in the terminal. Ensure Node.js version matches.
- **Costs/Resources**: VPS should have at least 1GB RAM for Next.js.

If you encounter specific errors, share aaPanel logs or more details about your VPS setup.