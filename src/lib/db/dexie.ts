import Dexie, { type Table } from 'dexie';
import type { Workout, NutritionLog, SleepLog, Biometrics } from './schema';

export class KratosDB extends Dexie {
  workouts!: Table<Workout>;
  nutrition!: Table<NutritionLog>;
  sleep!: Table<SleepLog>;
  biometrics!: Table<Biometrics>;

  constructor() {
    super('KratosDB');
    this.version(1).stores({
      workouts: '++id, date, *muscleGroups',
      nutrition: '++id, timestamp',
      sleep: '++id, date',
      biometrics: '++id, date'
    });
  }
}

export const db = new KratosDB();
