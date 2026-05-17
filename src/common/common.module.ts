import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import * as multer from 'multer';

import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';

@Global() // IMPORTANT: Makes FilesService globally available
@Module({
  imports: [
    MulterModule.register({
      // FIX: Explicitly define options to avoid compilation/runtime mismatch
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
      },
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|mp4|mov)$/i)) {
          return cb(null, false);
        }
        cb(new Error('Unsupported file type'), false);
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class CommonModule {}