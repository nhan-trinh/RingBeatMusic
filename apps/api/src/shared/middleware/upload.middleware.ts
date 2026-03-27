import multer from 'multer';
import { AppError, ErrorCodes } from '../utils/app-error';

// Sử dụng memory storage để upload_stream trực tiếp lên Cloudinary / R2 / S3
const storage = multer.memoryStorage();

// Filter cho ảnh (Avatar, Thumbnail)
const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ hỗ trợ upload file ảnh (jpg, jpeg, png, webp)', 400, ErrorCodes.VALIDATION_ERROR));
  }
};

// Filter cho âm thanh (Songs, Podcasts)
const audioFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new AppError('Chỉ hỗ trợ upload file âm thanh (mp3, wav, flac, ogg)', 400, ErrorCodes.VALIDATION_ERROR));
  }
};

export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Giới hạn 5MB cho ảnh
  },
});

export const uploadAudio = multer({
  storage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Giới hạn 50MB cho âm thanh
  },
});
