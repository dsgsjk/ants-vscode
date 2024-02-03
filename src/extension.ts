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

	context.subscriptions.push(
		helloWorldCmd,
		restartCmd
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
		run: { command: "ants", args: ["lsp"] },
		debug: { command: "ants", args: ["lsp", "--log"] }
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
