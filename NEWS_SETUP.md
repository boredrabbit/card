# Real-Time News Aggregator Setup

Your portfolio tracker now has a **live news feed** that scrapes Twitter accounts and RSS feeds for breaking financial news!

## 🚀 Features

- **Auto-updates every 30 seconds** with fresh news
- **Twitter scraping** via Nitter (no API key needed!)
- **Multiple sources**: Twitter, Bloomberg, CNBC, SeekingAlpha
- **Smart deduplication** to avoid showing the same story twice
- **Click to open** - click any news item to open the full story

## 📡 Current News Sources

### Twitter Accounts (via Nitter RSS)
- `@DeItaone` - Lightning-fast breaking news (FASTEST)
- `@FirstSquawk` - Market-moving headlines
- `@Fxhedgers` - Forex and macro news
- `@unusual_whales` - Options flow and unusual activity
- `@zerohedge` - Markets and macro commentary
- `@WSJ` - Wall Street Journal
- `@Bloomberg` - Bloomberg News
- `@business` - Bloomberg Business

### Traditional RSS Feeds
- Bloomberg Markets RSS
- CNBC Business RSS
- SeekingAlpha Market Currents

## ⚙️ Adding Custom Twitter Accounts

Open your browser console (F12) on the portfolio page and type:

```javascript
// Add a single account
addNewsSource('elonmusk', 'breaking');
addNewsSource('APompliano', 'crypto');
addNewsSource('SquawkCNBC', 'markets');

// Remove an account
removeNewsSource('WSJ');
```

### Category Options
- `'breaking'` - Red badge for urgent news
- `'markets'` - Blue badge for market news
- `'crypto'` - Yellow badge for crypto news
- `'policy'` - Green badge for policy/regulatory news

## 🔧 Advanced Configuration

### Change Update Frequency

Edit `news-aggregator.js` line 7:
```javascript
this.updateInterval = 30000; // 30 seconds (change to 60000 for 1 minute, etc.)
```

### Add More Twitter Accounts by Default

Edit `news-aggregator.js` lines 10-19, add more accounts:
```javascript
this.twitterAccounts = [
    { handle: 'DeItaone', category: 'breaking' },
    { handle: 'FirstSquawk', category: 'markets' },
    // Add your accounts here:
    { handle: 'YourAccount', category: 'markets' },
];
```

### Change Max News Items

Edit `news-aggregator.js` line 5:
```javascript
this.maxItems = 50; // Increase to keep more items in memory
```

Edit `portfolio.html` line 1070:
```javascript
newsItems.slice(0, 12).forEach(item => {
    // Change 12 to show more news cards on screen
```

## 🛠️ Troubleshooting

### "No news showing up"
1. Check browser console (F12) for errors
2. Nitter instances might be down - the system rotates through 4 mirrors automatically
3. Wait ~30 seconds for first update
4. Check if you have an ad blocker blocking the requests

### "CORS errors"
Some RSS feeds use a CORS proxy (`allorigins.win`). If it's down, you can:
1. Use a different CORS proxy (edit `fetchRSSFeed` function)
2. Set up your own proxy server
3. Stick to Twitter/Nitter sources only (they don't need CORS proxy)

### "News updates too slow/fast"
Change `updateInterval` in `news-aggregator.js` (line 7)

## 🎯 Best Twitter Accounts for Speed

**Subsecond to seconds latency:**
- `@DeItaone` ⚡ FASTEST - posts instantly
- `@FirstSquawk` ⚡ Very fast
- `@Fxhedgers` ⚡ Very fast
- `@unusual_whales` - Fast for options/unusual activity

**Good for comprehensive coverage:**
- `@zerohedge` - Analysis + breaking news
- `@WSJ`, `@Bloomberg` - Institutional quality

## 📊 Example: Monitor Specific Companies

```javascript
// Add company-specific accounts
addNewsSource('Tesla', 'markets');
addNewsSource('Apple', 'markets');
addNewsSource('nvidia', 'markets');
```

## 🔮 Future Enhancements

Potential additions you can make:
1. **WebSocket connections** for even faster updates
2. **Keyword filtering** to only show news about specific tickers
3. **Audio alerts** when breaking news hits
4. **Sentiment analysis** to color-code bullish/bearish news
5. **UI controls** to add/remove accounts without console

---

**Ready to use!** Just open [portfolio.html](./portfolio.html) and watch the news flow in real-time.
