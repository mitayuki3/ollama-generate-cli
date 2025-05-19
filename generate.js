import fs from "node:fs/promises";
import ollama from "ollama";

/**
 * 指定ファイルの内容を読み込み、Ollama で続きを生成して出力する
 * -i オプションがある場合、生成結果を入力ファイルの末尾に追記する
 */

(async () => {
	const args = process.argv.slice(2);
	const inplace = args.includes("-i");
	const filePath = args.find((arg) => arg !== "-i");
	if (!filePath) {
		console.error("Usage: node generate.js [-i] <inputfile>");
		process.exit(1);
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
	});
	const output = response?.response;
	if (!output) {
		console.error("Fatal error: response = %s", output);
	}
	if (inplace) {
		try {
			await fs.appendFile(filePath, output);
		} catch (err) {
			console.error("ファイルへの追記に失敗しました:", err);
			process.exit(1);
		}
	} else {
		console.log(output);
	}
})();
