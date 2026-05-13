import { PrismaClient } from '@prisma/client';

// Singleton Prisma Client
// Tránh tạo nhiều connection trong development (hot reload)
const globalForPrisma = globalThis as unknown as { 
  basePrisma: PrismaClient;
};

export const adminPrisma = globalForPrisma.basePrisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

export const prisma = adminPrisma.$extends({
  query: {
    user: {
      $allOperations({ model, operation, args, query }) {
        // Cập nhật query "where" đối với các thao tác list/count
        if (['findMany', 'findFirst', 'count', 'findFirstOrThrow', 'aggregate', 'groupBy'].includes(operation)) {
          (args as any).where = { ...(args as any).where, deletedAt: null };
          return query(args);
        }
        
        // Transform findUnique(OrThrow) thành findFirst(OrThrow) để chèn được deletedAt
        if (operation === 'findUnique' || operation === 'findUniqueOrThrow') {
          const findFirstOp = operation === 'findUnique' ? 'findFirst' : 'findFirstOrThrow';
          return (adminPrisma as any)[model as any][findFirstOp]({
            ...args,
            where: { ...(args as any).where, deletedAt: null }
          });
        }

        return query(args);
      },
    },
  },
}) as unknown as PrismaClient; // Cast lại type để tương thích với các API cũ

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.basePrisma = adminPrisma;
}
