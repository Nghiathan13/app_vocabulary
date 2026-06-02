-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vocab_words" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "normalized_word" TEXT NOT NULL,
    "ipa" TEXT,
    "type" TEXT,
    "meaning_vi" TEXT NOT NULL,
    "definition" TEXT,
    "example" TEXT,
    "band" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "wrong_count" INTEGER NOT NULL DEFAULT 0,
    "last_review" DATE,
    "next_review" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vocab_words_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "vocab_words_user_id_deleted_at_idx" ON "vocab_words"("user_id", "deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "vocab_words_user_id_normalized_word_key" ON "vocab_words"("user_id", "normalized_word");

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
