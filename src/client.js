const Web3 = require('web3');
const MyTokenContract = require('../build/contracts/MyToken');
const MyTokenAddr = '0x40B36F251e2C4cAcd56f6DA5B98386bC98179ACe';
const PaymentChannelContract = require('../build/contracts/PaymentChannel');
const PaymentChannelAddr = '0x162B6f64475F64A13B3d9bb208ecdecA2f10c711';

var socket = require('socket.io-client')('http://127.0.0.1:7546');

const web3Provider = 'ws://127.0.0.1:7545';
const MyTokenOwnerAccountNr = 0;

const costPerHour=100;
let wantedHours=2
const deposit=costPerHour*wantedHours;

let web3;
let accounts;
let myAccount;
let otherAccount;
let MyToken;
let PaymentChannel;
let myAccountOptions;
let MyTokenOwnerAccountOptions;
let blockNumber;
let balance = 0;
let myBalance;
let accountNr=0;
let otherBalance = 0;
let stop = false;
let permission=false;


const initWeb3AndContracts = async () => {
  
  web3 = new Web3(web3Provider);

  accounts = await web3.eth.getAccounts();
  myAccount = accounts[accountNr];
  web3.defaultAccount = myAccount;
  console.log('Web3 started');
  console.log('Client address:'+ myAccount);

  myAccountOptions = {
    from: myAccount,
    gas: 6000000
  };

  MyTokenOwnerAccountOptions = {
    from: accounts[MyTokenOwnerAccountNr],
    gas: 6000000
  };
  MyToken = new web3.eth.Contract(MyTokenContract.abi, MyTokenAddr);

  PaymentChannel = new web3.eth.Contract(
    PaymentChannelContract.abi,
    PaymentChannelAddr
  );
};

const openPaymentChannel = async () => {
  
  myBalance = await MyToken.methods.balanceOf(myAccount).call({
    from: myAccount
  });
  console.log('Deploy contract rewards: ' + myBalance);
const deposit=200;
 await MyToken.methods.mint(myAccount, deposit).send(MyTokenOwnerAccountOptions);
 let value=10;
// await MyToken.methods.transfer(otherAccount, value).send({from: myAccount});
 //await MyToken.methods.transferFrom(myAccount,otherAccount, value);

 myBalance = await MyToken.methods.balanceOf(myAccount).call({
  from: myAccount
});
console.log('Final Balance2: ' + myBalance);
  await MyToken.methods
    .approve(PaymentChannelAddr, deposit)
    .send(myAccountOptions);

  const receipt = await PaymentChannel.methods
    .createChannel(otherAccount, deposit)
    .send(myAccountOptions);


  blockNumber = receipt.blockNumber;
  console.log(
    'Opened Payment Channel with deposit: ' +
      deposit +
      ' and block number: ' +
      blockNumber
  );
   myBalance = await MyToken.methods.balanceOf(myAccount).call({
    from: myAccount
  });
  console.log('Final Balance2: ' + myBalance);
    
    var obj = {
      deposit:deposit,
      blockNumber: blockNumber,
      senderAddr: myAccount}

      // Send State Channel info to the server via sockets
      socket.emit('info', obj);
};





const senderHash="";
const sendMessage = async () => {
  
  balance += costPerHour;
  wantedHours--;
  const senderSign = await signBalance();

  var message = {
  type: 'balance',
  message: '',
  balance: balance,
  signature: senderSign
}
myBalance = await MyToken.methods.balanceOf(myAccount).call({
  from: myAccount
});
console.log('Final Balance: ' + myBalance);
// Send Signed message to the server via sockets
socket.emit('messageSC', message);
};

const signBalance = async () => {
  const senderHash = web3.utils.soliditySha3(
    {
      type: 'address',
      value: otherAccount
    },
    {
      type: 'uint32',
      value: blockNumber
    },
    {
      type: 'uint192',
      value: balance
    },
    {
      type: 'address',
      value: PaymentChannelAddr
    }
  );
  console.log(senderHash);
  console.log(web3.eth.sign(senderHash, myAccount));
  return await web3.eth.sign(senderHash, myAccount);
 
};

 
    // Add a connect listener
    const connection = async () => {
    socket.on('connect',function() {
      console.log('Client has connected to the server!');
    });
    // Add a connect listener for server address
    socket.on('message',function(data) {
      console.log('received the server address!',data);
      otherAccount=data;
      sendAddressToServer(myAccount);
    });
    // Add a disconnect listener
    socket.on('disconnect',function() {
      console.log('The client has disconnected!');
    });

    //listener for password sended by server
    socket.on('password',function(password){
      console.log("MY PASSWORD:"+password);
    })

    // Sends a client address to the server via sockets
    function sendAddressToServer(message) {
      socket.send(message);
    };
  }

  


const main = async () => {
  await connection();
  await initWeb3AndContracts();
  await openPaymentChannel();  
  await sendMessage();

};

main();