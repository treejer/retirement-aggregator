// SPDX-License-Identifier: GPL-3.0

pragma solidity =0.8.6;

import "../../../v2-core/contracts/interfaces/IUniswapV2Callee.sol";

import "../libraries/UniswapV2Library.sol";
import "../interfaces/V1/IUniswapV1Factory.sol";
import "../interfaces/V1/IUniswapV1Exchange.sol";
import "../interfaces/IUniswapV2Router01Test.sol";
import "../interfaces/IERC20Test.sol";
import "../interfaces/IWETH.sol";

contract ExampleFlashSwap is IUniswapV2Callee {
    IUniswapV1Factory immutable factoryV1;
    address immutable factory;
    IWETH immutable WETH;

    constructor(
        address _factory,
        address _factoryV1,
        address router
    ) {
        factoryV1 = IUniswapV1Factory(_factoryV1);
        factory = _factory;
        WETH = IWETH(IUniswapV2Router01Test(router).WETH());
    }

    // needs to accept ETH from any V1 exchange and WETH. ideally this could be enforced, as in the router,
    // but it's not possible because it requires a call to the v1 factory, which takes too much gas
    receive() external payable {}

    // gets tokens/WETH via a V2 flash swap, swaps for the ETH/tokens on V1, repays V2, and keeps the rest!
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        address[] memory path = new address[](2);
        uint256 amountToken;
        uint256 amountETH;
        {
            // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2PairTest(msg.sender).token0();
            address token1 = IUniswapV2PairTest(msg.sender).token1();
            assert(
                msg.sender == UniswapV2Library.pairFor(factory, token0, token1)
            ); // ensure that msg.sender is actually a V2 pair
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountETH = token0 == address(WETH) ? amount0 : amount1;
        }

        assert(path[0] == address(WETH) || path[1] == address(WETH)); // this strategy only works with a V2 WETH pair
        IERC20Test token = IERC20Test(path[0] == address(WETH) ? path[1] : path[0]);
        IUniswapV1Exchange exchangeV1 = IUniswapV1Exchange(
            factoryV1.getExchange(address(token))
        ); // get V1 exchange

        if (amountToken > 0) {
            uint256 minETH = abi.decode(data, (uint256)); // slippage parameter for V1, passed in by caller
            token.approve(address(exchangeV1), amountToken);
            uint256 amountReceived = exchangeV1.tokenToEthSwapInput(
                amountToken,
                minETH,
                type(uint256).max
            );
            uint256 amountRequired = UniswapV2Library.getAmountsIn(
                factory,
                amountToken,
                path
            )[0];
            assert(amountReceived > amountRequired); // fail if we didn't get enough ETH back to repay our flash loan
            WETH.deposit{value: amountRequired}();
            assert(WETH.transfer(msg.sender, amountRequired)); // return WETH to V2 pair
            (bool success, ) = sender.call{
                value: amountReceived - amountRequired
            }(new bytes(0)); // keep the rest! (ETH)
            assert(success);
        } else {
            uint256 minTokens = abi.decode(data, (uint256)); // slippage parameter for V1, passed in by caller
            WETH.withdraw(amountETH);
            uint256 amountReceived = exchangeV1.ethToTokenSwapInput{
                value: amountETH
            }(minTokens, type(uint256).max);
            uint256 amountRequired = UniswapV2Library.getAmountsIn(
                factory,
                amountETH,
                path
            )[0];
            assert(amountReceived > amountRequired); // fail if we didn't get enough tokens back to repay our flash loan
            assert(token.transfer(msg.sender, amountRequired)); // return tokens to V2 pair
            assert(token.transfer(sender, amountReceived - amountRequired)); // keep the rest! (tokens)
        }
    }
}
