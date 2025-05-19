import fs from "node:fs/promises";
import ollama from "ollama";

/**
 * 指定ファイルの内容を読み込み、Ollama で続きを生成して出力する
 */

(async () => {
	const filePath = process.argv[2];
	if (!filePath) {
		console.error("Usage: node generate.js <inputfile>");
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
	console.log(response);
})();
