import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import multer from 'multer';

import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';

@Global() // ✅ ADD THIS DECORATOR
@Module({
  imports: [
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class CommonModule {}