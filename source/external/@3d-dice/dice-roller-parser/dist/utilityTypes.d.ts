/** A helper type representing the valid operations for a math operation on a group of dice. */
export declare type DiceGroupMathOperation = "+" | "-";
/** A helper type representing the valid operations for a math operation. */
export declare type MathOperation = "+" | "-" | "*" | "/" | "%" | "**";
/** A helper type representing the valid operations for a math operation. */
export declare type MathFunction = "floor" | "ceil" | "round" | "abs";
/** A helper type used when marking a roll as a critical success or failure */
export declare type CriticalType = "success" | "failure" | null;
/** A helper type for the available operations for a comparison point */
export declare type CompareOperation = ">" | "<" | "=";
/** A helper type used to determine which rolls to keep or drop */
export declare type HighLowType = "h" | "l" | null;
