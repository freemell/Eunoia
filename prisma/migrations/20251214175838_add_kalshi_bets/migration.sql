-- CreateTable
CREATE TABLE "KalshiBet" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "userId" TEXT,
    "telegramId" TEXT,
    "marketTicker" TEXT NOT NULL,
    "marketTitle" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "entryPrice" DOUBLE PRECISION NOT NULL,
    "currentPrice" DOUBLE PRECISION NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "txHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "marketData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KalshiBet_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "KalshiBet_walletAddress_idx" ON "KalshiBet"("walletAddress");

-- CreateIndex
CREATE INDEX "KalshiBet_status_idx" ON "KalshiBet"("status");

-- CreateIndex
CREATE INDEX "KalshiBet_marketTicker_idx" ON "KalshiBet"("marketTicker");

-- CreateIndex
CREATE INDEX "KalshiBet_createdAt_idx" ON "KalshiBet"("createdAt");
