export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    handle?: string;
    avatarUrl?: string;
    height?: number;
}

export interface Exercise {
    id: string;
    name: string;
    category: string;
    primaryMuscle: string;
    secondaryMuscles: string[];
    bodyPartFocus: string;
    equipment: string;
    trackingType: 'reps_weight' | 'time' | 'distance' | 'reps_only';
    demoVideoUrl?: string;
    sourceUrl?: string;
    instructions?: string;
    safetyNotes?: string;
    isSystem: boolean;
    createdByUserId?: string;
}

export interface WorkoutPlanExercise {
    id: string;
    exerciseId: string;
    exercise: Exercise;
    orderIndex: number;
    targetSets?: number;
    targetReps?: number;
    targetWeight?: number;
    targetTimeSeconds?: number;
    restSeconds?: number;
    notes?: string;
}

export interface WorkoutPlan {
    id: string;
    userId: string;
    name: string;
    date?: string;
    isTemplate: boolean;
    notes?: string;
    exercises: WorkoutPlanExercise[];
    createdAt: string;
    updatedAt: string;
}

export interface WorkoutSetLog {
    id: string;
    setNumber: number;
    weight?: number;
    reps?: number;
    timeSeconds?: number;
    completed: boolean;
}

export interface WorkoutExerciseLog {
    id: string;
    exerciseId: string;
    exercise: Exercise;
    orderIndex: number;
    completed: boolean;
    actualTimeSeconds?: number;
    notes?: string;
    sets: WorkoutSetLog[];
}

export interface WorkoutSession {
    id: string;
    userId: string;
    workoutPlanId?: string;
    workoutPlan?: { name: string };
    date: string;
    startedAt: string;
    endedAt?: string;
    status: 'planned' | 'in_progress' | 'completed' | 'skipped';
    notes?: string;
    exerciseLogs: WorkoutExerciseLog[];
}

export interface MealLog {
    id: string;
    date: string;
    time?: string;
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
    foodItems: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    waterMl?: number;
    notes?: string;
    photoUrl?: string;
}

export interface FastingSession {
    id: string;
    startTime: string;
    endTime?: string;
    targetHours: number;
    status: 'active' | 'completed' | 'cancelled';
    notes?: string;
}

export interface Habit {
    id: string;
    name: string;
    description?: string;
    frequency: 'daily' | 'selected_days' | 'weekly';
    selectedDays: number[];
    targetValue?: number;
    unit?: string;
    startDate: string;
    reminderTime?: string;
    motivationMsg?: string;
    active: boolean;
}

export interface HabitCompletion {
    id: string;
    habitId: string;
    date: string;
    completed: boolean;
    value?: number;
    notes?: string;
}

export interface HabitWithCompletion extends Habit {
    completion: HabitCompletion | null;
}

export interface HabitStats {
    currentStreak: number;
    longestStreak: number;
    totalCompletions: number;
    completionRate7Days: number;
    completionRate30Days: number;
    earnedBadges: number[];
    recentCompletions: string[];
}

export interface HealthMeasurement {
    id: string;
    date: string;
    weight?: number;
    waist?: number;
    chest?: number;
    hip?: number;
    neck?: number;
    leftArm?: number;
    rightArm?: number;
    leftThigh?: number;
    rightThigh?: number;
    bodyFatPercentage?: number;
    bmi?: number;
    restingHeartRate?: number;
    systolicBp?: number;
    diastolicBp?: number;
    spo2?: number;
    bodyTemperature?: number;
    fastingGlucose?: number;
    notes?: string;
}

export interface DashboardData {
    today: string;
    workouts: {
        sessions: WorkoutSession[];
        count: number;
        completed: number;
    };
    meals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        water: number;
        count: number;
    };
    fasting: FastingSession | null;
    habits: {
        total: number;
        completed: number;
        score: number;
        list: HabitWithCompletion[];
    };
    measurement: {
        latest: HealthMeasurement | null;
        status: {
            daysSince: number;
            isOverdue: boolean;
            dueIn: number;
            overdueDays: number;
        } | null;
    };
    weeklyWorkoutCount: number;
}

export type ViewMode = 'dashboard' | 'workouts' | 'meals' | 'habits' | 'measurements' | 'calendar';
