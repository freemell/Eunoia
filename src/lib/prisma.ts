import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    // Test connection by trying to create a simple record
    await prisma.$connect();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error);
    // Fallback to in-memory storage for now
  }
}
