import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthUser } from "../auth/auth-user";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { SyncVocabularyDto, VocabWordDto } from "./vocab.dto";
import { VocabService } from "./vocab.service";

@UseGuards(AuthGuard)
@Controller("vocab")
export class VocabController {
  constructor(private readonly vocabService: VocabService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.vocabService.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: VocabWordDto) {
    return this.vocabService.create(user.id, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body() dto: VocabWordDto,
  ) {
    return this.vocabService.update(user.id, id, dto);
  }

  @Delete(":id")
  delete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.vocabService.delete(user.id, id);
  }

  @Post("sync")
  sync(@CurrentUser() user: AuthUser, @Body() dto: SyncVocabularyDto) {
    return this.vocabService.sync(user.id, dto);
  }
}
