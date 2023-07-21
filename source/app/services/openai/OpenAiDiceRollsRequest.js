"use strict";

/* 
    OpenAiDiceRollsRequest

*/

(class OpenAiDiceRollsRequest extends OpenAiService {
  async asyncFetch () {
    const request = OpenAiRequest.clone();
    request.setApiUrl("https://api.openai.com/v1/chat/completions");
    request.setApiKey(this.apiKey());
    request.setService(this);

    let messages = OpenAiChat.shared().conversationHistory().slice(1);

    console.log("messages:");
    console.log(messages);
    console.trace()

    messages.unshift({
      "role": "system", 
      "content": `You are an expert in the D&D5e ruleset.

  You will be presented with a conversation between a dungeon/game master and a party of players that control characters.

  Your job is to decide which dice rolls should be made at the current point in the adventure.

  Use the last message made by the dungeon master as your primary criteria, but also consider previous messages by the players, including those that contain their character sheets.
  The dice rolls could apply to a player character, a non-player character, or the DM, so don't forget to consider every character in the scene, including non-player characters and monsters. This especially applies to initiative rolls.
  Some scenarios might not require any dice rolls.

  As a reminder, here are a number of scenarios that require dice rolls in the 5e ruleset:
  - Ability Checks: These determine whether a character succeeds in a task, such as climbing a wall (Strength check), recalling information (Intelligence check), or telling a lie convincingly (Charisma check). The player rolls a 20-sided die (d20) and adds their ability modifier.
  - Saving Throws: These are like ability checks, but they're typically reactive and determine whether a character resists or avoids certain effects, like spells or traps. The roll is again a d20 plus the relevant ability modifier.
  - Attack Rolls: When a character tries to hit an enemy, they roll a d20 and add their attack bonus. If the total equals or exceeds the target's Armor Class, the attack hits.
  - Damage Rolls: After a successful attack, the player rolls dice to determine the amount of damage dealt. The type and number of dice rolled depends on the weapon or spell used.Hit Points (HP): When a character levels up or is first created, dice are rolled to determine their maximum hit points. The type of die depends on the character's class.
  - Death Saving Throws: When a character's hit points drop to zero, they must make death saving throws to avoid dying. A d20 is rolled, with results of 10 or higher counting as successes and results below 10 counting as failures.
  - Spellcasting: Many spells require dice rolls to determine their effects, such as the amount of damage dealt or healed, or the duration of an effect.
  - Initiative: At the start of combat, each character rolls for initiative to determine the order in which they act. This is a d20 roll plus the character's Dexterity modifier.
  - Magic Item Generation: Dungeon Masters (DMs) often roll dice to determine what magic items are found in treasure hoards.
  - Random Encounters: DMs can use dice rolls to determine random encounters or events.
  - Skill Checks: Similar to ability checks, but tied to specific skills like Perception, Stealth, or Persuasion. These involve rolling a d20 and adding both the relevant ability modifier and proficiency bonus, if the character is proficient in the skill.
  - Character Creation: Beyond hit points, dice can be used in character creation to randomly determine ability scores. Many players also use dice to randomly select aspects of their characters' backgrounds or traits.
  - Healing: When a character uses a spell or ability to heal, dice are often rolled to determine the amount of hit points restored.
  - Conditions: Some conditions like Confusion or the Wild Magic Sorcerer's Wild Magic Surge require dice rolls to determine specific effects.
  - Loot Generation: DMs often use dice to determine the quantity and type of loot or treasure a party discovers.
  - Determining Direction or Random Events: Dice can be used to determine a variety of random factors, from which way a lost party travels to what minor event happens in the night.

  The dice rolls should include the following information:
  - character (name of the character)
  - die (the die to roll)
  - count (the number of dice to roll)
  - modifier (the modifier/bonus that will be added to the roll)
  - target (the number that has to be reached for the roll to be considered successful)
  - type (normal, advantage, disadvantage)
  You should describe your decision by calling the 'dice_rolls' function.`
    });

    request.setBodyJson({
      model: "gpt-3.5-turbo-0613",
      messages: messages,
      function_call: { name: "dice_rolls" },
      functions: [
        {
          "name": "dice_rolls",
          "description": "The dice_rolls function describes the dice rolls that should be made at the current point in a D&D adventure.",
          "parameters": {
            "type": "object",
            "properties": {
              "rolls": {
                "type": "array",
                "description": "An array containing the rolls that should be made. If no rolls should be made, this property should be an empty array.",
                "items": {
                  "type": "object",
                  "description": "An object specifying a dice roll that should be made.",
                  "properties": {
                    "character": {
                      "type": "string",
                      "description": "The name of the character that the roll applies to. It can be a player character, a non-player character(s) or event the DM."
                    },
                    "reason": {
                      "type": "string",
                      "description": "A short description of the reason that the DM requested the roll.",
                      "enum": ["Ability Check", "Saving Throw", "Attack Roll", "Damage Roll", "Death Saving Throw", "Spell Effect", "Initiative", "Magic Item Generation", "Random Encounter", "Skill Check", "Healing", "Condition Effect", "Loot Generation", "Other Dice Roll"]
                    },
                    "die": {
                      "type": "integer",
                      "enum": [4, 6, 8, 10, 12, 20, 100],
                      "description": "The die number that the character should roll"
                    },
                    "num": {
                      "type": "integer",
                      "minimum": 1,
                      "description": "The number of dice the character should roll"
                    },
                    "mod": {
                      "type": "integer",
                      "description": "(optional) The modifier that the character should apply to the roll. Omit this property entirely if the value is 0."
                    },
                    "target": {
                      "type": "integer",
                      "description": "(optional) The total that constitutes success for the roll. Omit this property entirely if the value is 0."
                    },
                    "type": {
                      "type": "string",
                      "description": "Describes the type of roll (normal, advantage, disadvantage)",
                      "enum": ["normal", "advantage", "disadvantage"]
                    }
                  },
                  "required": ["name", "reason", "die", "num", "type"]
                }
              }
            },
            "required": ["rolls"]
          }
        }
      ]
    });

    const json = await request.asyncSend();

    if (json.error) {
      const errorMessage = this.type() + " fetch ERROR: " + json.error.message;
      console.error(errorMessage);
      return null;
    }
    else {
      return json.choices[0].message;
    }
  }
}.initThisClass());
