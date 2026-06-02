import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "crypto";

import { AudioService, normalizeAudioText } from "../audio/audio.service";
import { PrismaService } from "../prisma/prisma.service";
import { SyncVocabularyDto, VocabWordDto } from "./vocab.dto";

const normalizeWord = (word: string) => word.trim().toLowerCase();

const parseDateOnly = (value?: string | null) =>
  value ? new Date(`${value.slice(0, 10)}T00:00:00.000Z`) : null;

const parseDateTime = (value?: string | null) => {
  if (!value) {
    return new Date();
  }

  const normalizedValue = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(value)
    ? `${value.replace(" ", "T")}Z`
    : value;

  return new Date(normalizedValue);
};

@Injectable()
export class VocabService {
  constructor(
    private readonly audioService: AudioService,
    private readonly prisma: PrismaService,
  ) {}

  async list(userId: string) {
    const words = await this.prisma.vocabWord.findMany({
      where: { userId, deletedAt: null },
      orderBy: { word: "asc" },
    });

    return await this.toResponses(words);
  }

  async create(userId: string, dto: VocabWordDto) {
    const normalizedWord = normalizeWord(dto.word);
    const existingWord = await this.prisma.vocabWord.findUnique({
      where: { userId_normalizedWord: { userId, normalizedWord } },
    });

    if (existingWord && !existingWord.deletedAt) {
      throw new ConflictException("Word already exists");
    }

    const word = await this.prisma.vocabWord.upsert({
      where: { userId_normalizedWord: { userId, normalizedWord } },
      create: this.toCreateData(userId, dto),
      update: {
        ...this.toUpdateData(dto),
        deletedAt: null,
      },
    });

    this.generateAudioInBackground(word.word);

    return (await this.toResponses([word]))[0];
  }

  async update(userId: string, id: string, dto: VocabWordDto) {
    await this.ensureOwnedWord(userId, id);

    const word = await this.prisma.vocabWord.update({
      where: { id },
      data: this.toUpdateData(dto),
    });

    this.generateAudioInBackground(word.word);

    return (await this.toResponses([word]))[0];
  }

  async delete(userId: string, id: string) {
    await this.ensureOwnedWord(userId, id);

    const word = await this.prisma.vocabWord.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return (await this.toResponses([word]))[0];
  }

  async sync(userId: string, dto: SyncVocabularyDto) {
    const mergedIds: Array<{ localId: string; serverId: string }> = [];
    const wordsNeedingAudio = new Set<string>();

    for (const change of dto.changes) {
      const incomingId = change.id ?? randomUUID();
      const normalizedWord = normalizeWord(change.word);
      const incomingUpdatedAt = parseDateTime(change.updated_at);
      const existingById = await this.prisma.vocabWord.findFirst({
        where: { id: incomingId, userId },
      });
      const existingByWord = await this.prisma.vocabWord.findUnique({
        where: { userId_normalizedWord: { userId, normalizedWord } },
      });
      const existing = existingById ?? existingByWord;

      if (existing && existing.id !== incomingId) {
        mergedIds.push({ localId: incomingId, serverId: existing.id });
      }

      if (existing && existing.updatedAt > incomingUpdatedAt) {
        continue;
      }

      if (change.deleted_at) {
        if (existing) {
          await this.prisma.vocabWord.update({
            where: { id: existing.id },
            data: {
              deletedAt: parseDateTime(change.deleted_at),
              updatedAt: incomingUpdatedAt,
            },
          });
        }
        continue;
      }

      if (existing) {
        await this.prisma.vocabWord.update({
          where: { id: existing.id },
          data: {
            ...this.toUpdateData(change),
            updatedAt: incomingUpdatedAt,
            deletedAt: null,
          },
        });
        wordsNeedingAudio.add(change.word);
        continue;
      }

      await this.prisma.vocabWord.create({
        data: {
          ...this.toCreateData(userId, change),
          id: incomingId,
          updatedAt: incomingUpdatedAt,
        },
      });
      wordsNeedingAudio.add(change.word);
    }

    const allWords = await this.prisma.vocabWord.findMany({
      where: { userId },
      orderBy: { word: "asc" },
    });
    const activeWords = allWords.filter((word) => !word.deletedAt);

    for (const word of wordsNeedingAudio) {
      this.generateAudioInBackground(word);
    }

    return {
      words: await this.toResponses(activeWords),
      deletedIds: allWords
        .filter((word) => Boolean(word.deletedAt))
        .map((word) => word.id),
      mergedIds,
      syncedAt: new Date().toISOString(),
    };
  }

  private async ensureOwnedWord(userId: string, id: string) {
    const word = await this.prisma.vocabWord.findFirst({
      where: { id, userId },
    });

    if (!word) {
      throw new NotFoundException("Word not found");
    }

    return word;
  }

  private toCreateData(userId: string, dto: VocabWordDto) {
    const word = dto.word.trim();

    return {
      userId,
      word,
      normalizedWord: normalizeWord(word),
      ipa: dto.ipa ?? null,
      type: dto.type ?? null,
      meaningVi: dto.meaning_vi,
      definition: dto.definition ?? null,
      example: dto.example ?? null,
      band: dto.band ?? null,
      level: dto.level ?? 0,
      wrongCount: dto.wrong_count ?? 0,
      lastReview: parseDateOnly(dto.last_review),
      nextReview: parseDateOnly(dto.next_review),
      deletedAt: dto.deleted_at ? parseDateTime(dto.deleted_at) : null,
    };
  }

  private toUpdateData(dto: VocabWordDto) {
    const word = dto.word.trim();

    return {
      word,
      normalizedWord: normalizeWord(word),
      ipa: dto.ipa ?? null,
      type: dto.type ?? null,
      meaningVi: dto.meaning_vi,
      definition: dto.definition ?? null,
      example: dto.example ?? null,
      band: dto.band ?? null,
      level: dto.level ?? 0,
      wrongCount: dto.wrong_count ?? 0,
      lastReview: parseDateOnly(dto.last_review),
      nextReview: parseDateOnly(dto.next_review),
    };
  }

  private generateAudioInBackground(word: string) {
    void this.audioService.ensureAudioForWord(word).catch((error) => {
      console.warn(`Failed to generate audio for "${word}":`, error);
    });
  }

  private async toResponses(
    words: Array<{
      id: string;
      word: string;
      ipa: string | null;
      type: string | null;
      meaningVi: string;
      definition: string | null;
      example: string | null;
      band: string | null;
      level: number;
      wrongCount: number;
      lastReview: Date | null;
      nextReview: Date | null;
      createdAt: Date;
      updatedAt: Date;
      deletedAt: Date | null;
    }>,
  ) {
    const metadata = await this.audioService.getMetadataByNormalizedTexts(
      words.map((word) => normalizeAudioText(word.word)),
    );

    return words.map((word) => {
      const audioMetadata = metadata.get(normalizeAudioText(word.word));

      return {
        ...this.toResponse(word),
        audio_status: audioMetadata?.audio_status ?? null,
        audio_url: audioMetadata?.audio_url ?? null,
        hasAudio: audioMetadata?.hasAudio ?? false,
      };
    });
  }

  private toResponse(word: {
    id: string;
    word: string;
    ipa: string | null;
    type: string | null;
    meaningVi: string;
    definition: string | null;
    example: string | null;
    band: string | null;
    level: number;
    wrongCount: number;
    lastReview: Date | null;
    nextReview: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      id: word.id,
      word: word.word,
      ipa: word.ipa,
      type: word.type,
      meaning_vi: word.meaningVi,
      definition: word.definition,
      example: word.example,
      band: word.band,
      level: word.level,
      wrong_count: word.wrongCount,
      last_review: word.lastReview?.toISOString().slice(0, 10) ?? null,
      next_review: word.nextReview?.toISOString().slice(0, 10) ?? null,
      created_at: word.createdAt.toISOString(),
      updated_at: word.updatedAt.toISOString(),
      deleted_at: word.deletedAt?.toISOString() ?? null,
    };
  }
}
