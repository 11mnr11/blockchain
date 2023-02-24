import getPort from 'get-port';
import crypto from 'crypto';
import Swarm from 'discovery-swarm';
import defaults from "dat-swarm-defaults";



// The first lines of code are an import statement for the open source libraries that you are using in your code.

//next we set our variables to hold on object
//with the peers and connection sequence
//and we choose a channel name that all our nodes will be connecting to.

const peers = {};
let connSeq = 0;
let channel = 'myBlockchain';
const myPeerId = crypto.randomBytes(32);
console.log('myPeerId: ' + myPeerId.toString('hex'));

//we generate a config object that holds our peer ID.
//we use this object to initialize the swarm library.

const config = defaults({
    id:myPeerId,
});

const swarm = Swarm(config);

//we will be creating a Node.js async function to continuosly monitor swarm.on 
//event messages.

(async () =>{
    const port = await getPort();

    swarm.listen(port);
    console.log('Listening port: '+ port);

    swarm.join(channel);
    swarm.on('connection',(conn,info)=>{
        const seq = connSeq;
        const peerId = info.id.toString('hex');
        console.log(`Connected #${seq} to peer: ${peerId}`);
        if(info.initiatior){
            try{
                conn.setKeepAlive(true,600);
            }catch(exception){
                console.log('exception',exception);
            }
        }

        conn.on('data', data=>{
            let message= JSON.parse(data);
            console.log('-------Received Message start -------');
            console.log(
                'from: ' + peerId.toString('hex'),
                'to: ' + peerId.toString(message.to),
                'my: ' + myPeerId.toString('hex'),
                'type: ' + JSON.stringify(message.type)
            );
        });

        conn.on('close', ()=>{
            console.log(`Connection ${seq} closed, peerId:${peerId}`);
            if(peers[peerId].seq === seq){
                delete peers[peerId];
            }
        });

        if(!peers[peerId]){
            peers[peerId] = {}
        }
        peers[peerId].conn = conn;
        peers[peerId].seq = seq;
        connSeq++
    })
})();

setTimeout(function(){
    writeMessageToPeers('hello',null);
},10000);

var writeMessageToPeers = (type,data) => {
    for(let id in peers){
        console.log('-------- writeMessageToPeers start -------- ');
        console.log('type: ' + type + ', to: ' + id);
        console.log('-------- writeMessageToPeers end -------- ');
        sendMessage(id, type, data);
    }
};

 var writeMessageToPeerToId = (toId, type, data) => {
    for (let id in peers) {
    if (id === toId) {
    console.log('-------- writeMessageToPeerToId start -------- ');
    console.log('type: ' + type + ', to: ' + toId);
    console.log('-------- writeMessageToPeerToId end ----------- ');
    sendMessage(id, type, data);
    }
    }
   };

 var  sendMessage = (id, type, data) => {
    peers[id].conn.write(JSON.stringify(
    {
    to: id,
    from: myPeerId,
    type: type,
    data: data
    }
    ));
   };