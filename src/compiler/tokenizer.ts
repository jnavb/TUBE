import { Token } from '../models';
import {
  ARGUMENT,
  ARROW,
  A_TO_Z_AND_DOT,
  BREAK_LINE,
  COLON,
  DEFAULT,
  DEFER,
  DOUBLE_COLON,
  FLIP,
  NEGATION,
  NEW_LINE,
  NUMBERS_AND_DOT,
  TAB,
  UNION,
  VARIADIC,
  WHITESPACE,
  WRAP
} from '../models/keywords';

export const tokenizer = (input: string): Token[] => {
  let succedingFunctionTokens = new Set([
    'Function',
    'String',
    'Number',
    'Variable',
    'Variadic',
  ]);

  let level = 0;
  let line = 0;
  let lineFirstCharIndex = 0;
  let argumentPos = null;

  let current = 0;
  let tokens: Token[] = [];

  try {
    while (current < input.length) {
      let LAST_TOKEN = tokens[tokens.length - 1];

      let char = input[current];
      let nextChar = input[current + 1] || '';
      let nextOfNextChar = input[current + 2] || '';
      let nextOfNextCharOfNextChar = input[current + 3] || '';

      let twoLetterWord = char + nextChar;
      let threeLetterWord = char + nextChar + nextOfNextChar;
      let fourLetterWord =
        char + nextChar + nextOfNextChar + nextOfNextCharOfNextChar;

      // Disable auto currying
      if (VARIADIC.test(threeLetterWord)) {
        current = current + 3;
        tokens.push({
          type: 'Variadic',
        });

        continue;
      }

      // Disable auto currying
      if (FLIP.test(fourLetterWord)) {
        current = current + 4;
        tokens.push({
          type: 'Flip',
        });

        continue;
      }

      // Method
      if (DOUBLE_COLON.test(char + nextChar)) {
        current++;
        char = input[++current];

        let value = '';

        if (WHITESPACE.test(char)) {
          throw new SyntaxError(
            `Method invocation not allowed with empty spaces after '::'`,
          );
        }

        while (A_TO_Z_AND_DOT.test(char)) {
          value += char;
          char = input[++current];
        }

        tokens.push({
          type: 'Method',
          value,
        });
        continue;
      }

      // Pipe declaration
      if (ARROW.test(twoLetterWord)) {
        current = current + 2;
        tokens.push({
          type: 'Arrow',
        });

        continue;
      }

      // Union
      if (UNION.test(char) && WHITESPACE.test(nextChar)) {
        current++;
        char = input[++current];

        if (level !== 1) {
          throw new SyntaxError(`Invalid indentation for a union clause`);
        }

        if (WHITESPACE.test(char)) {
          throw new SyntaxError(
            `Union statement not allowed with more than one space after union keyword U`,
          );
        }

        tokens.push({
          type: 'Union',
        });

        continue;
      }

      // If/else, Switch
      if (COLON.test(char)) {
        char = input[++current];

        if (level === 0) {
          throw new SyntaxError(`Invalid indentation for a conditional clause`);
        }

        if (!WHITESPACE.test(char)) {
          throw new SyntaxError(
            `Brancher invocation not allowed without one space after brancher declaration`,
          );
        }

        char = input[++current];

        if (WHITESPACE.test(char)) {
          throw new SyntaxError(
            `Brancher invocation not allowed with more than one space after brancher declaration`,
          );
        }

        let value = '';

        while (A_TO_Z_AND_DOT.test(char)) {
          value += char;
          char = input[++current];
        }

        nextChar = input[current + 1];
        const isIfElseClause = NEW_LINE.test(char) || !COLON.test(nextChar);
        if (isIfElseClause) {
          tokens.push({
            type: 'Function',
            value,
          });
          continue;
        }

        // Switch clause

        current++;
        char = input[++current];

        if (!WHITESPACE.test(char)) {
          throw new SyntaxError(
            `Switch clause not allowed without one space after case declaration`,
          );
        }

        // TODO case is a reserved keyword in js, change it
        const _case = value;
        value = '';
        char = input[++current];

        while (A_TO_Z_AND_DOT.test(char)) {
          value += char;
          char = input[++current];
        }

        const type = DEFAULT.test(_case) ? 'DefaultSwitchCase' : 'SwitchCase';

        tokens.push({
          type,
          case: _case,
          value,
        });

        continue;
      }

      // Indentation
      if (NEW_LINE.test(char)) {
        let lines = 1;
        char = input[++current];

        while (NEW_LINE.test(char)) {
          lines++;
          char = input[++current];
        }

        let whitespaces = 0;
        let tabs = 0;
        while (WHITESPACE.test(char)) {
          if (TAB.test(char)) {
            tabs++;
          } else {
            whitespaces++;
          }
          char = input[++current];
        }

        if (whitespaces % 4 === 0 || tabs) {
          level = whitespaces / 4 || tabs;
        } else {
          throw new SyntaxError(`Incorrect indenting format`);
        }

        line++;
        lineFirstCharIndex = current;

        if (lines === 1) {
          tokens.push({
            type: 'NewLine',
            level,
          });
        } else {
          tokens.push({
            type: 'EmptyLine',
          });
        }

        continue;
      }

      if (WHITESPACE.test(char)) {
        current++;
        continue;
      }

      // Side effect: < fn >
      if (char === '<') {
        current++;
        char = input[++current];

        if (WHITESPACE.test(char)) {
          throw new SyntaxError(`Side effect call format not allowed`);
        }

        let value = '';
        while (A_TO_Z_AND_DOT.test(char)) {
          value += char;
          char = input[++current];
        }

        char = input[++current];

        if (WHITESPACE.test(char)) {
          throw new SyntaxError(`Side effect call format not allowed`);
        }

        if (char === '>') {
          tokens.push({
            type: 'SideEffect',
            value,
          });
          current++;
          continue;
        } else {
          throw new SyntaxError(`Side effect clause not closed`);
        }
      }

      // Number
      if (NUMBERS_AND_DOT.test(char)) {
        let value = '';

        while (NUMBERS_AND_DOT.test(char)) {
          value += char;
          char = input[++current];
        }

        tokens.push({
          type: 'Number',
          value,
        });
        continue;
      }

      // String
      if (char === "'") {
        let value = '';
        char = input[++current];

        while (char !== "'") {
          value += char;
          char = input[++current];
        }

        current++;

        tokens.push({
          type: 'String',
          value,
        });

        continue;
      }

      // Function, Negation and Argument
      if (A_TO_Z_AND_DOT.test(char) || NEGATION.test(char)) {
        let value = '';

        while (A_TO_Z_AND_DOT.test(char) || NEGATION.test(char)) {
          value += char;
          char = input[++current] || BREAK_LINE;
        }

        if (NEGATION.test(value)) {
          if (LAST_TOKEN.type === 'Negation') {
            throw new SyntaxError(
              `More than one sucesive negation not allowed`,
            );
          }

          tokens.push({
            type: 'Negation',
          });
        } else if (DEFER.test(value)) {
          tokens.push({
            type: 'Defer',
          });
        } else if (WRAP.test(value)) {
          tokens.push({
            type: 'Wrap',
          });
        } else if (ARGUMENT.test(value)) {
          argumentPos = tokens.length;

          continue;
        } else if (succedingFunctionTokens.has(LAST_TOKEN?.type)) {
          tokens.push({
            type: 'Variable',
            value,
          });
        } else {
          tokens.push({
            type: 'Function',
            value,
          });
        }

        continue;
      }

      throw new SyntaxError(`Unable to parse character '${char}'`);
    }
  } catch ({ message }) {
    throw new SyntaxError(
      `Line ${line} Char ${current - lineFirstCharIndex} 🔴 ${message}`,
    );
  }

  return tokens;
};
