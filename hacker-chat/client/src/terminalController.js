import ComponentsBuilder from "./components.js";
import { constants } from "./constants.js";


export default class TerminalController{
    #usersCollors = new Map();

    constructor() {}

    #pickCollor() {
        return `#`+((1 << 24) * Math.random() | 0).toString(16)+`-fg`;
    }

    #getUserCollors(userName){
        if(this.#usersCollors.has(userName)) return this.#usersCollors.get(userName);

        const collor = this.#pickCollor();
        this.#usersCollors.set(userName, collor)

        return collor;
    }
    #onInputReceived(eventEmitter) {
        return function () {
            const message = this.getValue();
            console.log(message)
            this.clearValue();
        }
    }

    #onMessageReceived({ screen, chat }) {
        return msg => {
            const { userName, message } = msg;
            const collor = this.#getUserCollors(userName);

            chat.addItem(`{${collor}}{bold}${userName}{/}: ${message}`);
            screen.render();
        }
    }

    #onLogChanged({ screen, activityLog }) {
        return msg => {
            const [userName] = msg.split(/\s/)
            const collor = this.#getUserCollors(userName)

            activityLog.addItem(`{${collor}}{bold}${msg.toString()}{/}`);
            screen.render();
        }
    }

    #onStatusChanged({ screen, status }) {
        return users => {
            // pegar o primeiro elemento da lista
            const {content} = status.items.shift();
            status.clearItems();
            status.addItem(content);

            users.forEach(userName => {
                const collor = this.#getUserCollors(userName);
                status.addItem(`{${collor}}{bold}${userName}{/}`)
            });

            screen.render();
        }
    }

    #registerEvents(eventEmitter, components) {
        eventEmitter.on(constants.events.app.MESSAGE_RECEIVED, this.#onMessageReceived(components))
        eventEmitter.on(constants.events.app.ACTIVITYLOG_UPDATED, this.#onLogChanged(components))
        eventEmitter.on(constants.events.app.STATUS_UPDATED, this.#onStatusChanged(components))
    }

    async initializeTable(eventEmitter){
        const components = new ComponentsBuilder()
            .setScreen({ title: 'HackerChat - Ihago Santos'})
            .setLayoutComponent()
            .setInputComponent( this.#onInputReceived(eventEmitter))
            .setChatComponent()
            .setActivityLogComponent()
            .setStatusComponent()
            .build();

        this.#registerEvents(eventEmitter, components)

        components.input.focus()
        components.screen.render()


        const users = ['ihagoSantos'];
        eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
        
        users.push('ingrydSiqueira')
        eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);

        users.push('guest001')
        eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
        users.push('guest002')
        eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);
        users.push('guest003')
        eventEmitter.emit(constants.events.app.STATUS_UPDATED, users);

        // eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'ihagoSantos join')
        // eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'ingrydSiqueira join')

        // setInterval(()=> {
        //     eventEmitter.emit(constants.events.app.MESSAGE_RECEIVED, { message: 'hey, ho...', userName:'ihagoSantos'})
        //     eventEmitter.emit(constants.events.app.MESSAGE_RECEIVED, { message: "let's go!", userName:'ingrydSiqueira'})
        // }, 2000)
        
        
        // setInterval(()=> {
        //     eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'ihagoSantos left')
        //     eventEmitter.emit(constants.events.app.ACTIVITYLOG_UPDATED, 'ingrydSiqueira left')
        // }, 6000)
    }
}