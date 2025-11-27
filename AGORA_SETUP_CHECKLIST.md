# Agora Video Calling Setup Checklist

## ✅ Completed Steps

- [x] Installed `agora-rtc-sdk-ng` package
- [x] Installed `agora-rtc-react` package  
- [x] Installed `agora-access-token` package
- [x] Created `hooks/use-agora-rtc.ts` hook
- [x] Created `app/api/agora/token/route.ts` API route
- [x] Updated `components/meeting-live-view.tsx` with Agora integration
- [x] Updated `components/meetings-list.tsx` to generate channel names

## 🔧 Next Steps

### 1. Set Up Environment Variables

Create a `.env.local` file in your project root (if it doesn't exist) and add:

```bash
# Agora Configuration
NEXT_PUBLIC_AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_app_certificate_here
```

**How to get these:**
1. Go to [Agora Console](https://console.agora.io/)
2. Sign up/Login
3. Create a new project
4. Copy the App ID from Project Management
5. Generate and copy the App Certificate

### 2. Restart Development Server

After adding environment variables, restart your server:

```bash
# Stop the current server (Ctrl+C)
npm run dev
```

### 3. Test the Integration

1. **Navigate to Meetings Page:**
   - Go to `http://localhost:3000/meetings`
   - Click "Start Meeting" button

2. **Allow Permissions:**
   - Browser will prompt for camera/microphone access
   - Click "Allow" for both

3. **Verify Connection:**
   - You should see "Connecting..." briefly
   - Then your local video should appear
   - Timer should start counting

4. **Test Controls:**
   - Click mic button to mute/unmute
   - Click video button to turn video on/off
   - Click red phone button to leave meeting

### 4. Test with Multiple Users

To test with multiple participants:

1. Open the same meeting URL in another browser/incognito window
2. Or share the URL with another person
3. Both users should see each other's video

**Example URL:**
```
http://localhost:3000/meetings/live?channel=test-meeting-123&title=Test%20Meeting
```

### 5. Troubleshooting

**Issue: "Agora App ID not configured"**
- ✅ Check that `.env.local` exists
- ✅ Verify `NEXT_PUBLIC_AGORA_APP_ID` is set
- ✅ Restart the dev server after adding env vars

**Issue: "Failed to fetch token"**
- ✅ Check that `AGORA_APP_CERTIFICATE` is set
- ✅ Verify API route is working: `http://localhost:3000/api/agora/token?channel=test&uid=123`
- ✅ Check browser console for errors

**Issue: No video showing**
- ✅ Check browser permissions (camera/mic)
- ✅ Verify camera is not being used by another app
- ✅ Check browser console for errors
- ✅ Try refreshing the page

**Issue: Can't hear audio**
- ✅ Check browser permissions (microphone)
- ✅ Verify system audio is not muted
- ✅ Check browser console for errors

### 6. Production Deployment

For production:

1. **Set Environment Variables:**
   - Add the same env vars to your hosting platform (Vercel, AWS, etc.)
   - Make sure `NEXT_PUBLIC_AGORA_APP_ID` is set as a public variable

2. **Security:**
   - Never commit `.env.local` to git (already in `.gitignore`)
   - Use production App ID and Certificate
   - Consider implementing token refresh mechanism

3. **Testing:**
   - Test with multiple users
   - Test on different devices/browsers
   - Test network conditions

## 📚 Additional Resources

- [Agora Documentation](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Agora Console](https://console.agora.io/)
- [Agora Web SDK API Reference](https://docs.agora.io/en/video-calling/get-started/get-started-sdk?platform=web)

## 🎉 You're Ready!

Once you've completed these steps, your Agora video calling integration should be working. The meeting page will automatically:
- Generate tokens
- Join Agora channels
- Display local and remote video
- Handle audio/video controls

