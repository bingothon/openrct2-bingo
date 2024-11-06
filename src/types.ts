export type Goal = {
    name: string;
    slot: string | undefined;
    colors: string;
    status: "completed" | "incomplete";
    checkCondition: () => boolean;
  };
  
export type BingoSyncBoardData = {
    name: string;
    slot: string;
    colors: string;
  };
  
export type BingoBoard = Goal[];

