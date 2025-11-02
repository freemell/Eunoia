# ngrok Setup (Quick)

ngrok now requires a free account. Here's how to set it up:

## Option 1: Quick ngrok Setup (2 minutes)

1. **Sign up for free account:**
   - Go to: https://dashboard.ngrok.com/signup
   - Sign up with email (free)

2. **Get your authtoken:**
   - After signup, go to: https://dashboard.ngrok.com/get-started/your-authtoken
   - Copy your authtoken

3. **Configure ngrok:**
   ```powershell
   npx ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
   ```

4. **Then start ngrok:**
   ```powershell
   npx ngrok http 3000
   ```

## Option 2: Deploy to Vercel (Easier - Recommended)

Instead of local testing, deploy directly to Vercel:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Telegram bot"
   git push
   ```

2. **Deploy on Vercel:**
   - Go to: https://vercel.com
   - Import your GitHub repo
   - Add environment variables in Vercel dashboard
   - Deploy!

3. **Set webhook after deployment:**
   - Visit: `https://your-app.vercel.app/api/telegram/setup`

This is easier because you don't need ngrok at all!

## Option 3: Use Cloudflare Tunnel (Free, No Account Required)

```powershell
# Install cloudflared (Cloudflare Tunnel)
winget install --id Cloudflare.cloudflared

# Then run:
cloudflared tunnel --url http://localhost:3000
```

This gives you a free HTTPS URL without needing an account!

