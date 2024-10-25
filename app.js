const cors = require("cors");
const express = require("express");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/boards", require("./routes/boardRoutes"));
app.use("/api/friends", require("./routes/friendRoutes"));

const wss = new WebSocket.Server({ server });

const clients = {};
const boards = {};

wss.on('connection', function connection(ws) {
    ws.on('message', function incoming(message) {
        let msg;
        try {
            msg = JSON.parse(message);
        } catch (e) {
            console.error('Invalid JSON', e);
            return;
        }

        if (msg.type === 'join') {
            const { token, boardId } = msg;
            ws.boardId = boardId;

            if (!clients[boardId]) {
                clients[boardId] = new Set();
            }
            clients[boardId].add(ws);
            const boardState = boards[boardId] || [];
            ws.send(JSON.stringify({ type: 'init', tickets: boardState }));
        } else if (['createTicket', 'updateTicket', 'deleteTicket', 'moveTicket'].includes(msg.type)) {
            const boardId = ws.boardId;
            if (!boardId) {
                console.error('No boardId associated with this connection');
                return;
            }

            let boardState = boards[boardId] || [];
            switch (msg.type) {
                case 'createTicket': {
                    const boardId = ws.boardId;
                    if (!boardId) {
                        console.error('No boardId associated with this connection');
                        return;
                    }
                    let boardState = boards[boardId] || [];
                    boardState.push(msg.ticket);
                    boards[boardId] = boardState;
                    ws.send(JSON.stringify({ type: 'ackCreate', ticket: msg.ticket }));
                    clients[boardId].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(msg)); 
                        }
                    });
                    break;
                }

                case 'updateTicket': {
                    const boardId = ws.boardId;
                    if (!boardId) {
                        console.error('No boardId associated with this connection');
                        return;
                    }
                    let boardState = boards[boardId] || [];
                    const updateIndex = boardState.findIndex(t => t.id === msg.ticket.id);
                    if (updateIndex !== -1) {
                        boardState[updateIndex] = msg.ticket;
                    }
                
                    boards[boardId] = boardState;
                    ws.send(JSON.stringify({ type: 'ackUpdate', ticket: msg.ticket }));
                    clients[boardId].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(msg));
                        }
                    });
                    break;
                }

                case 'deleteTicket': {
                    const boardId = ws.boardId;
                    if (!boardId) {
                        console.error('No boardId associated with this connection');
                        return;
                    }
                    let boardState = boards[boardId] || [];
                    boards[boardId] = boardState.filter(t => t.id !== msg.ticketId);
                    clients[boardId].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(msg)); 
                        }
                    });
                    break;
                }

                case 'moveTicket': {
                    const boardId = ws.boardId;
                    if (!boardId) {
                        console.error('No boardId associated with this connection');
                        return;
                    }
                    let boardState = boards[boardId] || [];
                    const moveIndex = boardState.findIndex(t => t.id === msg.ticket.id);
                    if (moveIndex !== -1) {
                        boardState[moveIndex].position = msg.ticket.position;
                    }
                    boards[boardId] = boardState;
                    clients[boardId].forEach(client => {
                        if (client !== ws && client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify(msg)); 
                        }
                    });
                    break;
                }

            }
            boards[boardId] = boardState;
            clients[boardId].forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(msg));
                }
            });
        }
    });

    ws.on('close', () => {
        const boardId = ws.boardId;
        if (boardId && clients[boardId]) {
            clients[boardId].delete(ws);
            if (clients[boardId].size === 0) {
                delete clients[boardId];
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
