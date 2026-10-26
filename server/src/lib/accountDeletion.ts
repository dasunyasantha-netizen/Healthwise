import crypto from 'crypto';
import prisma from '../prisma';

/**
 * SysWise account deletion. SysWise calls POST /api/syswise/account-deleted with
 * `account.closed` when someone deletes their account (end their sessions) and
 * `account.purged` 30 days later (remove their data). Health records are
 * personal, so a purge removes all of them.
 */
export type DeletionEvent = 'account.closed' | 'account.purged';

export function deletionKeyMatches(presented: unknown): boolean {
    const key = process.env.SYSWISE_DELETION_KEY || '';
    if (!key || typeof presented !== 'string') return false;
    const a = Buffer.from(presented);
    const b = Buffer.from(key);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function endSessions(userId: number): Promise<void> {
    await prisma.session.deleteMany({ where: { userId } });
}

export async function purgeUser(userId: number): Promise<void> {
    await prisma.$transaction(async (tx) => {
        await tx.habitCompletion.deleteMany({ where: { userId } });
        await tx.habit.deleteMany({ where: { userId } });
        await tx.workoutSession.deleteMany({ where: { userId } }); // logs and sets cascade
        await tx.workoutPlan.deleteMany({ where: { userId } }); // plan exercises cascade
        await tx.exerciseNote.deleteMany({ where: { userId } });
        await tx.mealLog.deleteMany({ where: { userId } });
        await tx.fastingSession.deleteMany({ where: { userId } });
        await tx.healthMeasurement.deleteMany({ where: { userId } });
        // Their own custom exercises go too, unless someone else's plan or log uses one.
        const custom = await tx.exercise.findMany({ where: { createdByUserId: userId, isSystem: false }, select: { id: true } });
        for (const { id } of custom) {
            const used = (await tx.workoutPlanExercise.count({ where: { exerciseId: id } }))
                + (await tx.workoutExerciseLog.count({ where: { exerciseId: id } }));
            if (used) await tx.exercise.update({ where: { id }, data: { createdByUserId: null } });
            else await tx.exercise.delete({ where: { id } });
        }
        await tx.settings.deleteMany({ where: { userId } });
        await tx.session.deleteMany({ where: { userId } });
    });
}

export async function handleDeletion(userId: number, event: DeletionEvent): Promise<void> {
    if (event === 'account.purged') await purgeUser(userId);
    else await endSessions(userId);
}
