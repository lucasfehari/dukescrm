import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const tmpFolder = path.resolve(__dirname, '..', '..', 'uploads');

export const uploadConfig = {
  directory: tmpFolder,
  storage: multer.diskStorage({
    destination: tmpFolder,
    filename(request, file, callback) {
      const fileHash = crypto.randomBytes(16).toString('hex');
      const filename = `${fileHash}-${file.originalname}`;

      return callback(null, filename);
    },
  }),
  limits: {
    // Limits the size to 5MB roughly
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (req: any, file: any, cb: any) => {
    // Only accept web image formats for now
    const allowedMimes = [
      'image/jpeg',
      'image/pjpeg',
      'image/png',
      'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type.'));
    }
  }
};

export const upload = multer(uploadConfig);
