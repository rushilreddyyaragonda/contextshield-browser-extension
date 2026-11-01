#!/usr/bin/env node
/**
 * ContextShield Extension Packaging Script
 * 
 * 1. Collects extension source files
 * 2. Validates the manifest
 * 3. Verifies all referenced files exist
 * 4. Produces the ZIP archive
 * 5. Confirms the archive is readable
 * 6. Confirms expected files are present
 * 7. Outputs to public/downloads/contextshield-chrome.zip
 */

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const EXTENSION_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(__dirname, '..', '..', 'public', 'downloads');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'contextshield-chrome.zip');
const INNER_DIR_NAME = 'contextshield-chrome';

// --- Simple ZIP writer (no external dependencies) ---

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function createZip(files) {
  // files: [{ path: 'relative/path', data: Buffer }]
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = Buffer.from(file.path, 'utf8');
    const data = file.data;
    const crc = crc32(data);
    const compressed = zlib.deflateRawSync(data);
    const useCompressed = compressed.length < data.length;
    const fileData = useCompressed ? compressed : data;
    const compressionMethod = useCompressed ? 8 : 0;

    // Local file header
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0); // signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(compressionMethod, 8); // compression
    localHeader.writeUInt16LE(0, 10); // mod time
    localHeader.writeUInt16LE(0, 12); // mod date
    localHeader.writeUInt32LE(crc, 14); // crc32
    localHeader.writeUInt32LE(fileData.length, 18); // compressed size
    localHeader.writeUInt32LE(data.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBytes.length, 26); // filename length
    localHeader.writeUInt16LE(0, 28); // extra field length

    const localHeaderWithExtra = Buffer.concat([localHeader, nameBytes, fileData]);
    localHeaders.push(localHeaderWithExtra);

    // Central directory header
    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0); // signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(compressionMethod, 10); // compression
    centralHeader.writeUInt16LE(0, 12); // mod time
    centralHeader.writeUInt16LE(0, 14); // mod date
    centralHeader.writeUInt32LE(crc, 16); // crc32
    centralHeader.writeUInt32LE(fileData.length, 20); // compressed size
    centralHeader.writeUInt32LE(data.length, 24); // uncompressed size
    centralHeader.writeUInt16LE(nameBytes.length, 28); // filename length
    centralHeader.writeUInt16LE(0, 30); // extra field length
    centralHeader.writeUInt16LE(0, 32); // comment length
    centralHeader.writeUInt16LE(0, 34); // disk number
    centralHeader.writeUInt16LE(0, 36); // internal attrs
    centralHeader.writeUInt32LE(0, 38); // external attrs
    centralHeader.writeUInt32LE(offset, 42); // local header offset

    centralHeaders.push(Buffer.concat([centralHeader, nameBytes]));
    offset += localHeaderWithExtra.length;
  }

  // Central directory
  const centralDir = Buffer.concat(centralHeaders);
  const centralDirOffset = offset;

  // End of central directory
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0); // signature
  endRecord.writeUInt16LE(0, 4); // disk number
  endRecord.writeUInt16LE(0, 6); // disk with central dir
  endRecord.writeUInt16LE(files.length, 8); // entries on this disk
  endRecord.writeUInt16LE(files.length, 10); // total entries
  endRecord.writeUInt32LE(centralDir.length, 12); // central dir size
  endRecord.writeUInt32LE(centralDirOffset, 16); // central dir offset
  endRecord.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, centralDir, endRecord]);
}

// --- ZIP reader for verification ---

function readZip(buf) {
  const files = [];
  let offset = 0;

  while (offset < buf.length - 4) {
    const sig = buf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;

    const compressionMethod = buf.readUInt16LE(offset + 8);
    const compressedSize = buf.readUInt32LE(offset + 18);
    const uncompressedSize = buf.readUInt32LE(offset + 22);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);

    const name = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const compressedData = buf.slice(dataStart, dataStart + compressedSize);

    let data;
    if (compressionMethod === 8) {
      data = zlib.inflateRawSync(compressedData);
    } else {
      data = compressedData;
    }

    files.push({ path: name, data: data, size: uncompressedSize });
    offset = dataStart + compressedSize;
  }

  return files;
}

// --- Validation ---

function validateManifest(manifest) {
  const errors = [];
  if (!manifest.manifest_version || manifest.manifest_version !== 3) {
    errors.push('manifest_version must be 3');
  }
  if (!manifest.name) errors.push('name is required');
  if (!manifest.version) errors.push('version is required');
  if (!manifest.description) errors.push('description is required');
  if (!manifest.action || !manifest.action.default_popup) {
    errors.push('action.default_popup is required');
  }
  if (!manifest.background || !manifest.background.service_worker) {
    errors.push('background.service_worker is required');
  }
  return errors;
}

function getReferencedFiles(manifest) {
  const files = new Set();
  if (manifest.action && manifest.action.default_popup) files.add(manifest.action.default_popup);
  if (manifest.background && manifest.background.service_worker) files.add(manifest.background.service_worker);
  if (manifest.options_page) files.add(manifest.options_page);
  if (manifest.content_scripts) {
    manifest.content_scripts.forEach(function (cs) {
      if (cs.js) cs.js.forEach(function (f) { files.add(f); });
      if (cs.css) cs.css.forEach(function (f) { files.add(f); });
    });
  }
  if (manifest.icons) {
    Object.values(manifest.icons).forEach(function (f) { files.add(f); });
  }
  if (manifest.action && manifest.action.default_icon) {
    Object.values(manifest.action.default_icon).forEach(function (f) { files.add(f); });
  }
  return Array.from(files);
}

// --- Collect files ---

function collectFiles(dir, baseDir) {
  baseDir = baseDir || dir;
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      results.push(...collectFiles(fullPath, baseDir));
    } else {
      const relPath = path.relative(baseDir, fullPath);
      results.push({ path: relPath, fullPath: fullPath });
    }
  }
  return results;
}

// --- Main ---

function main() {
  console.log('ContextShield Extension Packaging');
  console.log('==================================\n');

  // 1. Check manifest exists
  const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('ERROR: manifest.json not found at ' + manifestPath);
    process.exit(1);
  }
  console.log('[1/7] Manifest found.');

  // 2. Validate manifest
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const errors = validateManifest(manifest);
  if (errors.length > 0) {
    console.error('ERROR: Manifest validation failed:');
    errors.forEach(function (e) { console.error('  - ' + e); });
    process.exit(1);
  }
  console.log('[2/7] Manifest validated. Name: ' + manifest.name + ' v' + manifest.version);

  // 3. Verify referenced files exist
  const referenced = getReferencedFiles(manifest);
  const missing = [];
  for (const ref of referenced) {
    const refPath = path.join(EXTENSION_DIR, ref);
    if (!fs.existsSync(refPath)) {
      missing.push(ref);
    }
  }
  if (missing.length > 0) {
    console.error('ERROR: Missing referenced files:');
    missing.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('[3/7] All ' + referenced.length + ' referenced files exist.');

  // 4. Collect all files
  const allFiles = collectFiles(EXTENSION_DIR);
  // Exclude tests and packaging scripts from the archive
  const archiveFiles = allFiles.filter(function (f) {
    return !f.path.startsWith('tests/') &&
           !f.path.startsWith('scripts/') &&
           !f.path.endsWith('.zip');
  });

  // Prefix with inner directory name
  const zipFiles = archiveFiles.map(function (f) {
    return {
      path: INNER_DIR_NAME + '/' + f.path.replace(/\\/g, '/'),
      data: fs.readFileSync(f.fullPath),
    };
  });

  console.log('[4/7] Collected ' + zipFiles.length + ' files for archive.');

  // 5. Create ZIP
  const zipBuffer = createZip(zipFiles);
  console.log('[5/7] ZIP archive created (' + zipBuffer.length + ' bytes).');

  // 6. Verify ZIP is readable
  const readBack = readZip(zipBuffer);
  if (readBack.length !== zipFiles.length) {
    console.error('ERROR: ZIP verification failed. Expected ' + zipFiles.length + ' files, got ' + readBack.length);
    process.exit(1);
  }
  console.log('[6/7] ZIP verified — ' + readBack.length + ' files readable.');

  // 7. Check expected files are present
  const expectedFiles = [
    INNER_DIR_NAME + '/manifest.json',
    INNER_DIR_NAME + '/popup.html',
    INNER_DIR_NAME + '/popup.js',
    INNER_DIR_NAME + '/background.js',
    INNER_DIR_NAME + '/content.js',
    INNER_DIR_NAME + '/workspace.html',
    INNER_DIR_NAME + '/workspace.js',
    INNER_DIR_NAME + '/options.html',
    INNER_DIR_NAME + '/options.js',
    INNER_DIR_NAME + '/lib/claim-analyzer.js',
    INNER_DIR_NAME + '/lib/context-detector.js',
    INNER_DIR_NAME + '/lib/source-inspector.js',
    INNER_DIR_NAME + '/lib/comparison-engine.js',
    INNER_DIR_NAME + '/lib/storage-manager.js',
    INNER_DIR_NAME + '/README.md',
  ];

  const zipPaths = readBack.map(function (f) { return f.path; });
  const missingExpected = expectedFiles.filter(function (f) { return zipPaths.indexOf(f) === -1; });
  if (missingExpected.length > 0) {
    console.error('ERROR: Missing expected files in archive:');
    missingExpected.forEach(function (f) { console.error('  - ' + f); });
    process.exit(1);
  }
  console.log('[7/7] All expected files present in archive.');

  // Write to output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, zipBuffer);

  console.log('\n=== Packaging Complete ===');
  console.log('Output: ' + OUTPUT_FILE);
  console.log('Size: ' + (zipBuffer.length / 1024).toFixed(1) + ' KB');
  console.log('Files: ' + zipFiles.length);
  console.log('\nArchive contents:');
  zipPaths.sort().forEach(function (p) { console.log('  ' + p); });
}

main();
