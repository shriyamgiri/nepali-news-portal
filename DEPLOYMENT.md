# 🚀 Deployment Guide - Nepal News Portal

Complete step-by-step guide to deploy your Nepali news portal.

## Option 1: Vercel (Recommended - 100% FREE)

### Why Vercel?
- ✅ 100% free for personal projects
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ GitHub integration
- ✅ Automatic deployments on push

### Steps to Deploy

#### Step 1: Prepare Your Project
```bash
# Make sure you're in the project directory
cd nepali-news-portal

# Test build locally
npm run build

# If build succeeds, you're ready!
```

#### Step 2: Push to GitHub

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial deployment - Nepal News Portal"

# Create repository on GitHub.com
# Then link it:
git remote add origin https://github.com/YOUR_USERNAME/nepali-news-portal.git

# Push
git push -u origin main
```

#### Step 3: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"** (use GitHub account)
3. Click **"Add New Project"**
4. Click **"Import Git Repository"**
5. Select `nepali-news-portal`
6. **Framework Preset**: Next.js (auto-detected)
7. **Root Directory**: ./
8. Click **"Deploy"**
9. Wait 2-3 minutes
10. ✅ Your site is LIVE!

#### Step 4: Get Your URL

You'll get a URL like:
```
https://nepali-news-portal.vercel.app
```

Or connect your own domain:
- Go to Project Settings > Domains
- Add your domain (e.g., `nepalkhabar.com`)
- Update DNS records as shown
- Done!

### Automatic Updates

Every time you push to GitHub, Vercel auto-deploys:

```bash
# Make changes
# Then:
git add .
git commit -m "Updated homepage design"
git push

# Vercel automatically rebuilds and deploys
```

---

## Option 2: Netlify (Also FREE)

### Steps:

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "Add new site" > "Import existing project"
4. Select your GitHub repo
5. Build command: `npm run build`
6. Publish directory: `.next`
7. Click "Deploy"

---

## Option 3: Manual VPS (DigitalOcean / AWS)

For more control (costs ~$5/month):

### Requirements
- Ubuntu 22.04 server
- Node.js 18+
- Nginx
- PM2

### Quick Setup

```bash
# SSH into your server
ssh root@your-server-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Clone your project
git clone https://github.com/YOUR_USERNAME/nepali-news-portal.git
cd nepali-news-portal

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "nepal-news" -- start

# Save PM2 config
pm2 save
pm2 startup

# Install Nginx
sudo apt install nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/nepali-news
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/nepali-news /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (free)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Domain Setup

### Buy Domain (.com.np or .com)

**Option A: Nepal Domain (.com.np)**
- Go to [register.com.np](https://register.com.np)
- Search for available domains
- Register (requires Nepali citizenship/company registration)
- Cost: ~NPR 1,500/year

**Option B: International (.com / .news)**
- Go to [Namecheap](https://namecheap.com) or [GoDaddy](https://godaddy.com)
- Search: `nepalkhabar.com`
- Register
- Cost: $10-15/year

### Connect Domain to Vercel

1. In Vercel dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your domain: `nepalkhabar.com`
4. Vercel shows DNS records needed
5. Go to your domain registrar (Namecheap/GoDaddy)
6. Add these DNS records:
   - Type: `A` | Name: `@` | Value: `76.76.21.21`
   - Type: `CNAME` | Name: `www` | Value: `cname.vercel-dns.com`
7. Wait 10-30 minutes for DNS propagation
8. ✅ Your custom domain is live!

---

## Environment Variables (For Production)

When backend is ready, add these in Vercel:

1. Go to Project Settings > Environment Variables
2. Add:

```
DATABASE_URL=your_supabase_connection_string
DATABASE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
NEWS_API_KEY=your_newsapi_key
ADMIN_PASSWORD_HASH=bcrypt_hashed_password
```

3. Redeploy

---

## Performance Optimization

### Before Deployment

1. **Optimize Images**
```bash
# Use next/image component (already done)
# Compress images before upload
```

2. **Enable Caching**
Already configured in `next.config.js`

3. **Minify Assets**
Next.js does this automatically in production

### After Deployment

1. **Check Lighthouse Score**
- Open site in Chrome
- Press F12 > Lighthouse
- Run audit
- Aim for 90+ score

2. **Monitor Performance**
- Use Vercel Analytics (free)
- Or Google Analytics

---

## SSL Certificate (HTTPS)

### Vercel/Netlify
✅ Automatic HTTPS - no setup needed

### Manual VPS
Use Certbot (free Let's Encrypt):

```bash
sudo certbot --nginx -d nepalkhabar.com -d www.nepalkhabar.com
```

Auto-renewal:
```bash
sudo certbot renew --dry-run
```

---

## Troubleshooting

### Build Fails

**Error**: "Module not found"
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error**: "Out of memory"
```bash
# In package.json, update build script:
"build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
```

### Site Not Loading

1. Check if build succeeded in Vercel
2. Check browser console for errors
3. Verify DNS settings (takes up to 48hrs)

### Slow Loading

1. Enable Vercel Analytics
2. Optimize images (use WebP format)
3. Enable caching headers
4. Use CDN (Vercel includes this)

---

## Maintenance

### Update Dependencies

```bash
npm outdated
npm update
```

### Security Updates

```bash
npm audit
npm audit fix
```

### Backup

- GitHub is your backup (code)
- Export database regularly (Supabase has daily backups)

---

## Cost Breakdown

### Zero-Cost Setup (Recommended to Start)
- ✅ Vercel hosting: FREE
- ✅ Supabase database: FREE (500MB)
- ✅ Gemini API: FREE (60 requests/min)
- ✅ GitHub: FREE
- ✅ SSL Certificate: FREE (auto)
- **Total: NPR 0/month**

### With Custom Domain
- Domain (.com): $12/year = NPR 1,600/year
- Everything else: FREE
- **Total: NPR 133/month**

### At Scale (1000+ articles/day)
- Vercel Pro: FREE (hobby tier sufficient)
- Supabase: $25/month
- OpenAI API: ~$30/month
- Domain: $12/year
- **Total: ~$55/month = NPR 7,500/month**

---

## Go Live Checklist

- [ ] Code pushed to GitHub
- [ ] Deployed to Vercel
- [ ] Domain connected
- [ ] HTTPS working
- [ ] Mobile responsive tested
- [ ] Lighthouse score > 90
- [ ] Social media accounts created
- [ ] Google Search Console added
- [ ] Analytics setup
- [ ] 404 page working
- [ ] Sitemap.xml generated
- [ ] robots.txt created

---

## Next Steps After Frontend Deploy

1. **Deploy Frontend** (you're here!) ✅
2. **Setup Supabase Database**
3. **Build News Fetcher API**
4. **Integrate AI Translation**
5. **Connect Admin Panel**
6. **Test with 10 real sources**
7. **Soft Launch**
8. **Marketing & SEO**

---

## Support

If you face issues:
1. Check Vercel deployment logs
2. Check browser console (F12)
3. Verify Node.js version matches (18+)
4. Clear browser cache
5. Try incognito mode

---

**Ready to deploy? Let's go! 🚀**

Run: `npm run build` then deploy to Vercel!
