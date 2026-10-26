// Run: npm run test:deletion   (needs the local healthwise database)
import assert from 'node:assert/strict';
import prisma from '../src/prisma';
import { deletionKeyMatches, handleDeletion, purgeUser } from '../src/lib/accountDeletion';

const LEAVER = 990201;
const STAYER = 990202;

async function seed(userId: number) {
    await prisma.session.create({ data: { userId, syswiseToken: 't' } });
    await prisma.settings.create({ data: { userId } });
    await prisma.habit.create({ data: { userId, name: 'Walk', startDate: '2026-10-01' } });
    await prisma.healthMeasurement.create({ data: { userId, date: '2026-10-01', weight: 70 } });
    const exercise = await prisma.exercise.create({ data: {
        name: `Custom ${userId}`, category: 'strength', primaryMuscle: 'core', secondaryMuscles: [],
        bodyPartFocus: 'core', equipment: 'none', trackingType: 'reps', createdByUserId: userId } });
    await prisma.exerciseNote.create({ data: { userId, exerciseId: exercise.id, note: 'felt good', date: '2026-10-01' } });
}

const count = async (userId: number) => ({
    sessions: await prisma.session.count({ where: { userId } }),
    habits: await prisma.habit.count({ where: { userId } }),
    measurements: await prisma.healthMeasurement.count({ where: { userId } }),
    exercises: await prisma.exercise.count({ where: { createdByUserId: userId } }),
    settings: await prisma.settings.count({ where: { userId } }),
});

async function main() {
    process.env.SYSWISE_DELETION_KEY = 'right-key';
    assert.equal(deletionKeyMatches('right-key'), true);
    assert.equal(deletionKeyMatches('wrong-key'), false);
    process.env.SYSWISE_DELETION_KEY = '';
    assert.equal(deletionKeyMatches(''), false);

    for (const id of [LEAVER, STAYER]) await purgeUser(id);
    await seed(LEAVER);
    await seed(STAYER);

    await handleDeletion(LEAVER, 'account.closed');
    const closed = await count(LEAVER);
    assert.equal(closed.sessions, 0, 'closing ends the session');
    assert.equal(closed.habits, 1, 'closing keeps the data until the purge');

    await handleDeletion(LEAVER, 'account.purged');
    assert.deepEqual(await count(LEAVER), { sessions: 0, habits: 0, measurements: 0, exercises: 0, settings: 0 });
    assert.deepEqual(await count(STAYER), { sessions: 1, habits: 1, measurements: 1, exercises: 1, settings: 1 });
    await handleDeletion(LEAVER, 'account.purged'); // idempotent

    await purgeUser(STAYER);
    console.log('accountDeletion: all checks passed');
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
