import { PartialType } from '@nestjs/mapped-types';
import { CreateScentFamilyDto } from './create-scent-family.dto';

export class UpdateScentFamilyDto extends PartialType(CreateScentFamilyDto) {}
