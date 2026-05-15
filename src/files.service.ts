import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FilesService {
  private readonly uploadPath = path.join(__dirname, '..', '..', 'uploads');

  constructor() {
    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async saveImage(file: Express.Multer.File): Promise<string> {
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(this.uploadPath, fileName);
    
    await fs.promises.writeFile(filePath, file.buffer);

    return `http://localhost:3000/uploads/${fileName}`;
  }
}