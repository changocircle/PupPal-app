/**
 * PupPal Screenshot Mockup Generator
 *
 * Composites raw app screenshots into branded device frames using Sharp.
 * Run this after capturing screenshots from the iOS Simulator.
 *
 * Usage:
 *   node scripts/generate-mockups.js
 *
 * Prerequisites:
 *   npm install sharp
 *
 * Input:  docs/screenshots/{size}/{01-welcome.png, 02-breed-detection.png, ...}
 * Output: docs/mockups/{size}/{01-welcome.png, ...}
 *
 * TODO: Before running, add raw screenshots to docs/screenshots/:
 *   docs/screenshots/
 *   ├── 6.7/     (1290x2796 - iPhone 15 Pro Max)
 *   ├── 6.5/     (1284x2778 - iPhone 14 Plus / 11 Pro Max)
 *   └── 5.5/     (1242x2208 - iPhone 8 Plus)
 *
 * Expected filenames in each size folder:
 *   01-welcome.png
 *   02-breed-detection.png
 *   03-training-plan.png
 *   04-daily-training.png
 *   05-buddy-chat.png
 *   06-health-dashboard.png
 *   07-trick-library.png
 *   08-achievements.png
 *   09-onboarding-quiz.png
 *   10-paywall.png
 *
 * Device frame PNGs (optional, for realistic framing):
 *   - Apple Design Resources: https://developer.apple.com/design/resources/
 *   - Place at docs/device-frames/
 *     ├── iphone-15-pro-max-black.png
 *     ├── iphone-14-plus-black.png
 *     └── iphone-8-plus-black.png
 *
 * If no device frames are provided, the script outputs screenshots on a
 * branded navy background with caption text.
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// Brand config
// ---------------------------------------------------------------------------

const BRAND = {
  navy: { r: 27, g: 35, b: 51, alpha: 1 },    // #1B2333
  coral: '#FF6B5C',
  cream: '#FFFAF7',
  sage: '#7BAE7F',
};

// ---------------------------------------------------------------------------
// Size configs
// ---------------------------------------------------------------------------

const SIZES = [
  {
    name: '6.7',
    label: 'iPhone 15 Pro Max',
    screenshotWidth: 1290,
    screenshotHeight: 2796,
    // TODO: Update these offsets after measuring your device frame PNG.
    // frameOffsetX/Y = pixel position where screenshot goes inside the frame PNG.
    frameOffsetX: 0,
    frameOffsetY: 0,
    framePng: 'docs/device-frames/iphone-15-pro-max-black.png',
    outputSubdir: '6.7',
  },
  {
    name: '6.5',
    label: 'iPhone 14 Plus / 11 Pro Max',
    screenshotWidth: 1284,
    screenshotHeight: 2778,
    frameOffsetX: 0,
    frameOffsetY: 0,
    framePng: 'docs/device-frames/iphone-14-plus-black.png',
    outputSubdir: '6.5',
  },
  {
    name: '5.5',
    label: 'iPhone 8 Plus',
    screenshotWidth: 1242,
    screenshotHeight: 2208,
    frameOffsetX: 0,
    frameOffsetY: 0,
    framePng: 'docs/device-frames/iphone-8-plus-black.png',
    outputSubdir: '5.5',
  },
];

// ---------------------------------------------------------------------------
// Screenshot definitions (matches screenshot-spec.md)
// ---------------------------------------------------------------------------

const SCREENSHOTS = [
  { file: '01-welcome.png',          caption: 'Meet Buddy, your AI puppy trainer' },
  { file: '02-breed-detection.png',  caption: 'AI identifies your breed in seconds' },
  { file: '03-training-plan.png',    caption: 'Your 12-week plan, built for your pup' },
  { file: '04-daily-training.png',   caption: 'Train in 10 minutes a day' },
  { file: '05-buddy-chat.png',       caption: 'Ask Buddy anything, any time' },
  { file: '06-health-dashboard.png', caption: 'Every vet visit and vaccine in one place' },
  { file: '07-trick-library.png',    caption: 'Master 50+ tricks at your own pace' },
  { file: '08-achievements.png',     caption: 'Every milestone deserves a celebration' },
  { file: '09-onboarding-quiz.png',  caption: "Tell us what you're working on" },
  { file: '10-paywall.png',          caption: 'Unlock everything, free for 7 days' },
];

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const ROOT          = path.join(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'docs', 'screenshots');
const MOCKUPS_DIR   = path.join(ROOT, 'docs', 'mockups');

// ---------------------------------------------------------------------------
// Core: generate one mockup
// ---------------------------------------------------------------------------

async function generateMockup(screenshotPath, size, caption, outputPath) {
  const { screenshotWidth, screenshotHeight, framePng, frameOffsetX, frameOffsetY } = size;
  const framePath = path.join(ROOT, framePng);
  const hasFrame = fs.existsSync(framePath);

  const PADDING      = 80;
  const CAPTION_H    = 140;

  if (hasFrame) {
    // ---------------------------------------------------------------------------
    // WITH device frame
    //
    // Steps:
    // 1. Load device frame to get canvas dimensions
    // 2. Build background canvas (navy)
    // 3. Composite: screenshot at (frameOffsetX, frameOffsetY)
    // 4. Composite: device frame on top
    // 5. Composite: caption SVG below
    // ---------------------------------------------------------------------------
    const frameMeta = await sharp(framePath).metadata();
    const canvasW = frameMeta.width;
    const canvasH = frameMeta.height + CAPTION_H;

    // Caption SVG
    const captionSvg = buildCaptionSvg(canvasW, CAPTION_H, caption);

    await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: BRAND.navy },
    })
      .composite([
        { input: screenshotPath, top: frameOffsetY, left: frameOffsetX },
        { input: framePath,      top: 0,            left: 0 },
        { input: Buffer.from(captionSvg), top: frameMeta.height, left: 0 },
      ])
      .png()
      .toFile(outputPath);

  } else {
    // ---------------------------------------------------------------------------
    // WITHOUT device frame (placeholder / simpler output)
    //
    // Branded navy background with screenshot centered and caption below.
    // ---------------------------------------------------------------------------
    const canvasW = screenshotWidth  + PADDING * 2;
    const canvasH = screenshotHeight + PADDING * 2 + CAPTION_H;
    const captionSvg = buildCaptionSvg(canvasW, CAPTION_H, caption);

    await sharp({
      create: { width: canvasW, height: canvasH, channels: 4, background: BRAND.navy },
    })
      .composite([
        { input: screenshotPath,         top: PADDING,                       left: PADDING },
        { input: Buffer.from(captionSvg), top: screenshotHeight + PADDING + 20, left: 0 },
      ])
      .png()
      .toFile(outputPath);
  }

  console.log(`  ✓ ${path.basename(outputPath)}`);
}

// ---------------------------------------------------------------------------
// SVG caption overlay
// ---------------------------------------------------------------------------

function buildCaptionSvg(width, height, text) {
  // Escape XML special chars
  const safe = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <text
      x="${width / 2}"
      y="${height / 2 + 14}"
      font-family="-apple-system, Helvetica Neue, sans-serif"
      font-size="46"
      font-weight="600"
      fill="#FFFAF7"
      text-anchor="middle"
      dominant-baseline="middle"
    >${safe}</text>
  </svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🐾 PupPal Mockup Generator\n');

  // Check Sharp is installed
  try {
    require.resolve('sharp');
  } catch {
    console.error('❌ Sharp is not installed.\n   Run: npm install sharp\n');
    process.exit(1);
  }

  let generated = 0;
  let skipped   = 0;
  let missing   = 0;

  for (const size of SIZES) {
    const inputDir  = path.join(SCREENSHOTS_DIR, size.outputSubdir);
    const outputDir = path.join(MOCKUPS_DIR, size.outputSubdir);

    console.log(`📱 ${size.label} (${size.screenshotWidth}x${size.screenshotHeight})`);

    const hasFramePng = fs.existsSync(path.join(ROOT, size.framePng));
    if (!hasFramePng) {
      console.log(`   ℹ️  No device frame found at ${size.framePng} — using branded background only`);
    }

    if (!fs.existsSync(inputDir)) {
      console.log(`   ⚠️  No screenshots at docs/screenshots/${size.outputSubdir}/ — skipping`);
      console.log(`   👉 Capture screenshots and save them as:`);
      SCREENSHOTS.forEach(s => console.log(`         docs/screenshots/${size.outputSubdir}/${s.file}`));
      console.log();
      missing += SCREENSHOTS.length;
      continue;
    }

    fs.mkdirSync(outputDir, { recursive: true });

    for (const ss of SCREENSHOTS) {
      const inputPath  = path.join(inputDir, ss.file);
      const outputPath = path.join(outputDir, ss.file);

      if (!fs.existsSync(inputPath)) {
        console.log(`   ⚠️  Missing: ${ss.file}`);
        missing++;
        continue;
      }

      try {
        await generateMockup(inputPath, size, ss.caption, outputPath);
        generated++;
      } catch (err) {
        console.error(`   ❌ Error: ${ss.file} — ${err.message}`);
        skipped++;
      }
    }

    console.log();
  }

  // Summary
  console.log('─'.repeat(50));
  console.log(`✅ Generated : ${generated}`);
  if (skipped  > 0) console.log(`⏭️  Skipped   : ${skipped}`);
  if (missing  > 0) console.log(`⚠️  Missing   : ${missing}`);
  console.log(`\n📂 Output: docs/mockups/\n`);

  if (missing > 0) {
    console.log('📋 Next steps:');
    console.log('   1. Capture screenshots from iOS Simulator (see docs/screenshot-spec.md)');
    console.log('   2. Save to docs/screenshots/{6.7,6.5,5.5}/ with the filenames listed above');
    console.log('   3. (Optional) Add device frame PNGs to docs/device-frames/');
    console.log('      Source: https://developer.apple.com/design/resources/');
    console.log('   4. Run: node scripts/generate-mockups.js\n');
  }
}

main().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
