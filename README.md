# Kecak Motor WhatsApp Chatbot
### Free rule-based bot — zero monthly AI cost

---

## What this does
- Answers customer WhatsApp messages 24/7 automatically
- Handles: service booking, price inquiries, unit stock, hours & location, staff escalation
- Stores all bookings in memory (upgrade to database later)
- Includes a web dashboard to monitor bookings and stats
- **Total cost: $0–7/month** (just server hosting)

---

## File structure
```
kecak-bot/
├── src/
│   └── index.js        ← Main bot + webhook server
├── dashboard/
│   └── index.html      ← Operator dashboard (served at /)
├── package.json
└── README.md
```

---

## Setup in 4 steps

### Step 1 — Deploy to Railway (free)
1. Go to [railway.app](https://railway.app) and sign up (free)
2. Click "New Project" → "Deploy from GitHub repo" 
   - Or use "Deploy from local" and upload this folder
3. Railway gives you a live URL like: `https://kecak-bot.up.railway.app`

### Step 2 — Create Meta WhatsApp App (free)
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new App → choose "Business" type
3. Add "WhatsApp" product
4. Go to WhatsApp → Getting Started
5. Note down:
   - **Phone Number ID** (shown on the page)
   - **Temporary Access Token** (generate one — valid 24h) or set up permanent token

### Step 3 — Set environment variables in Railway
In your Railway project → Settings → Variables, add:

```
WA_TOKEN=your_meta_access_token_here
PHONE_NUMBER_ID=your_phone_number_id_here
STAFF_NUMBER=628XXXXXXXXXX          ← your WhatsApp number (international format)
VERIFY_TOKEN=kecak_motor_2024       ← keep this or change it
PORT=3000
```

### Step 4 — Configure webhook in Meta
1. In Meta dashboard → WhatsApp → Configuration → Webhook
2. Set Callback URL: `https://your-railway-url.up.railway.app/webhook`
3. Set Verify Token: `kecak_motor_2024` (must match your env variable)
4. Click Verify and Save
5. Subscribe to: `messages`

**Done.** Send a WhatsApp message to your test number — the bot will reply.

---

## Customizing the bot

### Update service prices
In `src/index.js`, find the `KB.services` object:
```js
services: {
  'ganti oli': { price: 85000, duration: '30 menit', desc: '...' },
  // Add or change services here
}
```

### Update unit stock
In `src/index.js`, find `KB.units`:
```js
units: {
  'honda beat': { stock: 3, harga: '17.500.000', warna: ['Merah', 'Hitam'] },
  // Change stock numbers here daily/weekly
}
```

### Change your address or hours
Find `KB.address`, `KB.hours`, `KB.phone` — update those strings.

---

## Dashboard
Once deployed, open `https://your-railway-url.up.railway.app` in a browser.
You'll see:
- Live booking count and stats
- Recent booking list with customer names and service types
- Service breakdown chart
- Sample chat preview

---

## Upgrading later
When you're ready to add AI (for handling questions the bot can't answer):
1. Get a free Gemini API key from [aistudio.google.com](https://aistudio.google.com)
2. Add it to the `route()` function as a fallback for unrecognized inputs
3. Cost: still $0 at dealership volume

---

## Support
The bot handles these keywords automatically:
- `menu`, `0`, `halo`, `hi`, `hello` → main menu
- `1`, `booking`, `servis` → booking flow
- `2`, `harga`, `price` → price list
- `3`, `stok`, `unit`, `motor` → unit availability
- `4`, `jam`, `lokasi`, `alamat` → hours & location
- `5`, `staff`, `human` → escalate to you
- `garansi`, `warranty` → warranty info
- `kredit`, `cicil`, `dp` → financing info
- Unit names (beat, vario, scoopy, pcx, cbr) → unit list
