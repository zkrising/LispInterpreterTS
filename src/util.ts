import * as readline from "node:readline";

const readlineInterface = readline.createInterface({
	input: process.stdin,
	output: process.stdout,
});

export function read(prompt: string) {
	return new Promise<string>((resolve) => {
		readlineInterface.question(prompt.endsWith(" ") ? prompt : `${prompt} `, (ans) => {
			resolve(ans);
		});
	});
}
