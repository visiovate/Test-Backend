import multer from 'multer';
import { Request } from 'express';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { AppError } from './error.middleware';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Only image files are allowed'));
  }
};

// Configure multer upload
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Initialize S3 client
const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

// Upload to S3
export const uploadToS3 = async (file: Express.Multer.File, folder: string): Promise<string> => {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws.s3Bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
      },
    });

    await upload.done();

    return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
  } catch (error) {
    throw new AppError(500, 'Failed to upload file to S3');
  }
};

// Delete from S3
export const deleteFromS3 = async (url: string): Promise<void> => {
  try {
    const key = url.split('.com/')[1];
    
    await s3Client.send({
      Bucket: config.aws.s3Bucket,
      Key: key,
      Delete: {},
    });
  } catch (error) {
    throw new AppError(500, 'Failed to delete file from S3');
  }
}; 