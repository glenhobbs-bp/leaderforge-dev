# Production Deployment Guide

## 🚀 GitHub → Vercel Deployment Pipeline

### Current Status: **READY FOR DEPLOYMENT** ✅

**Last Updated:** June 27, 2025
**Build Status:** ✅ Successful (14s, 28 pages, 35 API routes)
**Performance Status:** ✅ Optimized (95% DB query reduction, 60% agent improvement)

---

## Pre-Deployment Checklist

### ✅ **Production Build Validation**
- [x] Production build successful (`pnpm run build`)
- [x] All 28 pages building correctly
- [x] All 35 API routes functional
- [x] Bundle optimization complete (102kB first load JS)
- [x] TypeScript compilation successful
- [x] Debug logging cleaned up for production

### ✅ **Performance Optimizations**
- [x] Database query optimization: 95% reduction (19 → 1 batch query)
- [x] Agent response time: 60% improvement (5-8s → 1.1-3.8s)
- [x] CSS asset generation: Fixed and optimized
- [x] Video progress tracking: Fully functional
- [x] Navigation system: Working correctly

### ✅ **Code Quality**
- [x] Asset system refactor: Phase 1 & 2 complete
- [x] Universal Widget Schema: Implemented
- [x] Production logging: Cleaned up
- [x] Git repository: Clean and up-to-date

---

## Vercel Deployment Instructions

### 1. **Connect Repository to Vercel**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import from GitHub: `glenhobbs-bp/leaderforge-dev`
4. Select repository and continue
5. **IMPORTANT**: Ensure the branch is set to `main` (or `master` - both now have the same code)

### 2. **Project Configuration**

**Recommended Approach (Simplified for Vercel):**
```bash
# Build Configuration
Framework Preset: Next.js
Root Directory: apps/web
Build Command: npm run build
Output Directory: .next
Install Command: npm install --legacy-peer-deps

# Node.js Version: 18.x (recommended)
```

**Alternative Approach (Using vercel.json):**
If you prefer to use a `vercel.json` configuration file:
1. The project includes a `vercel.json` file with optimized settings
2. Set Root Directory to: `./` (project root)
3. Vercel will automatically use the configuration from the file

**Manual Configuration (if needed):**
```bash
# Build Configuration
Framework Preset: Next.js
Root Directory: ./
Build Command: cd apps/web && npm run build
Output Directory: apps/web/.next
Install Command: npm install --legacy-peer-deps

# Node.js Version: 18.x (recommended)
```

### 3. **Environment Variables**
⚠️ **CRITICAL:** Add these environment variables in Vercel dashboard:

```bash
# Supabase Configuration (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# AI/Agent Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
LANGGRAPH_API_URL=https://your-langgraph-url.com

# Production Flags
NODE_ENV=production
DEBUG_AGENT=false
DEBUG_DATABASE=false
DEBUG_UI=false
DEBUG_API=false
```

### 4. **Domain Configuration**
- Default: `your-app.vercel.app`
- Custom domain: Configure in Vercel dashboard → Settings → Domains

---

## Post-Deployment Verification

### 1. **Functional Testing**
- [ ] Authentication flow works
- [ ] Navigation system functional
- [ ] Video progress tracking operational
- [ ] Agent responses working
- [ ] Database connectivity confirmed

### 2. **Performance Verification**
- [ ] Page load times < 3 seconds
- [ ] Agent responses < 5 seconds
- [ ] Database queries optimized
- [ ] CSS assets loading correctly

### 3. **Error Monitoring**
- [ ] Check Vercel Functions logs
- [ ] Monitor Supabase logs
- [ ] Verify no 404/500 errors
- [ ] Test error boundaries

---

## Known Issues & Resolutions

### 🟡 **Development-Only Issues (Non-blocking)**
1. **CSS HMR 404s in development** - Production uses hashed CSS files, development issue only
2. **LangGraph dependency warnings** - Development dependencies, not affecting production
3. **Punycode deprecation warnings** - Node.js warnings, not affecting functionality

### ✅ **Resolved Issues**
1. **Database query performance** - Optimized with batch API
2. **Agent response times** - Improved by 60%
3. **Build system** - Working correctly
4. **Asset loading** - Fixed and optimized

---

## Rollback Plan

### If deployment issues occur:
1. **Immediate rollback**: Use Vercel dashboard → Deployments → Rollback
2. **Git rollback**: `git revert HEAD` and redeploy
3. **Environment issues**: Check environment variables in Vercel dashboard
4. **Database issues**: Verify Supabase connection and permissions

---

## Production Monitoring

### Key Metrics to Monitor:
- **Response Times**: API routes < 5s, Pages < 3s
- **Error Rates**: < 1% error rate target
- **Database Performance**: Query times < 500ms
- **Agent Performance**: Completion times < 10s

### Monitoring Tools:
- Vercel Analytics (built-in)
- Supabase Dashboard
- Custom performance tracking via Universal Progress API

---

## Success Criteria

### ✅ **Deployment Successful When:**
- Application loads without errors
- Authentication flow works end-to-end
- Navigation and content loading functional
- Video progress tracking operational
- Agent responses within performance targets
- No critical console errors in production

---

## Next Steps After Deployment

1. **Monitor performance metrics** for 24-48 hours
2. **User acceptance testing** with real users
3. **Load testing** if expecting high traffic
4. **Phase 3 implementation** (Agent discovery features)
5. **Additional performance optimizations** based on production data

---

**Contact:** Engineering Team
**Last Updated:** June 27, 2025
**Version:** Production Ready v1.0