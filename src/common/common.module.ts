import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { FilesController } from './controllers/files.controller';
import { FilesService } from './services/files.service';

@Module({
  imports: [
    MulterModule.register({
      storage: 'memory',
    }),
  ],
  controllers: [FilesController], // ADD THIS
  providers: [FilesService],
  exports: [FilesService, MulterModule],
})
export class CommonModule {}