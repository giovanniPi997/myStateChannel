const MyToken = artifacts.require("MyToken");
const PaymentChannel = artifacts.require("PaymentChannel");

module.exports = function (deployer) {

    return deployer
        .deploy(MyToken)
       
        .then(() => {
            return deployer.deploy(
                PaymentChannel,
                MyToken.address
            );
        });
};