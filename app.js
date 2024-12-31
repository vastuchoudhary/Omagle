const express = require('express');
const path = require('path');
const indexRouter = require("./routes/index");
const app = express();

const http = require("http");
const socketIO = require("socket.io");
const { log } = require('console');
const server = http.createServer(app);
const io = socketIO(server);

let waitingusers = [];
let users = {
    
};

io.on("connection", function(socket) { 
    socket.on("joinroom",function(){
        if(waitingusers.length>0){
            let partner = waitingusers.shift();
            const roomname = `${socket.id}-${partner.id}`;
            socket.join(roomname);
            partner.join(roomname);
            io.to(roomname).emit("joined", roomname);
        }
        else{
            waitingusers.push(socket);
        }
    });

    socket.on("signalingMessage", function(data){
        console.log(data);
        
        socket.broadcast.to(data.room).emit("signalingmessage",data.message);  
    })

    socket.on("message",function(data){
        socket.broadcast.to(data.room).emit("message",data.message);        
    });

    socket.on("startVideoCall", function({ room }){
        socket.broadcast.to(room).emit("incomingCall");
    })

    socket.on("rejectCall", function({ room }){
        socket.broadcast.to(room).emit("callRejected");            
    })

    socket.on("acceptCall", function({ room }){
        socket.broadcast.to(room).emit("callAccepted");            
    })
    socket.on("disconnect",function(){
        let index = waitingusers.findIndex(
            (waitingUser) => waitingUser.id === socket.id
        );
        waitingusers.splice(index,1);
    });
});

app.set('view engine', 'ejs');
app.use(express.json())
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));


app.use("/", indexRouter)

server.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
});
