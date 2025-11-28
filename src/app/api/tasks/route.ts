import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

/**
 * GET /api/tasks
 * List tasks with filters
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const leadId = searchParams.get('leadId');
        const userId = searchParams.get('userId');
        const type = searchParams.get('type');

        const where: any = {};

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (leadId) where.leadId = leadId;
        if (userId) where.userId = userId;
        if (type) where.type = type;

        const tasks = await prisma.task.findMany({
            where,
            include: {
                lead: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                        telefone: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                dueDate: 'asc',
            },
        });

        return NextResponse.json({ success: true, data: tasks });
    } catch (error: any) {
        console.error('[Tasks API] Error listing tasks:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to list tasks' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/tasks
 * Create a new task
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            leadId,
            userId,
            type,
            title,
            description,
            priority = 'medium',
            dueDate,
            reminderAt,
        } = body;

        if (!leadId || !userId || !type || !title || !dueDate) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const task = await prisma.task.create({
            data: {
                leadId,
                userId,
                type,
                title,
                description,
                priority,
                dueDate: new Date(dueDate),
                reminderAt: reminderAt ? new Date(reminderAt) : null,
                status: 'pending',
            },
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('[Tasks API] Error creating task:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create task' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/tasks
 * Update a task (status, etc.)
 */
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, ...updates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing task ID' },
                { status: 400 }
            );
        }

        const data: any = { ...updates };

        if (status) {
            data.status = status;
            if (status === 'completed') {
                data.completedAt = new Date();
            } else if (status === 'pending') {
                data.completedAt = null;
            }
        }

        if (updates.dueDate) {
            data.dueDate = new Date(updates.dueDate);
        }
        if (updates.reminderAt) {
            data.reminderAt = new Date(updates.reminderAt);
        }

        const task = await prisma.task.update({
            where: { id },
            data,
        });

        return NextResponse.json({ success: true, data: task });
    } catch (error: any) {
        console.error('[Tasks API] Error updating task:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update task' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/tasks
 * Delete a task
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Missing task ID' },
                { status: 400 }
            );
        }

        await prisma.task.delete({
            where: { id },
        });

        return NextResponse.json({ success: true, message: 'Task deleted' });
    } catch (error: any) {
        console.error('[Tasks API] Error deleting task:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to delete task' },
            { status: 500 }
        );
    }
}
