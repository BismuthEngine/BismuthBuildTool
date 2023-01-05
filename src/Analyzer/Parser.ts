
type SymbolType = "method" | "field"

interface SyntaxSymbol {
    type: string,
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

    peek(forward: number = 0) {
        
    }

    read(forward: number = 0) {
        
    }
}

// Lexer generates token list, useful for Crawler's module imports resolution
export class Lexer {

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