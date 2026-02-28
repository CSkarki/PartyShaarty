#!/usr/bin/env node
/**
 * fetch-assets.js
 * Downloads Indian celebration photos + videos from Pexels (and optionally Unsplash)
 * into public/assets/celebrations/ and writes a manifest.json for coding agents.
 *
 * Setup:
 *   1. Get a free Pexels API key:  https://www.pexels.com/api/
 *   2. (Optional) Get Unsplash key: https://unsplash.com/developers
 *   3. Add to your .env:
 *        PEXELS_API_KEY=your_key_here
 *        UNSPLASH_ACCESS_KEY=your_key_here   (optional)
 *   4. Run: npm run fetch-assets
 *
 * Re-running is safe — already-downloaded files are skipped.
 */

'use strict'

const { createWriteStream, mkdirSync, existsSync, writeFileSync, readFileSync } = require('fs')
const { join } = require('path')
const https = require('https')
const http = require('http')

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT = join(__dirname, '..')
const OUT_DIR = join(ROOT, 'public', 'assets', 'celebrations')
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json')

const PHOTOS_PER_QUERY = 5
const VIDEOS_PER_QUERY = 3

// ─── Load .env manually (no dotenv dependency needed) ─────────────────────────

function loadEnv() {
  // Next.js projects use .env.local; fall back to .env
  const envPath = existsSync(join(ROOT, '.env.local'))
    ? join(ROOT, '.env.local')
    : join(ROOT, '.env')
  if (!existsSync(envPath)) return
  const lines = readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

loadEnv()

const PEXELS_KEY = process.env.PEXELS_API_KEY
const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY

if (!PEXELS_KEY || PEXELS_KEY === 'your_pexels_api_key_here') {
  console.error('❌  PEXELS_API_KEY not set in .env')
  console.error('    Get a free key at: https://www.pexels.com/api/')
  console.error('    Then add to .env:  PEXELS_API_KEY=your_key_here')
  process.exit(1)
}

// ─── Search queries per category ──────────────────────────────────────────────

const PHOTO_QUERIES = {
  // ── Weddings & functions ──────────────────────────────────────────────────
  wedding:          ['Indian wedding ceremony', 'South Asian wedding'],
  mehndi:           ['mehndi henna ceremony', 'mehndi hands bride'],
  sangeet:          ['sangeet night dance', 'Indian wedding dance'],
  haldi:            ['haldi ceremony turmeric', 'Indian haldi celebration'],

  // ── Milestone anniversaries ───────────────────────────────────────────────
  anniversary_10:   ['couple anniversary dinner celebration', 'married couple 10 years celebration'],
  anniversary_25:   ['silver wedding anniversary celebration', 'couple 25th anniversary party'],
  anniversary_50:   ['golden wedding anniversary celebration', 'couple 50 years married party'],

  // ── Milestone birthdays ───────────────────────────────────────────────────
  birthday_1st:     ['first birthday baby celebration', 'baby 1st birthday party Indian'],
  birthday_40th:     ['40th birthday party celebration', 'adult 40th birthday party Indian'],
  birthday_50th:    ['50th birthday party celebration', 'adult milestone birthday party'],

  // ── Indian & South Asian festivals ───────────────────────────────────────
  diwali:           ['Diwali celebration lights', 'Diwali festival India'],
  holi:             ['Holi festival colors celebration', 'Holi powder celebration India'],
  navratri:         ['Navratri garba dance celebration', 'garba dandiya night'],
  eid:              ['Eid celebration family', 'Eid ul Fitr party South Asian'],
  uttarayani:       ['Uttarakhand Makar Sankranti kite festival', 'Uttarayan kite flying festival India'],
  uttarakhand_fair: ['Uttarakhand Kautik mela fair', 'Indian mountain folk festival fair'],

  // ── General celebrations & social events ─────────────────────────────────
  puja:             ['Indian puja ceremony', 'Hindu prayer ceremony'],
  family:           ['Indian family celebration', 'South Asian family party'],
  marathon:         ['Indian American runners marathon race', 'South Asian community runners 10 miler'],
  community:        ['Indian American community event', 'South Asian diaspora social gathering'],
  outdoor_run:      ['marathon finish line celebration', 'community road race runners'],
}

const VIDEO_QUERIES = {
  wedding:          ['Indian wedding'],
  diwali:           ['Diwali festival lights'],
  dance:            ['Indian dance celebration'],
  family:           ['Indian family gathering'],
  holi:             ['Holi festival colors'],
  navratri:         ['garba dance celebration'],
  anniversary:      ['couple anniversary celebration'],
  marathon:         ['marathon running community'],
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchJson(url, headers) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { headers }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return fetchJson(res.headers.location, headers).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      let data = ''
      res.on('data', (chunk) => (data += chunk))
      res.on('end', () => {
        try { resolve(JSON.parse(data)) }
        catch { reject(new Error(`JSON parse error: ${data.slice(0, 80)}`)) }
      })
    })
    req.on('error', reject)
  })
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    if (existsSync(dest)) { resolve('skipped'); return }
    const mod = url.startsWith('https') ? https : http
    const file = createWriteStream(dest)
    const req = mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject)
      }
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve('downloaded')))
    })
    req.on('error', (err) => { file.close(); reject(err) })
  })
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

// ─── Pexels: fetch photos ──────────────────────────────────────────────────────

async function fetchPexelsPhotos(query, category, onPhoto) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${PHOTOS_PER_QUERY}&orientation=landscape`
  let data
  try { data = await fetchJson(url, { Authorization: PEXELS_KEY }) }
  catch (e) { console.warn(`  ⚠️  Pexels photo error "${query}": ${e.message}`); return }
  if (!data.photos?.length) return

  const dir = join(OUT_DIR, 'photos', category)
  mkdirSync(dir, { recursive: true })

  for (const photo of data.photos) {
    const id = `pexels-${photo.id}`
    const filename = `${id}.jpg`
    const status = await downloadFile(photo.src.large2x || photo.src.large, join(dir, filename))
    if (status === 'downloaded') {
      onPhoto({
        id,
        file: `/assets/celebrations/photos/${category}/${filename}`,
        category,
        source: 'pexels',
        photographer: photo.photographer,
        photographerUrl: photo.photographer_url,
        originalUrl: photo.url,
        width: photo.width,
        height: photo.height,
        alt: photo.alt || `${category} celebration`,
      })
      process.stdout.write('↓')
    } else {
      process.stdout.write('·')
    }
  }
}

// ─── Pexels: fetch videos ─────────────────────────────────────────────────────

async function fetchPexelsVideos(query, category, onVideo) {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${VIDEOS_PER_QUERY}`
  let data
  try { data = await fetchJson(url, { Authorization: PEXELS_KEY }) }
  catch (e) { console.warn(`  ⚠️  Pexels video error "${query}": ${e.message}`); return }
  if (!data.videos?.length) return

  const dir = join(OUT_DIR, 'videos', category)
  mkdirSync(dir, { recursive: true })

  for (const video of data.videos) {
    const files = video.video_files || []
    const sdFile = files.find((f) => f.quality === 'sd') ||
      files.sort((a, b) => (a.width || 0) - (b.width || 0))[0]
    if (!sdFile?.link) continue

    const id = `pexels-v-${video.id}`
    const ext = (sdFile.file_type || 'video/mp4').split('/')[1] || 'mp4'
    const filename = `${id}.${ext}`
    const status = await downloadFile(sdFile.link, join(dir, filename))
    if (status === 'downloaded') {
      onVideo({
        id,
        file: `/assets/celebrations/videos/${category}/${filename}`,
        category,
        source: 'pexels',
        duration: video.duration,
        width: sdFile.width,
        height: sdFile.height,
        originalUrl: video.url,
      })
      process.stdout.write('↓')
    } else {
      process.stdout.write('·')
    }
  }
}

// ─── Unsplash: fetch photos ───────────────────────────────────────────────────

async function fetchUnsplashPhotos(query, category, onPhoto) {
  if (!UNSPLASH_KEY || UNSPLASH_KEY === 'your_unsplash_access_key_here') return
  const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${PHOTOS_PER_QUERY}&orientation=landscape`
  let data
  try { data = await fetchJson(url, { Authorization: `Client-ID ${UNSPLASH_KEY}` }) }
  catch (e) { console.warn(`  ⚠️  Unsplash error "${query}": ${e.message}`); return }
  if (!data.results?.length) return

  const dir = join(OUT_DIR, 'photos', category)
  mkdirSync(dir, { recursive: true })

  for (const photo of data.results) {
    const dlUrl = photo.urls?.regular || photo.urls?.full
    if (!dlUrl) continue
    const id = `unsplash-${photo.id}`
    const filename = `${id}.jpg`
    const status = await downloadFile(dlUrl, join(dir, filename))
    if (status === 'downloaded') {
      onPhoto({
        id,
        file: `/assets/celebrations/photos/${category}/${filename}`,
        category,
        source: 'unsplash',
        photographer: photo.user?.name,
        photographerUrl: `https://unsplash.com/@${photo.user?.username}`,
        originalUrl: photo.links?.html,
        width: photo.width,
        height: photo.height,
        alt: photo.alt_description || photo.description || `${category} celebration`,
        attribution: `Photo by ${photo.user?.name} on Unsplash`,
      })
      process.stdout.write('↓')
    } else {
      process.stdout.write('·')
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎉  Utsavé Asset Fetcher')
  console.log(`   Pexels${UNSPLASH_KEY && UNSPLASH_KEY !== 'your_unsplash_access_key_here' ? ' + Unsplash' : ' only (add UNSPLASH_ACCESS_KEY for more variety)'}\n`)

  mkdirSync(OUT_DIR, { recursive: true })

  // Load existing manifest to merge on re-runs
  let photos = [], videos = []
  if (existsSync(MANIFEST_PATH)) {
    try {
      const existing = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
      photos = existing.photos || []
      videos = existing.videos || []
    } catch { /* corrupt manifest — start fresh */ }
  }

  const seenPhotoIds = new Set(photos.map((p) => p.id))
  const seenVideoIds = new Set(videos.map((v) => v.id))

  function onPhoto(item) { if (!seenPhotoIds.has(item.id)) { photos.push(item); seenPhotoIds.add(item.id) } }
  function onVideo(item) { if (!seenVideoIds.has(item.id)) { videos.push(item); seenVideoIds.add(item.id) } }

  // ── Photos ────────────────────────────────────────────────────────────────
  console.log('📸  Fetching photos...')
  for (const [category, queries] of Object.entries(PHOTO_QUERIES)) {
    process.stdout.write(`  ${category.padEnd(10)} `)
    for (const query of queries) {
      await fetchPexelsPhotos(query, category, onPhoto)
      await fetchUnsplashPhotos(query, category, onPhoto)
      await sleep(350)
    }
    process.stdout.write('\n')
  }

  // ── Videos ────────────────────────────────────────────────────────────────
  console.log('\n🎬  Fetching videos...')
  for (const [category, queries] of Object.entries(VIDEO_QUERIES)) {
    process.stdout.write(`  ${category.padEnd(10)} `)
    for (const query of queries) {
      await fetchPexelsVideos(query, category, onVideo)
      await sleep(350)
    }
    process.stdout.write('\n')
  }

  // ── Write manifest ────────────────────────────────────────────────────────
  const manifest = {
    generated: new Date().toISOString(),
    totalPhotos: photos.length,
    totalVideos: videos.length,
    photos,
    videos,
  }
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

  console.log(`\n✅  Done.`)
  console.log(`   ${photos.length} photos · ${videos.length} videos in manifest`)
  console.log(`   Assets:   public/assets/celebrations/`)
  console.log(`   Manifest: public/assets/celebrations/manifest.json`)
  console.log(`\n💡  Coding agents: read manifest.json and reference images by category.`)
  console.log(`    e.g. category "wedding" → /assets/celebrations/photos/wedding/*.jpg`)
}

main().catch((err) => {
  console.error('\n❌ Fatal:', err.message)
  process.exit(1)
})
