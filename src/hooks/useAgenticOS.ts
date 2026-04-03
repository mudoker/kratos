import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { haptics, speak } from '../lib/ui/feedback';

export const useAgenticOS = (hrs: number) => {
  const { setAgenticNotification } = useAppStore();

  useEffect(() => {
    // 1. Proactive Readiness Intervention
    if (hrs > 0 && hrs < 60) {
      haptics.warning();
      speak("Recovery score critical. I've flagged today as an active recovery day. Suggesting a 20% volume drop.");
      setAgenticNotification({
        id: 'recovery-protocol',
        type: 'CRITICAL',
        title: 'Recovery Protocol Active',
        message: 'Your CNS fatigue is high. Heavy compounds have been blocked from today\'s session.',
        action: 'Accept Protocol'
      });
    }

    // 2. Nutrition Accountability (Mock check)
    const hour = new Date().getHours();
    if (hour >= 14 && hour < 15) {
      // Simulate checking if calories logged today < 500
      setAgenticNotification({
        id: 'nutrition-ping',
        type: 'INFO',
        title: 'Missing Fuel Data',
        message: 'It is 2:00 PM. No significant intake detected. Log your lunch to keep trajectory accurate.',
        action: 'Log Now'
      });
    }
  }, [hrs, setAgenticNotification]);
};
