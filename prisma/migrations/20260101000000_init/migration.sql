-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "procedureType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "sourceFile" TEXT NOT NULL,
    "docTitle" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentChunk_sourceFile_idx" ON "DocumentChunk"("sourceFile");

-- CreateIndex
CREATE INDEX "DocumentChunk_procedureType_idx" ON "DocumentChunk"("procedureType");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Fuzzy / full-text search support (Estonian has many word forms)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "DocumentChunk_content_trgm_idx" ON "DocumentChunk" USING GIN ("content" gin_trgm_ops);
CREATE INDEX "DocumentChunk_fts_idx" ON "DocumentChunk" USING GIN (to_tsvector('simple', "docTitle" || ' ' || "section" || ' ' || "content"));
