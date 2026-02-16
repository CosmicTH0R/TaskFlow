import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create demo users
  const password = await bcrypt.hash('password123', 10);

  const demo = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      name: 'Demo User',
      password,
    },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      password,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@example.com' },
    update: {},
    create: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      password,
    },
  });

  // Create a sample board
  const board = await prisma.board.upsert({
    where: { id: 'seed-board-1' },
    update: {},
    create: {
      id: 'seed-board-1',
      title: 'Project Alpha',
      description: 'Main product development board',
      color: '#6366f1',
      ownerId: demo.id,
    },
  });

  // Add members
  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: demo.id } },
    update: {},
    create: { boardId: board.id, userId: demo.id, role: 'OWNER' },
  });

  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: alice.id } },
    update: {},
    create: { boardId: board.id, userId: alice.id, role: 'MEMBER' },
  });

  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board.id, userId: bob.id } },
    update: {},
    create: { boardId: board.id, userId: bob.id, role: 'MEMBER' },
  });

  // Create lists
  const todoList = await prisma.list.upsert({
    where: { id: 'seed-list-todo' },
    update: {},
    create: {
      id: 'seed-list-todo',
      title: 'To Do',
      boardId: board.id,
      position: 0,
    },
  });

  const inProgressList = await prisma.list.upsert({
    where: { id: 'seed-list-progress' },
    update: {},
    create: {
      id: 'seed-list-progress',
      title: 'In Progress',
      boardId: board.id,
      position: 1,
    },
  });

  const reviewList = await prisma.list.upsert({
    where: { id: 'seed-list-review' },
    update: {},
    create: {
      id: 'seed-list-review',
      title: 'In Review',
      boardId: board.id,
      position: 2,
    },
  });

  const doneList = await prisma.list.upsert({
    where: { id: 'seed-list-done' },
    update: {},
    create: {
      id: 'seed-list-done',
      title: 'Done',
      boardId: board.id,
      position: 3,
    },
  });

  // Create tasks
  const tasks = [
    { id: 'seed-task-1', title: 'Design landing page mockup', description: 'Create wireframes and high-fidelity mockups for the landing page', listId: todoList.id, position: 0, priority: 'HIGH' },
    { id: 'seed-task-2', title: 'Set up CI/CD pipeline', description: 'Configure GitHub Actions for automated testing and deployment', listId: todoList.id, position: 1, priority: 'MEDIUM' },
    { id: 'seed-task-3', title: 'Implement user authentication', description: 'Add JWT-based signup/login flow with password hashing', listId: inProgressList.id, position: 0, priority: 'URGENT' },
    { id: 'seed-task-4', title: 'Build REST API endpoints', description: 'Create CRUD endpoints for boards, lists, and tasks', listId: inProgressList.id, position: 1, priority: 'HIGH' },
    { id: 'seed-task-5', title: 'Code review: Database schema', description: 'Review and approve the database schema design', listId: reviewList.id, position: 0, priority: 'MEDIUM' },
    { id: 'seed-task-6', title: 'Project setup & scaffolding', description: 'Initialize monorepo with frontend and backend', listId: doneList.id, position: 0, priority: 'LOW' },
  ];

  for (const taskData of tasks) {
    await prisma.task.upsert({
      where: { id: taskData.id },
      update: {},
      create: { ...taskData, boardId: board.id },
    });
  }

  // Assign some tasks
  await prisma.taskAssignee.upsert({
    where: { taskId_userId: { taskId: 'seed-task-3', userId: demo.id } },
    update: {},
    create: { taskId: 'seed-task-3', userId: demo.id },
  });

  await prisma.taskAssignee.upsert({
    where: { taskId_userId: { taskId: 'seed-task-4', userId: alice.id } },
    update: {},
    create: { taskId: 'seed-task-4', userId: alice.id },
  });

  await prisma.taskAssignee.upsert({
    where: { taskId_userId: { taskId: 'seed-task-1', userId: bob.id } },
    update: {},
    create: { taskId: 'seed-task-1', userId: bob.id },
  });

  // Create second board
  const board2 = await prisma.board.upsert({
    where: { id: 'seed-board-2' },
    update: {},
    create: {
      id: 'seed-board-2',
      title: 'Marketing Campaign',
      description: 'Q1 marketing initiatives',
      color: '#ec4899',
      ownerId: demo.id,
    },
  });

  await prisma.boardMember.upsert({
    where: { boardId_userId: { boardId: board2.id, userId: demo.id } },
    update: {},
    create: { boardId: board2.id, userId: demo.id, role: 'OWNER' },
  });

  // Add lists to second board
  await prisma.list.upsert({
    where: { id: 'seed-list-2-ideas' },
    update: {},
    create: { id: 'seed-list-2-ideas', title: 'Ideas', boardId: board2.id, position: 0 },
  });
  await prisma.list.upsert({
    where: { id: 'seed-list-2-planned' },
    update: {},
    create: { id: 'seed-list-2-planned', title: 'Planned', boardId: board2.id, position: 1 },
  });
  await prisma.list.upsert({
    where: { id: 'seed-list-2-live' },
    update: {},
    create: { id: 'seed-list-2-live', title: 'Live', boardId: board2.id, position: 2 },
  });

  // Add sample activity
  await prisma.activity.createMany({
    data: [
      { boardId: board.id, userId: demo.id, action: 'BOARD_CREATED', details: JSON.stringify({ title: 'Project Alpha' }) },
      { boardId: board.id, userId: demo.id, taskId: 'seed-task-3', action: 'TASK_CREATED', details: JSON.stringify({ title: 'Implement user authentication' }) },
      { boardId: board.id, userId: alice.id, taskId: 'seed-task-4', action: 'TASK_ASSIGNED', details: JSON.stringify({ title: 'Build REST API endpoints', assigneeName: 'Alice Johnson' }) },
      { boardId: board.id, userId: demo.id, action: 'MEMBER_ADDED', details: JSON.stringify({ memberName: 'Bob Smith' }) },
    ],
  });

  console.log('✅ Seed complete!');
  console.log('');
  console.log('Demo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Additional users:');
  console.log('  Email: alice@example.com / Password: password123');
  console.log('  Email: bob@example.com / Password: password123');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
