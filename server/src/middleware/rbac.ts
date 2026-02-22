import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Checks if a user has one of the allowed roles for a specific board.
 * Returns true if authorized, false otherwise.
 */
export async function checkBoardRole(userId: string, boardId: string, allowedRoles: string[]): Promise<boolean> {
  const member = await prisma.boardMember.findUnique({
    where: {
      boardId_userId: {
        boardId,
        userId,
      },
    },
  });

  if (!member) return false;
  return allowedRoles.includes(member.role);
}
