import { Module } from '@nestjs/common';
import { JournalsService } from './journals.service';
import { JournalsController } from './journals.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';

@Module({
    imports: [CloudinaryModule],
    controllers: [JournalsController],
    providers: [JournalsService],
    exports: [JournalsService],
})
export class JournalsModule { }
