import { showMemeWheel } from './memeWheel.js';

export function maybeTriggerMemeWheel(view) {
  const isStudent = localStorage.getItem('role') === 'student';
  const hasSpun = sessionStorage.getItem('memeWheelUsed');

  const isStudentDashboard = view === 'dashboard_student';

  if (isStudent && isStudentDashboard && !hasSpun) {
    const randomDelay = 1000 + Math.floor(Math.random() * 7000); // tussen 1s en 8s
    setTimeout(() => {
      showMemeWheel();
      sessionStorage.setItem('memeWheelUsed', 'true');
    }, randomDelay);
  }
}
