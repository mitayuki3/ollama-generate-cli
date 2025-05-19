import fs from "node:fs/promises";
import ollama from "ollama";

/**
 * 指定ファイルの内容を読み込み、Ollama で続きを生成して出力する
 * -i オプションがある場合、生成結果を入力ファイルの末尾に追記する
 */

(async () => {
	const args = process.argv.slice(2);
	const inplace = args.includes("-i");
	const systemIdx = args.indexOf("--system");
	let systemMessage = undefined;
	let filePath;
	if (systemIdx !== -1) {
		const sysFile = args[systemIdx + 1];
		if (!sysFile) {
			printUsageAndExit();
		}
		try {
			systemMessage = await fs.readFile(sysFile, "utf-8");
		} catch (err) {
			console.error("システムメッセージファイルの読み込みに失敗しました:", err);
			process.exit(1);
		}
		filePath = args.find(
			(arg, i) => i !== systemIdx && i !== systemIdx + 1 && arg !== "-i",
		);
	} else {
		filePath = args.find((arg) => arg !== "-i");
	}
	if (!filePath) {
		printUsageAndExit();
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
	if (inplace) {
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

/**
 * コマンドの使い方を標準エラー出力に表示し、プロセスを終了する
 */
function printUsageAndExit() {
	console.error(
		"Usage: node generate.js [--system <systemfile>] [-i] <inputfile>",
	);
	process.exit(1);
}
