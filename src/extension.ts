import * as vscode from 'vscode';
import { workspace, ExtensionContext } from 'vscode';
import { exec } from 'child_process';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions
} from 'vscode-languageclient/node';

let client: LanguageClient;

export async function activate(context: ExtensionContext) {
	const folder = vscode.window.activeTextEditor ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor.document.uri) : undefined;
	const path = folder ? folder.uri.fsPath : undefined;

	let helloWorldCmd = vscode.commands.registerCommand(`ants.helloWorld`, () => {
		vscode.window.showInformationMessage('Hello World!');
	});
	
	let restartCmd = vscode.commands.registerCommand(`ants.restart`, async () => {
		await stopClient();
		startClient(context);
	});

	let initCmd = vscode.commands.registerCommand(`ants.init`, () => {
		exec(`ants init`, { cwd: path }, (error, stdout, stderr) => {});
	});


	let newCmd = vscode.commands.registerCommand(`ants.new`, async () => {
		let title = await vscode.window.showInputBox({placeHolder: "Title"});
		if(title === undefined) {
			return;
		}
		if(title === '') {
			vscode.window.showErrorMessage('empty title');
			return;
		}
		

		let dir = await vscode.window.showInputBox({placeHolder: "Directory"});
		if(dir === undefined) {
			return;
		}

		if(dir === '') {
			vscode.window.showErrorMessage('empty directory');
			return;

		}
		
		exec(`ants new -t ${title} ${dir}`, { cwd: path }, (error, stdout, stderr) => {});

	});
	
	let filterCmd = vscode.commands.registerCommand(`ants.filter`, async () => {
		const panel = vscode.window.createWebviewPanel(
			'Filter',
			'Filter',
			vscode.ViewColumn.Beside,
			{
				enableScripts : true
			}
		);

		
		panel.webview.html = `
			<!DOCTYPE html>

			<html>
			<head>
				<meta charset="UTF-8">
				<title>File Search</title>
			</head>

			<body>
	 			<input type="text" id="author" placeholder="Author"><br>
				<input type="text" id="date" placeholder="Date"><br>
				<input type="text" id="description" placeholder="Description"><br>
				<input type="text" id="tag" placeholder="Tag"><br>
				<input type="text" id="content" placeholder="Content"><br>
				<input type="text" id="has_link" placeholder="Has link"><br>
				Sort by:<br>
				<input type="radio" id="sort_default" name="option" checked>
				<label for="sort_default">Default</label><br>
				<input type="radio" id="sort_title" name="option" value="title">
				<label for="sort_title">Title</label><br>
				<input type="radio" id="sort_author" name="option" value="author">
				<label for="sort_author">Author</label><br>
				<input type="radio" id="sort_time" name="option" value="time">
				<label for="sort_time">Time</label><br>
				
				<ul id="searchResults"></ul>

				<script>

					const vscode = acquireVsCodeApi(); // Get the VSCode API object

					const author = document.getElementById('author');
					author.addEventListener('input', (event) => {
						const query = event.target.value;
						vscode.postMessage({ type: 'author', query });
					});

					const date = document.getElementById('date');
					date.addEventListener('input', (event) => {
						const query = event.target.value;
						vscode.postMessage({ type: 'date', query });
					});
					
					const description = document.getElementById('description');
					description.addEventListener('input', (event) => {
						const query = event.target.value;
						vscode.postMessage({ type: 'description', query });
					});
					
					const tag = document.getElementById('tag');
					tag.addEventListener('input', (event) => {
						const query = event.target.value;
						vscode.postMessage({ type: 'tag', query });

					});
					
					const content = document.getElementById('content');
					content.addEventListener('input', (event) => {
						const query = event.target.value;
						vscode.postMessage({ type: 'content', query });
					});
					
					const has_link = document.getElementById('has_link');
					has_link.addEventListener('input', (event) => {
						const query = event.target.value;
						vscode.postMessage({ type: 'has_link', query });
					});
					
					const sort_default = document.getElementById('sort_default');
					sort_default.addEventListener('change', (event) => {
						vscode.postMessage({ type: 'sort_default'});
					});
					
					const sort_title = document.getElementById('sort_title');
					sort_title.addEventListener('change', (event) => {
						vscode.postMessage({ type: 'sort_title'});
					});
					
					const sort_author = document.getElementById('sort_author');
					sort_author.addEventListener('change', (event) => {
						vscode.postMessage({ type: 'sort_author'});
					});
					
					const sort_time = document.getElementById('sort_time');
					sort_time.addEventListener('change', (event) => {
						vscode.postMessage({ type: 'sort_time'});
					});
		 
					window.addEventListener('message', (event) => {
						const message = event.data;
						if (message.type === 'searchResults') {
							const searchResults = document.getElementById('searchResults');
							searchResults.innerHTML = ''; // Clear previous results
							message.results.forEach((result) => {
								const li = document.createElement('li');
								const a = document.createElement('a');

								a.href = '#';
								a.textContent = result;
								a.addEventListener('click', (event) => {
									event.preventDefault();
									vscode.postMessage({ type: 'openFile', path: result });
								});

								li.appendChild(a);
								searchResults.appendChild(li);
							});
						}

					});
				</script>
			</body>

			</html>
		`;
		
		let terminal = vscode.window.createTerminal("Terminal");
		let author = '', date = '', description = '', tag = '', content = '', has_link = '', s = '', sort = '';
		
		panel.webview.onDidReceiveMessage((message) => {
			if (message.type === 'openFile') {
				const filePath = path + '/' + message.path;
				vscode.workspace.openTextDocument(filePath).then((doc) => {
					vscode.window.showTextDocument(doc);
				});
			} else {
				// console.log(message.type);
				if(message.type == 'sort_default') {
					sort = '';
				} else if(message.type == 'sort_title') {
					sort = ' -s title';
				} else if(message.type == 'sort_author') {
					sort = ' -s author';
				} else if(message.type == 'sort_time') {
					sort = ' -s time';
				} else {
					const query = message.query;
					if (message.type === 'author') {
						author = query;
					} else if (message.type == 'date') {
						date = query;
					} else if (message.type == 'description') {
						description = query;
					} else if (message.type == 'tag') {
						tag = query;
					} else if (message.type == 'content') {
						content = query;
					} else if (message.type == 'has_link') {
						has_link = query;
					}
					s = '';
					if(author != '') {
						if(s == '') {
							s = `author:${author}`;
						} else {

							s += `&&author:${author}`;
						}
					}

					if(date != '') {
						if(s == '') {
							s = `date:${date}`;

						} else {
							s += `&&date:${date}`;
						}
					}

					if(description != '') {
						if(s == '') {
							s = `description:${description}`;

						} else {
							s += `&&description:${description}`;
						}

					}
					if(tag != '') {
						if(s == '') {

							s = `tag:${tag}`;

						} else {
							s += `&&tag:${tag}`;
						}

					}
					if(content != '') {
						if(s == '') {
							s = `content:${content}`;
						} else {
							s += `&&content:${content}`;
						}
					}
					if(has_link != '') {
						if(s == '') {
							s = `has-link:${has_link}`;
						} else {
							s+= `&&has-link:${has_link}`;
						}
					}
				}
				// console.log(`ants list -f \"${s}\"${sort}`);
				if(s != '') {
					exec(`ants list -f \"${s}\"${sort}`, { cwd: path }, (error, stdout, stderr) => {
						let fileResults = stdout.split('\n');
						fileResults.pop();
						panel.webview.postMessage({ type: 'searchResults', results: fileResults });
					});
				}
			}
		}, undefined, context.subscriptions);
		
	});


	context.subscriptions.push(
		helloWorldCmd,

		restartCmd,
		initCmd,
		newCmd,
		filterCmd

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
