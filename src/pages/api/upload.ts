import formidable from 'formidable';
import { IncomingMessage, ServerResponse } from 'http';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export default async function handler(req: IncomingMessage & { body: any }, res: ServerResponse) {
  await fs.mkdir(uploadDir, { recursive: true });
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filter: ({ mimetype }) => !!mimetype && mimetype.startsWith('image/'),
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      res.statusCode = 500;
      res.end(JSON.stringify({ error: 'Upload failed' }));
      return;
    }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'No file uploaded' }));
      return;
    }
    const fileName = file.newFilename || path.basename(file.filepath);
    const filePath = `/uploads/${fileName}`;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ filePath }));
  });
}
