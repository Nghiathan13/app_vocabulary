import { Controller, Get, NotFoundException, Param, Res } from "@nestjs/common";
import { Response } from "express";

import { AudioService } from "./audio.service";

@Controller("audio")
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Get(":fileName")
  sendAudio(@Param("fileName") fileName: string, @Res() response: Response) {
    const filePath = this.audioService.getAudioFilePath(fileName);

    if (!filePath) {
      throw new NotFoundException("Audio not found");
    }

    return response.sendFile(filePath, (error) => {
      if (error && !response.headersSent) {
        response.status(404).send("Audio not found");
      }
    });
  }
}
