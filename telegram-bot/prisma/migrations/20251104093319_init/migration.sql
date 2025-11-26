-- CreateTable
CREATE TABLE "TelegramUser" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "telegramId" TEXT NOT NULL,
    "username" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "encryptedKey" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "iv" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_telegramId_key" ON "TelegramUser"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "TelegramUser_publicKey_key" ON "TelegramUser"("publicKey");

-- CreateIndex
CREATE INDEX "TelegramUser_telegramId_idx" ON "TelegramUser"("telegramId");

-- CreateIndex
CREATE INDEX "TelegramUser_publicKey_idx" ON "TelegramUser"("publicKey");
