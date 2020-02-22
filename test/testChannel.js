const MyToken = artifacts.require('MyToken');
const PaymentChannel = artifacts.require('PaymentChannel');

let blockNumber;

contract('PaymentsChannel', async accounts => {
    it("puts 10000 mytoken in the first account", async () => {
        const mytoken = await MyToken.deployed();
        let balance = await mytoken.balanceOf.call(accounts[0]);
        console.log("A"+balance);
        assert.equal(balance.valueOf(), 0);
        assert.equal(await mytoken.isOwner.call(accounts[0]), true);
        assert.equal(await mytoken.isMinter.call(accounts[0]), true);

        await mytoken.mint(accounts[0], 10000);
        balance = await mytoken.balanceOf.call(accounts[0]);
        console.log("A"+balance);
        assert.equal(balance.valueOf(), 10000, "Amount was not correctly minted");
    });

    it("opens a channel from first account to second", async () => {
        const mytoken = await MyToken.deployed();
        const channel = await PaymentChannel.deployed();

        await mytoken.approve(PaymentChannel.address, 2000);
        const result = await channel.createChannel(accounts[1], 2000);
        
        blockNumber = result.receipt.blockNumber;
    });

    it("closes a channel", async () => {
        const mytoken = await MyToken.deployed();
        const channel = await PaymentChannel.deployed();
        const balance = 1500;
        const balance4 = await mytoken.balanceOf.call(accounts[0]);
        console.log("A"+balance4);

        const balance5 = await mytoken.balanceOf.call(accounts[1]);
        console.log("A"+balance5);
        const receiverHash = web3.utils.soliditySha3({
            type: 'address',
            value: accounts[0]
        }, {
            type: 'uint32',
            value: blockNumber
        }, {
            type: 'uint192',
            value: balance
        }, {
            type: 'address',
            value: PaymentChannel.address
        });
        const receiverSign = await web3.eth.sign(receiverHash, accounts[1]);
        //console.log('\n Receiver: ' + accounts[1]);
        //console.log(receiverHash);
        //console.log(receiverSign);

        const senderHash = web3.utils.soliditySha3({
            type: 'address',
            value: accounts[1]
        }, {
            type: 'uint32',
            value: blockNumber
        }, {
            type: 'uint192',
            value: balance
        }, {
            type: 'address',
            value: PaymentChannel.address
        });
        const senderSign = await web3.eth.sign(senderHash, accounts[0]);
 console.log(receiverSign);
 console.log(senderSign);
       
 



        //console.log('\n Sender: ' + accounts[0]);
        //console.log(senderHash);
        //console.log(senderSign);

        //await channel.closeChannel(accounts[1], blockNumber, balance, senderSign, receiverSign);
        await channel.closeChannel(accounts[1], blockNumber, balance, senderSign, receiverSign, {
            from: accounts[1]
        });
        //await channel._closeChannel(accounts[0],accounts[1],blockNumber,balance)
        const balance1 = await mytoken.balanceOf.call(accounts[0]);
        console.log("A"+balance1);

        const balance2 = await mytoken.balanceOf.call(accounts[1]);
        console.log("A"+balance2);
        
    });
});