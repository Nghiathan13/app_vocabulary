CREATE TABLE "audio_assets" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "voice_id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "file_path" TEXT,
    "status" TEXT NOT NULL,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_assets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "audio_assets_normalized_text_key" ON "audio_assets"("normalized_text");
CREATE INDEX "audio_assets_status_idx" ON "audio_assets"("status");
