/* eslint-disable no-console */
import { read } from "./util";

interface LispExprSymbol {
	type: "SYMBOL";
	value: string;
}

interface LispExprLiteral {
	type: "LITERAL";
	value: string;
}

interface LispExprFloat {
	type: "FLOAT";
	value: number;
}

interface LispExprList {
	type: "LIST";
	value: Array<LispExpr>;
}

interface LispExprFn {
	type: "FN";
	value: (...args: Array<LispExpr>) => LispExpr;
}

interface LispExprNull {
	type: "NULL";
	value: null;
}

const NULL_EXPR: LispExprNull = {
	type: "NULL",
	value: null,
};

interface LispExprMap {
	FN: LispExprFn;
	FLOAT: LispExprFloat;
	SYMBOL: LispExprSymbol;
	LIST: LispExprList;
	NULL: LispExprNull;
	LITERAL: LispExprLiteral;
}

type LispExprTypes = keyof LispExprMap;

type LispExpr<T extends LispExprTypes = LispExprTypes> = LispExprMap[T];

class LispErr extends Error {}

type LispEnv = Map<string, LispExpr>;

function tokenise(str: string) {
	return str
		.replace(/\(/gu, " ( ")
		.replace(/\)/gu, " ) ")
		.split(/ +/gu)
		.filter((e) => e !== "");
}

function readSequence(tokens: Array<string>): { expr: LispExpr; tokens: Array<string> } {
	const res: Array<LispExpr> = [];
	let xs = tokens;

	while (true) {
		const [nextToken, ...rest] = xs;

		if (nextToken === ")") {
			return {
				expr: { type: "LIST", value: res },
				tokens: rest,
			};
		}

		const { expr, tokens: newTokens } = parse(xs);

		res.push(expr);
		xs = newTokens;
	}
}

function parse(tokens: Array<string>): { expr: LispExpr; tokens: Array<string> } {
	const [base, ...rest] = tokens;

	if (!base) {
		throw new LispErr(`could not get token?`);
	}

	if (base === "(") {
		return readSequence(rest);
	} else if (base === ")") {
		throw new LispErr(`Unexpected ')'`);
	}

	return {
		expr: parseAtom(base),
		tokens: rest,
	};
}

function parseAtom(token: string): LispExpr {
	// probably a number
	if (/^[0-9]/u.exec(token)) {
		return {
			type: "FLOAT",
			value: Number(token),
		};
	}

	if (token.startsWith("'")) {
		let literalName = "";

		const [_first, ...otherTokens] = token;

		for (const char of otherTokens) {
			if (char === "'") {
				return {
					type: "LITERAL",
					value: literalName,
				};
			}

			literalName = literalName + char;
		}

		throw new Error(`Expected quote.`);
	}

	return {
		type: "SYMBOL",
		value: token,
	};
}

function parseAssert<T extends LispExpr["type"]>(token: string, type: T): LispExprMap[T] {
	const expr = parseAtom(token);

	return assert(expr, type);
}

function assert<T extends LispExprTypes>(expr: LispExpr, type: T): LispExprMap[T] {
	if (expr.type !== type) {
		throw new LispErr(`Expected '${type}', got '${expr.type}'.`);
	}

	return expr as LispExprMap[T];
}

function evalExpr(expr: LispExpr, env: LispEnv): LispExpr {
	switch (expr.type) {
		case "FLOAT":
		case "LITERAL":
			return expr;

		case "SYMBOL": {
			const pointedAtExpr = env.get(expr.value);

			if (pointedAtExpr === undefined) {
				throw new Error(
					`Attempted to access variable '${expr.value}', but it is not defined.`
				);
			}

			return pointedAtExpr;
		}

		case "LIST": {
			const [head, ...rest] = expr.value;

			if (!head) {
				// breaks skateboard
				throw new LispErr(`Expected atleast one item in list`);
			}

			const maybeFn = evalExpr(head, env);

			if (maybeFn.type !== "FN") {
				throw new LispErr(`Expected first element in a list to be a function.`);
			}

			return maybeFn.value(...rest.map((ex) => evalExpr(ex, env)));
		}

		case "FN":
			throw new LispErr("Unexpected function.");

		case "NULL":
			throw new LispErr("Cannot evaluate null.");
	}
}

function mkFunc(fn: LispExprFn["value"]): LispExprFn {
	return {
		type: "FN",
		value: fn,
	};
}

function addFunc(name: string, fn: LispExprFn["value"]) {
	defaultEnv.set(name, mkFunc(fn));
}

const defaultEnv: LispEnv = new Map();

addFunc("+", (...args) => {
	const floats = args.map((e) => assert(e, "FLOAT"));
	const sum = floats.reduce((a, e) => a + e.value, 0);

	return {
		type: "FLOAT",
		value: sum,
	};
});

addFunc("-", (...args) => {
	const floats = args.map((e) => assert(e, "FLOAT"));
	const sum = floats.reduce((a, e) => a - e.value, 0);

	return {
		type: "FLOAT",
		value: sum,
	};
});

addFunc("def", (...args) => {
	const nameExpr = args[0];
	const value = args[1];

	if (nameExpr === undefined || value === undefined) {
		throw new Error(`def takes two arguments, str and value`);
	}

	const name = assert(nameExpr, "LITERAL");

	defaultEnv.set(name.value, value);

	return value;
});

addFunc("echo", (expr) => {
	return evalExpr(expr, defaultEnv);
});

addFunc("env", () => {
	for (const [key, expr] of defaultEnv.entries()) {
		console.log(`${key} = (${expr.type}, ${expr.type === "FN" ? "..." : expr.value})`);
	}

	return NULL_EXPR;
});

function parseEval(str: string) {
	const tokens = tokenise(str);
	const { expr } = parse(tokens);

	return evalExpr(expr, defaultEnv);
}

async function repl() {
	while (true) {
		// eslint-disable-next-line no-await-in-loop
		const str = await read("Lisp >");

		console.log(parseEval(str));
	}
}

if (require.main === module) {
	void repl();
}
