export type Team = {
  id: string;
  name: string;
  startingScore?: number;
};

export type Rule = {
  id: string;
  title: string;
  text: string;
};

export type Task = {
  id: string;
  title: string;
  parts: string[];
};

export type RuntimeTeam = Team & {
  score: number;
};

export type View = "home" | "rules" | "setup" | "board" | "task";
