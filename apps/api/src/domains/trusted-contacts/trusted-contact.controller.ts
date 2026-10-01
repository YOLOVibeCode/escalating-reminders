import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TrustedContactService } from './trusted-contact.service';
import type { TrustedContact } from '@er/types';

@ApiTags('trusted-contacts')
@ApiBearerAuth()
@Controller('trusted-contacts')
@UseGuards(JwtAuthGuard)
export class TrustedContactController {
  constructor(private readonly trustedContactService: TrustedContactService) {}

  @Get()
  @ApiOperation({ summary: 'List trusted contacts' })
  async list(@Request() req: { user: { sub: string } }): Promise<TrustedContact[]> {
    return this.trustedContactService.list(req.user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create trusted contact' })
  async create(
    @Request() req: { user: { sub: string } },
    @Body()
    body: {
      name: string;
      email?: string;
      phone?: string;
      relationship: string;
      notifyViaSms?: boolean;
    },
  ): Promise<TrustedContact> {
    return this.trustedContactService.create(req.user.sub, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update trusted contact' })
  async update(
    @Request() req: { user: { sub: string } },
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      relationship?: string;
      notifyViaSms?: boolean;
    },
  ): Promise<TrustedContact> {
    return this.trustedContactService.update(req.user.sub, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete trusted contact' })
  async remove(@Request() req: { user: { sub: string } }, @Param('id') id: string): Promise<void> {
    await this.trustedContactService.remove(req.user.sub, id);
  }
}
