import { readFileSync } from "fs";

type SymbolType = "method" | "field"

interface SyntaxSymbol {
    type: string,
}

enum LexerError {
    ExpectedToken,
}

type NodeType = 
    "stack" | // Instructions set
    "assign" | // l-value = r-value
    "lambda" | // Lambda creation
    "import" | // Import statement
    "include" | // Include directive
    "module" | // C++20 Module declaration
    "export" | // Export symbol from C++20 module
    "binary" | // Binary operations
    "call" | // Call method
    "namespace" | // Define namespace
    "declare" | // Declare symbol
    "new" | // New Type()
    "cast" | // C-Style cast: (TypeA*)(new TypeB())
    "return" // return x;

interface AbstractSyntaxTreeNode {
    type: NodeType
}

class InputReader {
    private buffer: string;
    private cursor: number = 0;

    constructor(path: string) {
        this.buffer = readFileSync(path).toString();
    }

    peek(forward: number = 0): string {
        return this.buffer.at(this.cursor+forward)!;
    }

    read() {
        let ret = this.buffer.at(this.cursor)!;
        this.cursor++;
        return ret;
    }

    eof(): boolean {
        return this.cursor >= (this.buffer.length - 1);
    }
}

// Lexer generates token list, useful for Crawler's module imports resolution
export class Lexer {
    reader: InputReader;

    tokens: string[] = [];

    constructor(path: string) {
        this.reader = new InputReader(path);

        this.Tokenize();
    }

    private submit(token: string) {
        if(token.length > 0 && !(/\s/.test(token))) {
            this.tokens.push(token);
        }
    }

    private Tokenize() {
        let curToken = "";
        while(this.reader.eof() == false) {
            let char = this.reader.read();

            // Strings or Characters are one token
            if(/[\"\']/.test(char)) {
                // Submit if anything was parsed before
                this.submit(curToken);
                
                let bracket = curToken = char;

                do {
                    char = this.reader.read();
                    curToken += char;
                }
                while(char != bracket);

                this.submit(curToken);
                curToken = "";
            } 
            // Pointers or References are unique tokens
            else if(/[\*\&]]/.test(char)) {
                this.submit(curToken);

                curToken = char;

                let nextChar = this.reader.peek();
                if(/=/.test(nextChar)) {
                    curToken += nextChar;
                    this.reader.read();
                }

                this.submit(curToken);
                curToken = "";
            } 
            // Any whitespace separate tokens
            else if(/\s/.test(char)) {
                this.submit(curToken);
                curToken = "";
            } 
            // Brackets, Semicolons or Commas are unique tokens
            else if (/[,;\(\)\[\]\{\}]/.test(char)) {
                this.submit(curToken);
                this.submit(char);
                curToken = "";
            } 
            // Period is an accessor token
            else if(/\./.test(char)) {
                this.submit(curToken);
                this.submit(char);
                curToken = "";
            } 
            // Minus may be start of arrow accessor token
            else if (/-/.test(char)) {
                this.submit(curToken);

                let nextChar = this.reader.peek();
                if(/>/.test(nextChar)) {
                    this.submit('->');
                    this.reader.read();
                } else {
                    this.submit(char);
                }

                curToken = "";
            }
            // Math Operations (+, /, %, |)
            else if (/[+\/%\|]/.test(char)) {
                this.submit(curToken);

                curToken = char;

                let nextChar = this.reader.peek();
                if(/=/.test(nextChar)) {
                    curToken += nextChar;
                    this.reader.read();
                }

                this.submit(curToken);
                curToken = "";
            }
            // Math Operations (+, /, %, =, |)
            else if (/=/.test(char)) {
                this.submit(curToken);

                curToken = char;

                let nextChar = this.reader.peek();
                if(/[=<>]/.test(nextChar)) {
                    curToken += nextChar;
                    this.reader.read();
                }

                this.submit(curToken);
                curToken = "";
            }
            // Potentional namespace accessor or module partition separator
            else if (/:/.test(char)) {
                let nextChar = this.reader.peek();
                if(/:/.test(nextChar)) {
                    this.submit(curToken);

                    this.reader.read();

                    this.submit('::');

                    curToken = "";
                } else {
                    curToken += char;
                }
            }
            // Compare Operations (<, >)
            else if (/[<>]/.test(char)) {
                this.submit(curToken);

                curToken = char;

                let nextChar = this.reader.peek();
                if((nextChar == char) || (/=/.test(nextChar))) {
                    curToken += nextChar;
                    this.reader.read();
                    
                } 
                
                this.submit(curToken);
                curToken = "";
            }
            // Plain token
            else {
                curToken += char;
            }
        }

        this.submit(curToken);
    }

    peek(forward: number = 0) {
        
    }

    read(forward: number = 0) {
        
    }
}

// Parser generates Abstract Syntax Tree, useful for module tool
export default class Parser {

    Parse(path: string) {
        

        return ;
    }
}