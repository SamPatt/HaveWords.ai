import { RootType } from "./parsedRollTypes";
import { RollBase } from "./rollTypes";
export declare class DiceRoller {
    randFunction: () => number;
    maxRollCount: number;
    /**
     * The DiceRoller class that performs parsing and rolls of {@link https://wiki.roll20.net/Dice_Reference roll20 format} input strings
     * @constructor
     * @param randFunction The random number generator function to use when rolling, default: Math.random
     * @param maxRolls The max number of rolls to perform for a single die, default: 1000
     */
    constructor(randFunction?: () => number, maxRolls?: number);
    /**
     * Parses and returns an representation of a dice roll input string
     * @param input The input string to parse
     * @returns A {@link RootType} object representing the parsed input string
     */
    parse(input: string): RootType;
    /**
     * Parses and rolls a dice roll input string, returning an object representing the roll
     * @param input The input string to parse
     * @returns A {@link RollBase} object representing the rolled dice input string
     */
    roll(input: string): RollBase;
    /**
     * Parses and rolls a dice roll input string, returning the result as a number
     * @param input The input string to parse
     * @returns The final number value of the result
     */
    rollValue(input: string): number;
    /**
     * Rolls a previously parsed dice roll input string, returning an object representing the roll
     * @param parsed A parsed input as a {@link RootType} string to be rolled
     * @returns A {@link RollBase} object representing the rolled dice input string
     */
    rollParsed(parsed: RootType): RollBase;
    private rollType;
    private rollDiceExpr;
    private rollGroup;
    private rollDie;
    private rollExpression;
    private rollFunction;
    private applyGroupMod;
    private getGroupModMethod;
    private applyMod;
    private getModMethod;
    private applySort;
    private getCritSuccessMethod;
    private getCritFailureMethod;
    private getSuccessMethod;
    private getFailureMethod;
    private getKeepMethod;
    private getDropMethod;
    private getExplodeMethod;
    private getCompoundMethod;
    private getPenetrateMethod;
    private getReRollMethod;
    private getReRollOnceMethod;
    private successTest;
    private reRoll;
    private generateDiceRoll;
    private generateFateRoll;
}
