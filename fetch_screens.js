const fs = require('fs');
const path = require('path');
const https = require('https');

const screens = [
  {
    title: "Shopping Cart - Review Order",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzM4NGRlMDNjNWE5YzQzNGI5NjFjNDIwYjI4OTkyMjFmEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Admin Dashboard - System Overview",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzYyN2ZiOTc0MzBlZDQwOTA4NzVkZDVhYTkzYmRjOTZlEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Seller Dashboard - Mobile Sidebar",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2E4MjRlMjk0MzdlNTQ0MWY5NTcyNGFiY2RkMzFmZTA0EgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Untitled Prototype Mobile 1",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzBhNTZkODE5NmIyMzRjZDBhMDBhOTA5YjIxYzkzZmQ3EgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "AcademiaHub - Home Mobile",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU4ZTBmOGRlYmVjODRhZTdhMmUzOWI5MmRhMWEzNjIwEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Buyer Dashboard - My Study Hub",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2FhMjAxNGVkMzNjYTRhNzg5NzM3YjQzMjI1MmU4YzFmEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Account Settings",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwOGNlNThhMzM3NDQ5ZDM4MTY0Y2EwZTkxMGJmMzNmEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Secure Checkout",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzk4Yjg5NjAyYTBiNDQwZjQ5NjhhMmEzZWVjZmQ2YmU1EgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Seller Dashboard - Earnings & Insights",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2NkNDdhYmQ4YzdjZTRkZGJhMDVkNmE4MDUxN2UzMzE5EgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Join AcademiaHub",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VhNGM4ZGZjMTcxNTRlNjRiODMzMWQ1MTllMTM5ODkxEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Buyer Dashboard - Mobile Sidebar",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzFjMGFiYWM1ZjJjNTRiZDdhOTVhNzNlNTZjYWFmMmEyEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Note Details - CS101 Fundamentals",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2I5Y2Y5YTRmZGMzNjQzOGI4ZGZkYWNjOGE1NTY3MjBmEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "AcademiaHub - Home",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MjQzNzMwNzJmNzAwMzgzOGM4MjBjMDE3MjQ0EgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Upload Study Materials",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzIwZTY5ODQ2MmNhNzQ0Yjg4MjJhNDBhYjEzNzkzMDZkEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Untitled Prototype Mobile 2",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2ExZTUwMzRkYjAyMzRmOGU4OTdkYWJlMmYzYmE4ZjZlEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  },
  {
    title: "Browse Study Notes",
    url: "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzAwMDY1MjQzYjdjOGMyYjQwMzgzOTBhNDcyMjVmMGMxEgsSBxCY9KyuiBwYAZIBJAoKcHJvamVjdF9pZBIWQhQxNTMyNTU1MDk2NTk0NzU1NjE4MA&filename=&opi=89354086"
  }
];

const targetDir = path.join(__dirname, 'raw_screens');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}

function sanitizeFilename(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_+|_+$)/g, '') + '.html';
}

function downloadUrl(url, filepath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        // follow redirect
        downloadUrl(res.headers.location, filepath).then(resolve).catch(reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to get: ${res.statusCode}`));
        return;
      }
      const fileStream = fs.createWriteStream(filepath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function run() {
  console.log(`Starting downloads for ${screens.length} screens...`);
  for (const screen of screens) {
    const filename = sanitizeFilename(screen.title);
    const filepath = path.join(targetDir, filename);
    console.log(`Downloading ${screen.title} -> ${filename}...`);
    try {
      await downloadUrl(screen.url, filepath);
      console.log(`Successfully saved ${filename}`);
    } catch (err) {
      console.error(`Failed to download ${screen.title}:`, err.message);
    }
  }
  console.log("All downloads finished.");
}

run();
