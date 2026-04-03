import { db } from './dexie';

export const seedDatabase = async () => {
  const isDemo = localStorage.getItem('kratos_account_type') === 'demo';
  if (!isDemo) return;

  const workoutCount = await db.workouts.count();
  if (workoutCount > 0) return;

  const now = new Date();
  const days = 30;

  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - i));
    const dateStr = date.toISOString().split('T')[0];

    // 1. Seed Sleep
    await db.sleep.add({
      date: dateStr,
      duration: 7 + Math.random() * 2,
      quality: Math.floor(Math.random() * 5) + 5,
    });

    // 2. Seed Nutrition
    await db.nutrition.add({
      timestamp: date,
      rawText: 'Seeded daily log',
      kcals: 2500 + Math.random() * 500,
      protein: 160 + Math.random() * 40,
      carbs: 300 + Math.random() * 100,
      fats: 70 + Math.random() * 20,
      confidence: 1.0,
    });

    // 3. Seed Biometrics
    await db.biometrics.add({
      date: date,
      weight: 88.5 - (i * 0.05), // Slow linear weight loss
      bodyFat: 15,
      sfr: {
        chest: Math.random(),
        quads: Math.random() * 1.5, // Occasional overreaching
        back: Math.random(),
      }
    });

    // 4. Seed Workouts (3 days per week)
    if (i % 3 === 0) {
      await db.workouts.add({
        date: date,
        muscleGroups: ['chest', 'shoulders', 'arms'],
        exercises: [
          {
            exerciseId: 'bench-press',
            name: 'Bench Press',
            sets: [
              { weight: 80, reps: 10, rir: 2, rpe: 8 },
              { weight: 80, reps: 10, rir: 1, rpe: 9 },
              { weight: 80, reps: 8, rir: 0, rpe: 10 },
            ]
          }
        ],
        readinessScore: 80,
      });
    }
  }
  console.log('Database seeded with 30 days of performance data.');
};
