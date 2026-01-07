# Security Guidelines

## ⚠️ IMPORTANT: Protecting Your API Key

Your Amber API key is sensitive and should **NEVER** be committed to Git or shared publicly.

### ✅ What's Protected

- `.env` file is in `.gitignore` - your actual API key stays local
- All documentation uses `psk_YOUR_API_KEY_HERE` as placeholder
- API endpoints use environment variables (not hardcoded keys)

### 🔒 Best Practices

1. **Never commit `.env`**
   - Already in `.gitignore`
   - Double-check before `git push`

2. **Use environment variables**
   ```bash
   # Local: .env file
   AMBER_API_KEY=your_actual_key_here

   # Vercel: Environment Variables settings
   # Add via Vercel dashboard, not in code
   ```

3. **Rotate if exposed**
   - If you accidentally commit your key, regenerate it immediately
   - Go to https://app.amber.com.au/developers
   - Delete old key, create new one
   - Update `.env` file

4. **Don't share `.env` file**
   - Never send via email/chat
   - Never screenshot it
   - Don't include in documentation

### 🔍 Before Pushing to GitHub

Run this check:
```bash
# Make sure no keys in tracked files
git grep "psk_" -- '*.md' '*.ts' '*.tsx' '*.js' '*.json'

# Should only show .env.example (with placeholder)
```

### 📝 What to Share

**✅ Safe to share:**
- All `.md` documentation files
- Source code (`.ts`, `.tsx`, `.js`)
- `.env.example` (with placeholder)
- Configuration files

**❌ Never share:**
- `.env` file
- Actual API keys
- Environment variable values

### 🚨 If You Exposed Your Key

1. **Regenerate immediately**
   - Amber dashboard → Developers → Delete old token → Create new

2. **Update locally**
   ```bash
   # Edit .env file
   AMBER_API_KEY=your_new_key_here
   ```

3. **Update Vercel** (if deployed)
   - Vercel dashboard → Settings → Environment Variables
   - Update `AMBER_API_KEY`
   - Redeploy

### 📚 More Info

- Amber API Security: https://app.amber.com.au/developers
- Vercel Environment Variables: https://vercel.com/docs/environment-variables
- Git Security: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure

---

## Current Status

✅ Your `.env` file is git-ignored
✅ Documentation files use placeholders
✅ No hardcoded keys in source code
✅ Environment variables configured properly

**You're secure! Just remember to never commit `.env` file.**
