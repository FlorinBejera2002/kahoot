import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createClient } from '@supabase/supabase-js';

const sourceDir = '/Users/tristan/Desktop/profile pics';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const execFileAsync = promisify(execFile);

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const entries = await fs.readdir(sourceDir, { withFileTypes: true });
const files = entries
  .filter((e) => e.isFile())
  .map((e) => e.name)
  .filter((name) => /\.(png|jpg|jpeg|webp|gif)$/i.test(name))
  .sort((a, b) => a.localeCompare(b));

if (files.length === 0) {
  console.error(`No image files found in: ${sourceDir}`);
  process.exit(1);
}

let uploaded = 0;
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kahoot-avatars-'));

try {
  for (let i = 0; i < files.length; i += 1) {
    const fileName = files[i];
    const localPath = path.join(sourceDir, fileName);
    const jpgPath = path.join(tempDir, `default-${i + 1}.jpg`);
    const storagePath = `defaults/default-${i + 1}.jpg`;

    await execFileAsync('sips', ['-s', 'format', 'jpeg', localPath, '--out', jpgPath]);

    const fileBuffer = await fs.readFile(jpgPath);
    const { error } = await supabase.storage
      .from('avatars')
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: 'image/jpeg',
      });

    if (error) {
      console.error(`Failed: ${fileName} -> ${storagePath}`);
      console.error(error.message || error);
      process.exit(1);
    }

    uploaded += 1;
    console.log(`Uploaded ${uploaded}/${files.length}: ${fileName} -> ${storagePath}`);
  }
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}

console.log(`Done. Uploaded ${uploaded} default avatars to bucket 'avatars'.`);
