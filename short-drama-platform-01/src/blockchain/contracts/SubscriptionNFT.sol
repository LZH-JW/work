// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * SubscriptionNFT
 * - ERC721 风格的“订阅型”凭证：铸造时需付首期费，之后按分钟续费
 * - 费用：每分钟 0.001 ETH（常量，可在部署时设定）
 * - 功能：mint、renew（续费）、isActive（是否在有效期内）、withdraw（提现手续费）
 */

interface IERC721Receiver {
  function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract SubscriptionNFT {
  // 基本信息
  string public name = "Subscription NFT";
  string public symbol = "SUBNFT";

  // 订阅计费：每分钟费用，单位 wei；默认 0.001 ETH/分钟
  uint256 public immutable feePerMinuteWei;

  // 收费归集账户（通常为部署者/平台）
  address public immutable feeCollector;

  // token 拥有者与有效期截止时间（unix 秒）
  mapping(uint256 => address) private _owners;
  mapping(uint256 => uint256) public expiresAt; // tokenId -> timestamp
  mapping(address => uint256) private _balances;

  // token 计数
  uint256 private _nextTokenId = 1;

  // 事件
  event Minted(uint256 indexed tokenId, address indexed to, uint256 paidWei, uint256 minutesAdded, uint256 expiresAt);
  event Renewed(uint256 indexed tokenId, address indexed by, uint256 paidWei, uint256 minutesAdded, uint256 newExpiresAt);
  event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

  constructor(uint256 feePerMinuteWei_) {
    feePerMinuteWei = feePerMinuteWei_ > 0 ? feePerMinuteWei_ : 1e15; // 默认 0.001 ETH
    feeCollector = msg.sender;
  }

  // ============ ERC721 最小实现 ============
  function balanceOf(address owner) public view returns (uint256) {
    require(owner != address(0), "ZERO_ADDRESS");
    return _balances[owner];
  }
  function ownerOf(uint256 tokenId) public view returns (address) {
    address owner = _owners[tokenId];
    require(owner != address(0), "NOT_MINTED");
    return owner;
  }

  function _exists(uint256 tokenId) internal view returns (bool) {
    return _owners[tokenId] != address(0);
  }

  function _safeMint(address to) internal returns (uint256 tokenId) {
    require(to != address(0), "ZERO_ADDRESS");
    tokenId = _nextTokenId++;
    _owners[tokenId] = to;
    _balances[to] += 1;
    emit Transfer(address(0), to, tokenId);
  }

  // ============ 业务逻辑 ============

  // 计算支付金额能购买的分钟数
  function _minutesOf(uint256 weiAmount) internal view returns (uint256) {
    return weiAmount / feePerMinuteWei; // 向下取整
  }

  // 铸造：msg.value 按分钟兑换，为避免 0 时间，至少需要 >= feePerMinuteWei
  function mint() external payable returns (uint256 tokenId) {
    require(msg.value >= feePerMinuteWei, "INSUFFICIENT_FEE");

    tokenId = _safeMint(msg.sender);

    uint256 mins = _minutesOf(msg.value);
    uint256 duration = mins * 60; // 分钟 -> 秒
    expiresAt[tokenId] = block.timestamp + duration;

    emit Minted(tokenId, msg.sender, msg.value, mins, expiresAt[tokenId]);
  }

  // 续费：任意时间可续费；过期后也可续费，从当前时间开始累计
  function renew(uint256 tokenId) external payable {
    require(_exists(tokenId), "NOT_MINTED");
    require(msg.value >= feePerMinuteWei, "INSUFFICIENT_FEE");

    address owner = _owners[tokenId];
    require(msg.sender == owner, "ONLY_OWNER");

    uint256 mins = _minutesOf(msg.value);
    uint256 addSec = mins * 60;

    uint256 base = block.timestamp > expiresAt[tokenId] ? block.timestamp : expiresAt[tokenId];
    expiresAt[tokenId] = base + addSec;

    emit Renewed(tokenId, msg.sender, msg.value, mins, expiresAt[tokenId]);
  }

  // 简单转移（非安全）
  function transferFrom(address from, address to, uint256 tokenId) public {
    require(_exists(tokenId), "NOT_MINTED");
    require(from == _owners[tokenId], "FROM_NOT_OWNER");
    require(msg.sender == from, "ONLY_OWNER");
    require(to != address(0), "ZERO_ADDRESS");

    _owners[tokenId] = to;
    _balances[from] -= 1;
    _balances[to] += 1;
    emit Transfer(from, to, tokenId);
  }

  // 是否有效（当前时间 < 截止时间）
  function isActive(uint256 tokenId) external view returns (bool) {
    require(_exists(tokenId), "NOT_MINTED");
    return block.timestamp < expiresAt[tokenId];
  }

  // 提现合约累积的 ETH 到 feeCollector
  function withdraw() external {
    require(msg.sender == feeCollector, "ONLY_COLLECTOR");
    (bool ok, ) = payable(feeCollector).call{ value: address(this).balance }("");
    require(ok, "WITHDRAW_FAILED");
  }
}



