import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import * as multer from 'multer';

import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';

@Global()
@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
      // ==================================================
      // FIXED LOGIC: Added Video Extensions (mp4, mov, webm)
      // ==================================================
      fileFilter: (req, file, cb) => {
        // Allow images and videos
        if (file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov|webm)$/i)) {
          cb(null, true); // ALLOW the file
        } else {
          cb(new Error('Unsupported file type. Only JPG, PNG, GIF, MP4, MOV, WEBM allowed.'), false); // REJECT the file
        }
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class CommonModule {}