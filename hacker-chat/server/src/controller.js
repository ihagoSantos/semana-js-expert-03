import { constants } from "../../server/src/constants.js";

export default class Controller {
    #users = new Map();
    #rooms = new Map();

    constructor({ socketServer }) {
        this.socketServer = socketServer;
    }

    onNewConnection(socket){
        const { id } = socket
        console.log('connection stablished with', id)
        const userData = { id, socket };
        this.#updateGlobalUserData(id, userData)

        socket.on('data', this.#onSocketData(id));
        socket.on('error', this.#onSocketClosed(id))
        socket.on('end', this.#onSocketClosed(id));
    }

    async joinRoom(socketId, data) {
        const userData = data
        console.log(`${userData.userName} joined! ${[socketId]}`);
        const user = this.#updateGlobalUserData(socketId, userData)

        const { roomId } = userData;
        const users = this.#joinUserOnRoom(roomId, user);

        const currentUsers = Array.from(users.values())
            .map(({ id, userName }) => ({ userName, id }))

        // ATUALIZA O USUÁRIO QUE CONECTOU SOBRE QUAIS USUÁRIOS JÁ ESTÃO CONECTADOS
        // NA MESMA SALA
        this.socketServer
            .sendMessage(user.socket, constants.event.UPDATE_USERS, currentUsers)

        // AVISA A REDE QUE UM NOVO USUARIO CONECTOU-SE
        this.broadCast({
            socketId,
            roomId,
            message: { id: socketId, userName: data.userName },
            event: constants.event.NEW_USER_CONNECTED,
        })
    }

    broadCast({ socketId, roomId, event, message, includCurrentSocket = false}) {
        const usersOnRoom = this.#rooms.get(roomId)

        for( const [ key, user ] of usersOnRoom){
            if(!includCurrentSocket &&key == socketId) continue;

            this.socketServer.sendMessage(user.socket, event, message)
        }
    }

    message(id, data){
        const { userName, roomId } = this.#users.get(id);
        
        this.broadCast({
            id,
            roomId,
            event: constants.event.MESSAGE,
            message: { userName, message: data},
            includCurrentSocket: true
        })
    }

    #joinUserOnRoom(roomId, user){
        const usersOnRoom = this.#rooms.get(roomId) ?? new Map();
        usersOnRoom.set(user.id, user)
        this.#rooms.set(roomId, usersOnRoom)
        
        return usersOnRoom
    }

    #logoutUser(id, roomId){
        this.#users.delete(id);
        const usersOnRoom = this.#rooms.get(roomId)
        usersOnRoom.delete(id)

        this.#rooms.set(roomId, usersOnRoom)
    }

    #onSocketClosed(id) {
        return _ => {
            const { userName, roomId } = this.#users.get(id);
            console.log(userName, 'disconected', id);

            this.#logoutUser(id, roomId)

            this.broadCast({
                roomId,
                message: {id, userName},
                socketId: id,
                event: constants.event.DISCONNECT_USER,
            })
        }
    }
    #onSocketData(id) {
        return data => {
            try {
                const { event, message } = JSON.parse(data);
                this[event](id, message);
            } catch (error) {
                console.error(`wrong event format!!`, data.toString(), error)
            }
        }

    }

    #updateGlobalUserData(socketId, userData) {
        const users = this.#users;
        const user = users.get(socketId) ?? {}

        const updatedUserData = {
            ...user,
            ...userData
        }

        users.set(socketId, updatedUserData);

        return users.get(socketId)
    }
}