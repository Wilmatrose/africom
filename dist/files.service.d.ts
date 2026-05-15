export declare class FilesService {
    private readonly uploadPath;
    constructor();
    saveImage(file: Express.Multer.File): Promise<string>;
}
