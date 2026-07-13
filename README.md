# Canvas Studio 🎨

**Canvas Studio for WormHole** — A web platform to upload and manage animated looping videos (Canvas) designed to integrate with the WormHole application.

---

## 📋 Description

Canvas Studio is a **Web API** that allows you to:

- 📤 **Upload animated videos** (MP4, WebM) associated with songs
- 🔍 **Search for Canvases** by artist, album, and song
- 📋 **Manage** your Canvas collection (list, delete)
- 🔌 **Integrate** with WormHole via a REST API
- 🎬 **Play** the Canvases directly within the app

It is the perfect solution to expand WormHole's Canvas library with custom or community-created content.

---

## 🚀 Key Features

### 1. Complete REST API
- Endpoints for searching, uploading, and managing Canvases
- JSON responses with clean formatting
- Integrated caching to reduce repeated calls

### 2. Cloud Storage
- Videos hosted on **Vercel Blob Storage**
- Public access for direct playback
- JSON index for fast searches

### 3. Flexible Search
- Search by **Artist + Album** (recommended)
- Search by **Artist + Album + Song**
- Search by **Artist** or **Album** individually
- Partial matching for higher accuracy

### 4. Web Interface
- Visual administration panel
- Drag and drop file upload
- Preview of uploaded Canvases
- Copy URL and delete directly from the web

### 5. WormHole Integration
- Compatible with the Canvas provider system
- Search order: Apple Music → Canvas Studio → Tidal
- Returns direct URLs for playback in ExoPlayer

---

## 🛠 Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Vercel Serverless Functions (Node.js)
- **Storage**: Vercel Blob Storage
- **CDN**: Vercel Edge Network

---

## 🎯 Quick Start

### Search for a Canvas (API)

```bash
# By artist + album
curl "https://wormhole-canvas.vercel.app/api/search?artist=Peso%20Pluma&album=DINAST%C3%8DA"

# By artist + album + song
curl "https://wormhole-canvas.vercel.app/api/search?artist=SZA&album=SOS&song=Kill%20Bill"
```

### Upload a Canvas (API)

```bash
curl -X POST "https://wormhole-canvas.vercel.app/api/upload" \
  -F "artist=SZA" \
  -F "album=SOS" \
  -F "song=Kill Bill" \
  -F "video=@/path/to/your/video.mp4"
```

### From the Web

1. Visit [https://wormhole-canvas.vercel.app](https://wormhole-canvas.vercel.app)
2. Complete the fields: Artist, Album, and Song (optional)
3. Select your video file (max. 6MB)
4. Click on "Upload Canvas"
5. The Canvas will appear in the list and be available for WormHole

---

## 📡 API Endpoints

### List Canvases
```
GET /api/list
```
Returns all stored Canvases.

### Search Canvas
```
GET /api/search?artist=X&album=Y&song=Z
```
Searches Canvases by parameters. Artist and album are recommended, song is optional.

### Upload Canvas
```
POST /api/upload
```
Uploads a new Canvas. Body: multipart/form-data with `artist`, `album`, `song` (optional), and `video`.

### Delete Canvas
```
DELETE /api/delete
```
Deletes a Canvas by ID. Body JSON: `{ "id": "sza_sos_kill_bill" }`

---

## 📦 Data Structure

### Search Response (Found)
```json
{
  "success": true,
  "found": true,
  "data": {
    "id": "peso_pluma_dinastia",
    "artist": "Peso Pluma",
    "album": "DINASTÍA",
    "song": "",
    "url": "https://...blob.../peso_pluma_dinastia.mp4",
    "type": "mp4",
    "uploadedAt": "2026-07-12T..."
  }
}
```

### Search Response (Not Found)
```json
{
  "success": true,
  "found": false,
  "data": null
}
```

---

## 🔧 Integration with WormHole

Canvas Studio integrates as another provider in WormHole's Canvas system. The search order is:

1. **Apple Music** (official animated covers)
2. **Canvas Studio** (your custom content)
3. **Tidal** (fallback)

### How it works:
1. WormHole requests a Canvas for a song
2. Searches first on Apple Music
3. If not found, queries Canvas Studio
4. If not found, tries Tidal
5. Returns the Canvas URL (or null)

---

## 🚀 Deployment

The project is deployed on [Vercel](https://vercel.com) with:

1. **Frontend** in the project root
2. **Serverless Functions** in the `/api` folder
3. **Blob Storage** to store videos and the index

### Environment Variables
- `BLOB_READ_WRITE_TOKEN` — Token for Vercel Blob Storage
- `BLOB_STORE_ID` — Store ID (auto-generated)
- `BLOB_WEBHOOK_PUBLIC_KEY` — Webhook public key (auto-generated)

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 💬 Support

Questions or issues? Open an [issue](https://github.com/Arturo254/Canvas-Artwork/issues) or contact the development team.

---

## 🎨 Credits

Created by **Arturo254** | WormHole Canvas Studio

---

**Last updated**: 2026-07-13
