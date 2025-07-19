# 🚀 Structura.AI Backend - Deployment Guide

## 📦 Quick Upload to GitHub

### Step 1: Manual Upload
1. **Go to**: https://github.com/rushabhai2025/structura-backend-new
2. **Click**: "Add file" → "Upload files"
3. **Drag & Drop**: All files from `upload_to_github/` folder
4. **Commit**: "Initial upload - Fixed health endpoint and dependencies"
5. **Push**: Files are now on GitHub

### Step 2: Railway Deployment
1. **Go to**: Railway Dashboard
2. **Select**: structura-backend project
3. **Click**: "Deploy" or "Retry deployment"
4. **Wait**: 2-3 minutes for build
5. **Check**: Health endpoint at `https://your-app.railway.app/health`

---

## 🔍 Health Check Verification

### Expected Response:
```json
{
  "status": "healthy",
  "service": "Structura.AI Backend",
  "version": "1.0.0"
}
```

### Test Commands:
```bash
# Test health endpoint
curl https://your-app.railway.app/health

# Test root endpoint
curl https://your-app.railway.app/

# Test API docs
curl https://your-app.railway.app/docs
```

---

## 📋 File Checklist

### ✅ Core Files (Required)
- [x] `main.py` - FastAPI application
- [x] `requirements.txt` - Dependencies
- [x] `railway.json` - Railway config
- [x] `Dockerfile` - Container config

### ✅ Extractors
- [x] `pf1_comprehensive_extractor.py` - Main extractor
- [x] `pf1_quote_extractor_full.py` - Quote extractor

### ✅ Configuration
- [x] `.env.example` - Environment template
- [x] `.gitignore` - Git ignore rules
- [x] `README.md` - Documentation

### ✅ Folders
- [x] `prompts/` - AI prompts
- [x] `schemas/` - Data models
- [x] `test_pdfs/` - Test files

---

## 🛠️ Troubleshooting

### Health Check Fails
1. **Check logs**: Railway deployment logs
2. **Verify dependencies**: All packages in `requirements.txt`
3. **Test locally**: `python main.py` should work
4. **Check imports**: No missing modules

### Build Fails
1. **Python version**: Railway uses Python 3.11
2. **Dependencies**: All in `requirements.txt`
3. **Port binding**: Uses `PORT` environment variable
4. **File structure**: All files in root directory

### Runtime Errors
1. **Environment variables**: Set in Railway dashboard
2. **API keys**: OpenAI and PDF.co keys configured
3. **File permissions**: Readable by application
4. **Memory limits**: Check Railway plan limits

---

## 🔄 Version Tracking

### Check for Updates
```bash
cd upload_to_github
python check_updates.py
```

### Mark as Uploaded
```bash
python check_updates.py
# Then manually edit upload_versions.md
```

---

## 📞 Support

- **GitHub Issues**: Create issue in repository
- **Railway Support**: Check Railway documentation
- **Local Testing**: Test with `python main.py`

---

*Last updated: 2024-07-19 17:45 UTC* 