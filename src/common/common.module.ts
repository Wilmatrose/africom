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
      // ✅ FIXED LOGIC:
      fileFilter: (req, file, cb) => {
        // Check if the extension matches jpg, jpeg, png, or gif
        if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          cb(null, true); // ALLOW the file
        } else {
          cb(new Error('Unsupported file type'), false); // REJECT the file
        }
      },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class CommonModule {}