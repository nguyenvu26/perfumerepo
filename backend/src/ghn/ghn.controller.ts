import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GHNService } from './ghn.service';

@Controller('ghn')
export class GHNController {
    constructor(private readonly ghn: GHNService) { }

    @Get('provinces')
    async getProvinces() {
        try {
            return await this.ghn.getProvinces();
        } catch (error) {
            throw new Error(`GHN API Error: ${error.message}`);
        }
    }

    @Get('districts')
    async getDistricts(@Query('provinceId') provinceId: string) {
        const id = parseInt(provinceId, 10);
        if (!id) return [];
        return this.ghn.getDistricts(id);
    }

    @Get('wards')
    async getWards(@Query('districtId') districtId: string) {
        const id = parseInt(districtId, 10);
        if (!id) return [];
        return this.ghn.getWards(id);
    }

    @Get('services')
    async getServices(@Query('toDistrictId') toDistrictId: string) {
        const id = parseInt(toDistrictId, 10);
        if (!id) return [];
        return this.ghn.getAvailableServices(id);
    }

    @Post('calculate-fee')
    @UseGuards(JwtAuthGuard)
    async calculateFee(
        @Body()
        body: {
            toDistrictId: number;
            toWardCode: string;
            serviceId: number;
            weight?: number;
            length?: number;
            width?: number;
            height?: number;
            codValue?: number;
        },
    ) {
        try {
            const fee = await this.ghn.calculateFee({
                toDistrictId: body.toDistrictId,
                toWardCode: body.toWardCode,
                serviceId: body.serviceId,
                weight: body.weight ?? 500,
                length: body.length,
                width: body.width,
                height: body.height,
                codValue: body.codValue,
            });
            return fee;
        } catch (error) {
            return {
                statusCode: 400,
                message: error.message || 'Không thể tính phí vận chuyển',
                error: 'Bad Request',
            };
        }
    }

    @Get('config')
    async getConfig() {
        return { configured: this.ghn.isConfigured() };
    }
}
