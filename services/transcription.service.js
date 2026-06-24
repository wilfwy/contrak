const youtubedl = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const OpenAI = require('openai');
const ffmpeg = require('@ffmpeg-installer/ffmpeg');

const execFileAsync = promisify(execFile);

const SUPPORTED_HOSTS = [
  'youtube.com',
  'youtu.be',
  'tiktok.com',
  'instagram.com',
  'vm.tiktok.com'
];

const TEMP_DIR = path.join(require('os').tmpdir(), 'contrak-transcriptions');
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

function hasOpenAIKey() {
  return Boolean(process.env.GROK_API_KEY);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function cleanupDir(dir) {
  if (!dir || !fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (error) {
    console.warn('Cleanup warning:', error.message);
  }
}

function isSupportedVideoUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return SUPPORTED_HOSTS.some((host) => hostname === host || hostname.endsWith('.' + host));
  } catch {
    return false;
  }
}

function parseSubtitleContent(content) {
  return content
    .replace(/^WEBVTT[\s\S]*?\n\n/m, '')
    .replace(/^\d+\s*$/gm, '')
    .replace(/\d{2}:\d{2}:\d{2}[.,]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[.,]\d{3}.*\n/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]+\}/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line, index, arr) => index === 0 || line !== arr[index - 1])
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getVideoMetadata(url) {
  const info = await youtubedl(url, {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
    preferFreeFormats: true
  });

  return {
    title: info.title || 'Vidéo sans titre',
    description: info.description || '',
    duration: info.duration || 0,
    platform: info.extractor_key || 'unknown'
  };
}

async function tryExtractSubtitles(url, workDir) {
  const outputTemplate = path.join(workDir, 'subs.%(ext)s');

  try {
    await youtubedl(url, {
      writeAutoSub: true,
      writeSub: true,
      subLangs: 'fr,en',
      convertSubs: 'vtt',
      skipDownload: true,
      output: outputTemplate,
      noCheckCertificates: true,
      noWarnings: true
    });

    const files = fs.readdirSync(workDir).filter((file) => /\.(vtt|srt)$/i.test(file));
    if (!files.length) return null;

    const preferred = files.find((file) => file.includes('.fr.')) || files[0];
    if (!preferred) return null;
    const content = fs.readFileSync(path.join(workDir, preferred), 'utf8');
    const transcription = parseSubtitleContent(content);
    return transcription.length > 30 ? transcription : null;
  } catch (error) {
    console.warn('Subtitle extraction failed:', error.message);
    return null;
  }
}

async function downloadAudio(url, workDir) {
  const outputTemplate = path.join(workDir, 'audio.%(ext)s');

  await youtubedl(url, {
    format: 'bestaudio/best',
    output: outputTemplate,
    noCheckCertificates: true,
    noWarnings: true
  });

  const files = fs.readdirSync(workDir).filter((file) => file.startsWith('audio.'));
  if (!files.length) {
    throw new Error('Impossible de télécharger l\'audio de la vidéo');
  }

  const rawPath = path.join(workDir, files[0]);
  const mp3Path = path.join(workDir, 'converted.mp3');

  await execFileAsync(ffmpeg.path, [
    '-i', rawPath,
    '-ac', '1',
    '-ar', '16000',
    '-b:a', '64k',
    '-y',
    mp3Path
  ]);

  return mp3Path;
}

async function extractAudioFromVideo(videoPath, workDir) {
  const outputPath = path.join(workDir, 'extracted.mp3');

  await execFileAsync(ffmpeg.path, [
    '-i', videoPath,
    '-vn',
    '-ac', '1',
    '-ar', '16000',
    '-b:a', '64k',
    '-y',
    outputPath
  ]);

  return outputPath;
}

async function prepareAudioForWhisper(audioPath, workDir) {
  const stats = fs.statSync(audioPath);
  if (stats.size <= WHISPER_MAX_BYTES) {
    return audioPath;
  }

  const compressedPath = path.join(workDir, 'whisper-ready.mp3');
  await execFileAsync(ffmpeg.path, [
    '-i', audioPath,
    '-ac', '1',
    '-ar', '16000',
    '-b:a', '32k',
    '-y',
    compressedPath
  ]);

  if (fs.statSync(compressedPath).size > WHISPER_MAX_BYTES) {
    throw new Error('Vidéo trop longue pour la transcription automatique (essayez une vidéo plus courte)');
  }

  return compressedPath;
}

async function transcribeWithWhisper(audioPath) {
  if (!hasOpenAIKey()) {
    throw new Error('Clé API Groq requise pour transcrire l\'audio. Ajoutez GROK_API_KEY dans .env');
  }

  const groq = new OpenAI({
    apiKey: process.env.GROK_API_KEY,
    baseURL: 'https://api.groq.com/openai/v1'
  });
  const workDir = path.dirname(audioPath);
  const preparedPath = await prepareAudioForWhisper(audioPath, workDir);

  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(preparedPath),
    model: 'whisper-large-v3-turbo',
    language: 'fr'
  });

  return transcription.text;
}

async function transcribeFromUrl(url) {
  if (!isSupportedVideoUrl(url)) {
    throw new Error('URL non supportée. Utilisez un lien YouTube, TikTok ou Instagram.');
  }

  const workDir = path.join(TEMP_DIR, 'url-' + Date.now());
  ensureDir(workDir);

  try {
    const metadata = await getVideoMetadata(url);
    const subtitles = await tryExtractSubtitles(url, workDir);

    if (subtitles) {
      return {
        transcription: subtitles,
        title: metadata.title,
        description: metadata.description,
        platform: metadata.platform,
        source: 'subtitles'
      };
    }

    const audioPath = await downloadAudio(url, workDir);
    const transcription = await transcribeWithWhisper(audioPath);

    return {
      transcription,
      title: metadata.title,
      description: metadata.description,
      platform: metadata.platform,
      source: 'whisper'
    };
  } finally {
    cleanupDir(workDir);
  }
}

async function transcribeFromFile(filePath, originalName) {
  const workDir = path.join(TEMP_DIR, 'upload-' + Date.now());
  ensureDir(workDir);

  const storedPath = path.join(workDir, originalName);
  fs.copyFileSync(filePath, storedPath);

  try {
    const ext = path.extname(originalName).toLowerCase();
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.webm', '.ogg', '.mpeg', '.mpga'];
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.mpeg', '.mpg', '.m4v'];

    let audioPath = storedPath;

    if (videoExtensions.includes(ext)) {
      audioPath = await extractAudioFromVideo(storedPath, workDir);
    } else if (!audioExtensions.includes(ext)) {
      throw new Error('Format de fichier non supporté. Utilisez MP4, MOV, MP3, WAV ou WebM.');
    }

    const transcription = await transcribeWithWhisper(audioPath);

    return {
      transcription,
      title: path.basename(originalName, ext),
      description: '',
      platform: 'upload',
      source: 'whisper'
    };
  } finally {
    cleanupDir(workDir);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

module.exports = {
  transcribeFromUrl,
  transcribeFromFile,
  isSupportedVideoUrl,
  hasOpenAIKey
};
