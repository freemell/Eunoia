-- CreateTable
CREATE TABLE "LimitOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "walletAddress" TEXT NOT NULL,
    "userId" TEXT,
    "telegramId" TEXT,
    "tokenAddress" TEXT NOT NULL,
    "tokenSymbol" TEXT,
    "orderType" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "triggerValue" TEXT NOT NULL,
    "amount" TEXT,
    "amountType" TEXT NOT NULL DEFAULT 'fixed',
    "status" TEXT NOT NULL DEFAULT 'active',
    "executedAt" DATETIME,
    "txHash" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "LimitOrder_walletAddress_idx" ON "LimitOrder"("walletAddress");

-- CreateIndex
CREATE INDEX "LimitOrder_status_idx" ON "LimitOrder"("status");

-- CreateIndex
CREATE INDEX "LimitOrder_tokenAddress_idx" ON "LimitOrder"("tokenAddress");

-- CreateIndex
CREATE INDEX "LimitOrder_createdAt_idx" ON "LimitOrder"("createdAt");

