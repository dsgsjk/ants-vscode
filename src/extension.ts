import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	let helloWorldCmd = vscode.commands.registerCommand(`ants.helloWorld`, () => {
		vscode.window.showInformationMessage('Hello World!');
	});
	
	let restartCmd = vscode.commands.registerCommand(`ants.restart`, async () => {
		await stopClient();
		startClient(context);
	});

	let initCmd = vscode.commands.registerCommand(`ants.init`, () => {
		let terminal = vscode.window.createTerminal("Terminal");
		terminal.sendText("ants init");
	});

	let newCmd = vscode.commands.registerCommand(`ants.new`, async () => {
		let title = await vscode.window.showInputBox({placeHolder: "Title"});
		let dir = await vscode.window.showInputBox({placeHolder: "Directory"});
		let terminal = vscode.window.createTerminal("Terminal");
		terminal.sendText(`ants new -t ${title} ${dir}`);
		console.log(`ants new -t ${title} ${dir}`);
	});

	context.subscriptions.push(
		helloWorldCmd,
		restartCmd,
		initCmd,
		newCmd
	);

	startClient(context)
}

export async function deactivate() {
	await stopClient()
}

function startClient(context: ExtensionContext) {
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run: { command: "ants-ls", args: [] },
		debug: { command: "ants-ls", args: [] }
	};

	let clientOptions: LanguageClientOptions = {
		documentSelector: [{ scheme: 'file', language: 'markdown' }],
	};

	client = new LanguageClient("ants", "ants", serverOptions, clientOptions);

	context.subscriptions.push(client.start());
}

async function stopClient() {
	if (!client) return;

	await client.stop();
}
