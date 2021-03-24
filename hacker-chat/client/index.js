/**
node index.js \
    --username ihagosantos \
    --room sala01 \
    --hostUri localhost
*/

import Events from 'events';
import CliConfig from './src/cliConfig.js';
import SocketClient from './src/socket.js';
import TerminalController from "./src/terminalController.js";

const [nomePath, filePath, ...commands] = process.argv;

const config = CliConfig.parseArguments(commands);

const componentEmitter = new Events();

const socketClient = new SocketClient(config)
await socketClient.initialize()
// const controller = new TerminalController();
// await controller.initializeTable(componentEmitter);


