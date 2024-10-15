

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const os = require('os');


const app = express();


app.use(cors());
app.use(express.json());

//  HTTP server
const server = http.createServer(app);

//  Socket.io
const io = socketIo(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});


app.get('/', (req, res) => {
    res.send('Omegle Clone Server is running. You can access it from other devices on your network.');
});


let rooms = {};


const getPartner = (room, socketId) => {
    const users = rooms[room];
    if (users && users.length === 2) {
        return users.find(id => id !== socketId);
    }
    return null;
};

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log(`New user connected: ${socket.id}`);

    socket.on('leaveRoom', () => {
        const room = socket.room;
        const username = socket.username;

        if (room && rooms[room]) {
          
            rooms[room] = rooms[room].filter(id => id !== socket.id);

           
            const partnerId = getPartner(room, socket.id);
            if (partnerId) {
                const partnerSocket = io.sockets.sockets.get(partnerId);
                if (partnerSocket) {
                    partnerSocket.emit('partnerLeft');
                }
            }

            
            if (rooms[room].length === 0) {
                delete rooms[room];
            }
        }
    });

   
    socket.on('joinRoom', ({ username, room }) => {
        socket.join(room);
        socket.username = username;
        socket.room = room;

        if (!rooms[room]) {
            rooms[room] = [];
        }
        rooms[room].push(socket.id);

        console.log(`${username} joined room: ${room}`);

        
        socket.emit('joinedRoom', { room, users: rooms[room].length });

       
        socket.to(room).emit('userJoined', { username });

        
        if (rooms[room].length === 2) {
            io.in(room).emit('chatStarted');
            console.log(`Chat started in room: ${room}`);
        }
    });

    
    socket.on('sendMessage', (message) => {
        const room = socket.room;
        if (room) {
            const partnerId = getPartner(room, socket.id);
            if (partnerId) {
                const partnerSocket = io.sockets.sockets.get(partnerId);
                if (partnerSocket) {
                    partnerSocket.emit('receiveMessage', {
                        username: socket.username,
                        text: message,
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                }
            }
        }
    });

  
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        const room = socket.room;
        const username = socket.username;

        if (room && rooms[room]) {
           
            rooms[room] = rooms[room].filter(id => id !== socket.id);

            
            socket.to(room).emit('userLeft', { username });

            
            if (rooms[room].length === 0) {
                delete rooms[room];
            }

           
            if (rooms[room].length === 1) {
                const remainingUserId = rooms[room][0];
                const remainingSocket = io.sockets.sockets.get(remainingUserId);
                if (remainingSocket) {
                    remainingSocket.emit('partnerDisconnected');
                }
            }
        }
    });

   
    socket.on('findNewPartner', () => {
        const room = socket.room;
        const username = socket.username;

        if ( room && rooms[room]) {
          
            rooms[room] = rooms[room].filter(id => id !== socket.id);

            
            socket.to(room).emit('userLeft', { username });

           
            if (rooms[room].length === 0) {
                delete rooms[room];
            }

          
            let newRoom;
            for (const roomName in rooms) {
                if (rooms[roomName].length === 1) {
                    newRoom = roomName;
                    break;
                }
            }

            if (!newRoom) {
                newRoom = `room-${Math.floor(Math.random() * 1000)}`;
                rooms[newRoom] = [];
            }

           
            socket.join(newRoom);
            socket.room = newRoom;
            rooms[newRoom].push(socket.id);

            console.log(`${username} joined new room: ${newRoom}`);

            socket.emit('joinedNewRoom', { room: newRoom, users: rooms[newRoom].length });

            
            socket.to(newRoom).emit('userJoined', { username });

            
            if (rooms[newRoom].length === 2) {
                io.in(newRoom).emit('chatStarted');
                console.log(`Chat started in room: ${newRoom}`);
            }
        }
    });
});

// Log server IP addresses
const networkInterfaces = os.networkInterfaces();
console.log('Server IP addresses:');
Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((iface) => {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            return;
        }
        console.log(`   ${interfaceName}: ${iface.address}`);
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on all interfaces, port ${PORT}`);
});