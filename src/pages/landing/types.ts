export type MockupTab = 'employee' | 'trainer' | 'lms';
export type ScenarioStep = 'dilemma' | 'pathA' | 'pathB' | 'quiz';

export interface LandingPageProps {
  onEnter: () => void;
}

export interface FaqItem {
  q: string;
  a: string;
}
