// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SimpleNFT - 简化版订阅 NFT
 * 减少复杂度，提高部署成功率
 */
contract SimpleNFT {
    string public name = "Simple NFT";
    string public symbol = "SNFT";
    
    uint256 public feePerMinuteWei = 1000000000000000; // 0.001 ETH/分钟
    address public feeCollector;
    
    mapping(uint256 => address) private _owners;
    mapping(uint256 => uint256) public expiresAt;
    uint256 private _nextTokenId = 1;
    
    event Minted(uint256 indexed tokenId, address indexed to, uint256 expiresAt);
    
    constructor(address feeCollector_) {
        require(feeCollector_ != address(0), "Invalid fee collector");
        feeCollector = feeCollector_;
    }
    
    function mint() external payable returns (uint256 tokenId) {
        require(msg.value >= feePerMinuteWei, "Insufficient payment");
        
        tokenId = _nextTokenId++;
        _owners[tokenId] = msg.sender;
        
        uint256 minutesCount = msg.value / feePerMinuteWei;
        expiresAt[tokenId] = block.timestamp + (minutesCount * 60);
        
        emit Minted(tokenId, msg.sender, expiresAt[tokenId]);
        return tokenId;
    }
    
    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = _owners[tokenId];
        require(owner != address(0), "Token does not exist");
        return owner;
    }
    
    function isActive(uint256 tokenId) external view returns (bool) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return block.timestamp < expiresAt[tokenId];
    }
    
    function withdraw() external {
        require(msg.sender == feeCollector, "Only collector");
        payable(feeCollector).transfer(address(this).balance);
    }
}
