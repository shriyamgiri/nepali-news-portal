#!/usr/bin/env python3
"""
GN Nepal - AI Reel Generator (GitHub Actions version)
Uses Pexels/Pixabay video + Nepali voiceover + text overlay
Editorial v2: broadcast pace, fade transitions, balanced text
"""

import os
import sys
import json
import time
import shutil
import requests
import subprocess
from pathlib import Path
from datetime import datetime

# ── Config ───────────────────────────────────────────────────
VIDEO_WIDTH  = 1080
VIDEO_HEIGHT = 1920
FPS          = 30

COLOR_RED    = "0xDC143C"
COLOR_WHITE  = "white"
COLOR_YELLOW = "0xFFD700"

WORK_DIR   = Path('reel_work')
OUTPUT_DIR = Path('reel_output')

SUPABASE_URL         = os.environ.get('SUPABASE_URL', '')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY', '')
GEMINI_API_KEY       = os.environ.get('GEMINI_API_KEY', '')
PEXELS_API_KEY       = os.environ.get('PEXELS_API_KEY', '')
PIXABAY_API_KEY      = os.environ.get('PIXABAY_API_KEY', '')
ARTICLE_ID           = os.environ.get('ARTICLE_ID', '')
REEL_ID              = os.environ.get('REEL_ID', '')

from gtts import gTTS


# ════════════════════════════════════════════════════════════
# SUPABASE HELPERS
# ════════════════════════════════════════════════════════════

def supabase_headers():
    return {
        'apikey':        SUPABASE_SERVICE_KEY,
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type':  'application/json',
    }


def get_article(article_id: str) -> dict:
    url = f"{SUPABASE_URL}/rest/v1/articles?id=eq.{article_id}&select=*,sources(name),categories(slug)"
    r    = requests.get(url, headers=supabase_headers(), timeout=10)
    data = r.json()
    if not data:
        raise Exception(f"Article {article_id} not found")
    return data[0]


def update_reel_status(reel_id: str, status: str, **kwargs):
    if not reel_id:
        return
    url  = f"{SUPABASE_URL}/rest/v1/reels?id=eq.{reel_id}"
    body = {'status': status, **kwargs}
    requests.patch(url, headers=supabase_headers(), json=body, timeout=10)


def upload_to_storage(file_path: Path, storage_path: str) -> str:
    """Upload file to Supabase Storage bucket 'reels'"""
    url = f"{SUPABASE_URL}/storage/v1/object/reels/{storage_path}"
    headers = {
        'Authorization': f'Bearer {SUPABASE_SERVICE_KEY}',
        'Content-Type':  'video/mp4',
    }
    with open(file_path, 'rb') as f:
        r = requests.post(url, headers=headers, data=f.read(), timeout=120)

    if r.status_code not in (200, 201):
        raise Exception(f"Upload failed: {r.status_code} {r.text}")

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/reels/{storage_path}"
    return public_url


# ════════════════════════════════════════════════════════════
# SCRIPT GENERATION (Gemini)
# ════════════════════════════════════════════════════════════

def generate_script(article: dict) -> dict:
    title   = article.get('nepali_title', '')
    summary = article.get('nepali_summary', '')
    source  = article.get('sources', {})
    if isinstance(source, dict):
        source = source.get('name', 'GN Nepal')
    category = article.get('categories', {})
    if isinstance(category, dict):
        category = category.get('slug', 'world')
    else:
        category = 'world'

    prompt = f"""तपाईं GN Nepal को AI समाचार प्रस्तोता हुनुहुन्छ।
यो समाचारको लागि छोटो, छिटो-गतिको ब्रेकिङ न्युज रिल स्क्रिप्ट बनाउनुहोस् (कुल ३०-३५ सेकेन्ड बोलिने)।

शीर्षक: {title}
सारांश: {summary}

नियमहरू:
1. छोटो र सीधा वाक्यहरू (वास्तविक न्युज एंकरले बोले जस्तो छिटो)
2. रोमाञ्चक ब्रेकिङ न्युज शैली, हरेक शब्द अर्थपूर्ण होस्
3. ३ छोटो प्रभावशाली बुँदाहरू (प्रत्येक ८ शब्दभन्दा कम)
4. भ्वाइसओभर कुल ३०-३५ सेकेन्डमा पूरा हुने लामो नहोस् (लगभग ७०-८० शब्द)
5. भिडियो सर्च का लागि अंग्रेजीमा २-३ शब्दको कीवर्ड पनि दिनुहोस्

JSON मात्र फर्काउनुहोस् (no markdown):
{{"headline":"छोटो शीर्षक (१० शब्दभन्दा कम)","bullet1":"पहिलो बुँदा","bullet2":"दोस्रो बुँदा","bullet3":"तेस्रो बुँदा","voiceover":"छोटो ३०-३५ सेकेन्ड भ्वाइसओभर नेपालीमा","video_keyword":"english search keyword for stock video eg flood disaster","hashtags":"#GNNepal #नेपालसमाचार"}}"""

    url     = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    payload = {"contents": [{"parts": [{"text": prompt}]}]}

    try:
        r    = requests.post(url, json=payload, timeout=30)
        data = r.json()
        text = data['candidates'][0]['content']['parts'][0]['text']
        text = text.replace('```json', '').replace('```', '').strip()
        script = json.loads(text)
        script['source']   = source
        script['category'] = category
        print(f"✅ Script: {script['headline'][:50]}")
        return script
    except Exception as e:
        print(f"⚠️ Script generation failed: {e}")
        return {
            "headline":      title[:60],
            "bullet1":       summary[:50] if summary else "",
            "bullet2":       f"स्रोत: {source}",
            "bullet3":       "gnnepal.com मा थप पढ्नुहोस्",
            "voiceover":     f"{title}. थप जानकारीका लागि gnnepal.com हेर्नुहोस्!",
            "video_keyword": category,
            "hashtags":      "#GNNepal #नेपालसमाचार",
            "source":        source,
            "category":      category,
        }


# ════════════════════════════════════════════════════════════
# STOCK VIDEO (Pexels/Pixabay)
# ════════════════════════════════════════════════════════════

def search_pexels_video(query: str) -> str:
    if not PEXELS_API_KEY:
        return None
    try:
        r = requests.get(
            f"https://api.pexels.com/videos/search?query={query}&per_page=5&orientation=portrait",
            headers={"Authorization": PEXELS_API_KEY},
            timeout=10
        )
        data   = r.json()
        videos = data.get('videos', [])
        if not videos:
            return None
        video = videos[0]
        files = video.get('video_files', [])
        portrait_files = [f for f in files if f.get('height', 0) > f.get('width', 0)]
        best = portrait_files[0] if portrait_files else files[0]
        return best['link']
    except Exception as e:
        print(f"⚠️ Pexels video search failed: {e}")
        return None


def search_pixabay_video(query: str) -> str:
    if not PIXABAY_API_KEY:
        return None
    try:
        r = requests.get(
            f"https://pixabay.com/api/videos/?key={PIXABAY_API_KEY}&q={query}&per_page=5",
            timeout=10
        )
        data = r.json()
        hits = data.get('hits', [])
        if not hits:
            return None
        video = hits[0]
        return video['videos']['medium']['url']
    except Exception as e:
        print(f"⚠️ Pixabay video search failed: {e}")
        return None


def download_file(url: str, path: Path) -> bool:
    try:
        r = requests.get(url, timeout=30, stream=True)
        if r.status_code == 200:
            with open(path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
            return True
    except Exception as e:
        print(f"⚠️ Download failed: {e}")
    return False


def get_background_video(keyword: str) -> Path:
    """Get stock video from Pexels or Pixabay"""
    print(f"🎥 Searching video for: {keyword}")

    video_url = search_pexels_video(keyword)
    provider  = 'pexels'

    if not video_url:
        video_url = search_pixabay_video(keyword)
        provider  = 'pixabay'

    if not video_url:
        video_url = search_pexels_video('nepal news')
        provider  = 'pexels-fallback'

    if not video_url:
        raise Exception("No stock video found from any provider")

    path = WORK_DIR / 'background_raw.mp4'
    if not download_file(video_url, path):
        raise Exception("Failed to download stock video")

    print(f"✅ Video downloaded ({provider})")
    return path


# ════════════════════════════════════════════════════════════
# VOICEOVER (broadcast-paced)
# ════════════════════════════════════════════════════════════

def generate_voiceover(text: str) -> Path:
    """Generate Nepali voiceover, then speed up to broadcast news pace"""
    raw_path = WORK_DIR / 'voiceover_raw.mp3'
    path     = WORK_DIR / 'voiceover.mp3'

    tts = gTTS(text=text, lang='ne', slow=False)
    tts.save(str(raw_path))

    # Speed up 1.18x for punchy broadcast pace (pitch preserved via atempo)
    result = subprocess.run([
        'ffmpeg', '-y',
        '-i', str(raw_path),
        '-filter:a', 'atempo=1.18',
        str(path)
    ], capture_output=True, text=True)

    if result.returncode != 0 or not path.exists():
        print(f"⚠️ Speed-up failed, using raw voiceover: {result.stderr[-300:]}")
        return raw_path

    print(f"✅ Voiceover generated (broadcast pace 1.18x)")
    return path


def get_audio_duration(path: Path) -> float:
    """Get duration using ffprobe"""
    result = subprocess.run(
        ['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
         '-of', 'default=noprint_wrappers=1:nokey=1', str(path)],
        capture_output=True, text=True
    )
    return float(result.stdout.strip())


# ════════════════════════════════════════════════════════════
# TEXT HELPERS
# ════════════════════════════════════════════════════════════

def escape_ffmpeg_text(text: str) -> str:
    """Escape text for FFmpeg drawtext filter"""
    text = text.replace('\\', '\\\\')
    text = text.replace(':', '\\:')
    text = text.replace("'", "\\'")
    text = text.replace('%', '\\%')
    return text


def wrap_for_ffmpeg(text: str, max_chars: int = 26) -> str:
    """Wrap long text into multiple lines joined by literal newline for drawtext"""
    words   = text.split(' ')
    lines   = []
    current = ''
    for word in words:
        test = (current + ' ' + word).strip()
        if len(test) <= max_chars:
            current = test
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    joined = '\n'.join(lines[:2])  # max 2 lines for balance
    return escape_ffmpeg_text(joined)


# ════════════════════════════════════════════════════════════
# FFMPEG VIDEO ASSEMBLY
# ════════════════════════════════════════════════════════════

def build_video(script: dict, bg_video_path: Path, voiceover_path: Path) -> Path:
    """Combine background video + text overlays + voiceover using FFmpeg"""
    print("🎬 Building final video with FFmpeg...")

    output_path = OUTPUT_DIR / f"reel_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"

    audio_duration = get_audio_duration(voiceover_path)
    # Tightened minimum - broadcast pace means shorter overall runtime
    total_duration = max(audio_duration + 1.5, 22)

    # Timing windows (broadcast pace - snappier cuts)
    intro_end    = min(2.0, total_duration * 0.1)
    headline_end = min(intro_end + 6.0, total_duration * 0.45)
    bullets_end  = total_duration

    font_path = 'scripts/assets/NotoSansDevanagari-Bold.ttf'

    headline = wrap_for_ffmpeg(script.get('headline', ''), 22)
    bullet1  = wrap_for_ffmpeg(script.get('bullet1', ''), 26)
    bullet2  = wrap_for_ffmpeg(script.get('bullet2', ''), 26)
    bullet3  = wrap_for_ffmpeg(script.get('bullet3', ''), 26)

    fade_out_start = max(total_duration - 0.5, 0)

    # Filter chain:
    # 1. Scale/crop bg video to 1080x1920, loop, add fade in/out for real animation
    # 2. Header bar (always visible)
    # 3. Headline block (0 -> headline_end) with fade-friendly enable window
    # 4. Bullets block (headline_end -> end), each bullet vertically balanced
    # 5. Bottom branding bar

    filter_complex = f"""
[0:v]scale={VIDEO_WIDTH}:{VIDEO_HEIGHT}:force_original_aspect_ratio=increase,
crop={VIDEO_WIDTH}:{VIDEO_HEIGHT},
setsar=1,
loop=loop=-1:size=9999:start=0,
trim=duration={total_duration},
fps={FPS},
fade=t=in:st=0:d=0.4,
fade=t=out:st={fade_out_start}:d=0.5[bg];

[bg]drawbox=x=0:y=0:w={VIDEO_WIDTH}:h=130:color={COLOR_RED}@0.92:t=fill[hdr];

[hdr]drawtext=fontfile={font_path}:text='GN Nepal':fontcolor=white:fontsize=52:x=40:y=36[title];

[title]drawbox=x=0:y=(h-420):w={VIDEO_WIDTH}:h=420:color=black@0.62:t=fill:enable='lt(t\\,{headline_end})'[boxed];

[boxed]drawtext=fontfile={font_path}:text='{headline}':fontcolor=white:fontsize=50:x=(w-text_w)/2:y=(h-380)+((380-text_h)/2):line_spacing=18:enable='lt(t\\,{headline_end})'[headline_txt];

[headline_txt]drawbox=x=0:y=(h-400):w={VIDEO_WIDTH}:h=400:color=black@0.68:t=fill:enable='gte(t\\,{headline_end})'[boxed2];

[boxed2]drawtext=fontfile={font_path}:text='{bullet1}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-360):line_spacing=10:enable='gte(t\\,{headline_end})'[b1];

[b1]drawtext=fontfile={font_path}:text='{bullet2}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-260):line_spacing=10:enable='gte(t\\,{headline_end})'[b2];

[b2]drawtext=fontfile={font_path}:text='{bullet3}':fontcolor={COLOR_YELLOW}:fontsize=40:x=(w-text_w)/2:y=(h-160):line_spacing=10:enable='gte(t\\,{headline_end})'[b3];

[b3]drawbox=x=0:y=(h-70):w={VIDEO_WIDTH}:h=70:color={COLOR_RED}@0.95:t=fill[footer];

[footer]drawtext=fontfile={font_path}:text='gnnepal.com':fontcolor=white:fontsize=36:x=(w-text_w)/2:y=(h-53)[vout]
""".replace('\n', '').replace('  ', '')

    cmd = [
        'ffmpeg', '-y',
        '-i', str(bg_video_path),
        '-i', str(voiceover_path),
        '-filter_complex', filter_complex,
        '-map', '[vout]',
        '-map', '1:a',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '28',
        '-maxrate', '2M',
        '-bufsize', '4M',
        '-vf', 'scale=720:1280',
        '-c:a', 'aac',
        '-b:a', '96k',
        '-shortest',
        '-t', str(total_duration),
        str(output_path)
    ]

    print(f"Running FFmpeg... (total duration ~{total_duration:.1f}s)")
    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print("FFmpeg STDERR:", result.stderr[-3000:])
        raise Exception("FFmpeg processing failed")

    print(f"✅ Video created: {output_path}")
    return output_path


# ════════════════════════════════════════════════════════════
# MAIN
# ════════════════════════════════════════════════════════════

def main():
    print("="*60)
    print("🎬 GN Nepal - AI Reel Generator (Editorial v2)")
    print("="*60)

    if not ARTICLE_ID:
        print("❌ ARTICLE_ID environment variable required")
        sys.exit(1)

    WORK_DIR.mkdir(exist_ok=True)
    OUTPUT_DIR.mkdir(exist_ok=True)

    try:
        update_reel_status(REEL_ID, 'generating')

        # 1. Get article
        print("\n📰 Fetching article...")
        article = get_article(ARTICLE_ID)
        print(f"✅ {article.get('nepali_title', '')[:60]}")

        # 2. Generate script
        print("\n✍️  Generating script...")
        script = generate_script(article)

        # 3. Get background video
        print("\n🎥 Getting background video...")
        bg_video = get_background_video(script.get('video_keyword', script.get('category', 'news')))

        # 4. Generate voiceover (broadcast pace)
        print("\n🎙️  Generating voiceover...")
        voiceover = generate_voiceover(script['voiceover'])

        # 5. Build final video
        print("\n🎬 Assembling final video...")
        final_video = build_video(script, bg_video, voiceover)

        # 6. Upload to Supabase Storage
        print("\n☁️  Uploading to storage...")
        storage_path = f"{ARTICLE_ID}/{final_video.name}"
        video_url    = upload_to_storage(final_video, storage_path)
        print(f"✅ Uploaded: {video_url}")

        # 7. Update reel record
        file_size_mb = final_video.stat().st_size / 1024 / 1024
        update_reel_status(
            REEL_ID, 'completed',
            video_url=video_url,
            script=script,
            file_size_mb=round(file_size_mb, 2),
            completed_at=datetime.utcnow().isoformat(),
        )

        print("\n" + "="*60)
        print("✅ REEL GENERATED SUCCESSFULLY!")
        print(f"📁 Video: {video_url}")
        print(f"💾 Size: {file_size_mb:.1f} MB")
        print("="*60)

    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        update_reel_status(REEL_ID, 'failed', error_message=str(e))
        sys.exit(1)

    finally:
        shutil.rmtree(str(WORK_DIR), ignore_errors=True)


if __name__ == '__main__':
    main()