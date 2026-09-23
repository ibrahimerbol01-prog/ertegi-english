export interface Story {
  id: string;
  title: string;
  sceneLabel: string;
  storyDesc: { en: string; kk: string };
  choicePrompt: string;
  choiceOptionA: string;
  choiceOptionB: string;
  levels: {
    A1: string;
    A2: string;
    B1: string;
    B2: string;
    C1: string;
  };
  quizQuestions: Array<{
    type: string;
    q: string;
    options: string[];
    correct: number;
    sentence?: string;
  }>;
}

export interface SavedWord {
  word: string;
  translation: string;
  reviewCount?: number;
}

export interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  check: (state: any) => boolean;
}
