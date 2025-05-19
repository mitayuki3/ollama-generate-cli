import fs from "node:fs/promises";
import ollama from "ollama";
import { Command } from "commander";

/**
 * 指定ファイルの内容を読み込み、Ollama で続きを生成して出力する
 * -a オプションがある場合、生成結果を入力ファイルの末尾に追記する
 */

function printUsageAndExit() {
	console.error(
		"Usage: node generate.js [--system <systemfile>] [-i] <inputfile>",
	);
	process.exit(1);
}

(async () => {
	const program = new Command();
	program
		.argument("<inputfile>", "入力ファイル")
		.option("-a, --append", "生成結果を入力ファイルの末尾に追記する")
		.option("--system <systemfile>", "システムメッセージファイル")
		.showHelpAfterError();

	program.parse(process.argv);
	const opts = program.opts();
	const filePath = program.args[0];
	const append = opts.append || false;
	const systemFile = opts.system;

	if (!filePath) {
		printUsageAndExit();
	}

	let systemMessage = undefined;
	if (systemFile) {
		try {
			systemMessage = await fs.readFile(systemFile, "utf-8");
		} catch (err) {
			console.error("システムメッセージファイルの読み込みに失敗しました:", err);
			process.exit(1);
		}
	}

	let input;
	try {
		input = await fs.readFile(filePath, "utf-8");
	} catch (err) {
		console.error("ファイルの読み込みに失敗しました:", err);
		process.exit(1);
	}
	const response = await ollama.generate({
		model: "gemma3:12b",
		prompt: input,
		stream: false,
		keep_alive: "15m",
		...(systemMessage ? { system: systemMessage } : {}),
	});
	const output = response?.response;
	if (!output) {
		console.error("Fatal error: response = %s", output);
	}
	if (append) {
		try {
			await fs.appendFile(filePath, `${output}\r\n`);
		} catch (err) {
			console.error("ファイルへの追記に失敗しました:", err);
			process.exit(1);
		}
	} else {
		console.log(output);
	}
})();
