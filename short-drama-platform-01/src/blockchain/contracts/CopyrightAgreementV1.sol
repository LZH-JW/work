// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * CopyrightAgreementV1
 * 基于区块链的版权智能合约（V1.0）
 * - 创作者提交信息与作品元数据
 * - 基础设施提供者（审核方）审核通过后，记录为有效版权合约
 * - 提供概要与记录查询接口，便于前端展示到“版权合约”位置
 */
contract CopyrightAgreementV1 {
  // ============ 基本信息 ============

  string public constant VERSION = "V1.0";
  string public contractNumber;       // 形如 BC-COPYRIGHT-YYYY-XXXXXX
  string public networkName;          // 网络名称（以太坊主网/Polygon/其他）
  uint256 public immutable chainId;   // 链ID
  uint64 public immutable deployedAt; // 合约部署时间（区块时间戳）

  address public immutable provider;  // 基础设施提供者（审核方）

  // ============ 主体信息 ============

  struct Party {
    string name;        // 姓名/机构
    address account;    // 区块链账户
    bytes32 idHash;     // 身份证明哈希（SHA-256）
    string contact;     // 联系地址
  }

  Party public author;              // 作者（权利原始归属方）
  address public evidenceAgency;    // 存证机构（可选，为0表示未设置）

  modifier onlyAuthor() {
    require(msg.sender == author.account, "ONLY_AUTHOR");
    _;
  }

  modifier onlyProvider() {
    require(msg.sender == provider, "ONLY_PROVIDER");
    _;
  }

  // ============ 作品与确权记录 ============

  struct Record {
    bool exists;
    address submitter;     // 提交人（通常为作者）
    string contentHash;    // 作品文件 SHA-256 或其他标识
    string metadataJson;   // 元数据 JSON（包含作品名、类型、摘要、IPFS 等）
    bool isActive;         // 审核通过后标记为生效
    uint64 submittedAt;    // 提交时间
    uint64 approvedAt;     // 审核通过时间
  }

  mapping(uint256 => Record) public records; // dramaId -> Record

  // ============ 权利范围/地域/期限 ============

  struct RightsScope {
    bool reproductionRight;         // 复制权
    bool distributionRight;         // 发行权
    bool networkCommunicationRight; // 信息网络传播权
    bool adaptationRight;           // 改编权
    bool translationRight;          // 翻译权
    string otherPropertyRights;     // 其他（需明确）
  }

  RightsScope public rights;
  string public territory;         // 例如 WORLD / CN / US
  uint64 public rightsStartAt;     // 权利起始时间
  uint64 public rightsEndAt;       // 权利截止时间（当年 12-31 23:59:59 可由链下计算后上链）

  // ============ 事件 ============

  event AuthorUpdated(string name, address account);
  event EvidenceAgencyUpdated(address agency);
  event Submitted(uint256 indexed dramaId, address indexed submitter);
  event Approved(uint256 indexed dramaId, address indexed provider);
  event Rejected(uint256 indexed dramaId, address indexed provider, string reason);

  // ============ 构造函数 ============

  constructor(
    string memory contractNumber_,
    string memory networkName_,
    uint256 chainId_,
    address provider_,
    // 作者初始账户，可为0，后续由作者自行设置
    address authorAccount_
  ) {
    contractNumber = contractNumber_;
    networkName = networkName_;
    chainId = chainId_;
    deployedAt = uint64(block.timestamp);
    require(provider_ != address(0), "INVALID_PROVIDER");
    provider = provider_;
    author.account = authorAccount_;
  }

  // ============ 作者与机构设置 ============

  function setAuthorInfo(
    string calldata name,
    address account,
    bytes32 idHash,
    string calldata contact
  ) external {
    // 允许作者本人或审核方维护（便于纠错）
    require(msg.sender == provider || msg.sender == author.account || author.account == address(0), "NO_PERMISSION");
    author = Party({ name: name, account: account, idHash: idHash, contact: contact });
    emit AuthorUpdated(name, account);
  }

  function setEvidenceAgency(address agency) external onlyProvider {
    evidenceAgency = agency;
    emit EvidenceAgencyUpdated(agency);
  }

  function configureRights(
    RightsScope calldata scope,
    string calldata territory_,
    uint64 startAt,
    uint64 endAt
  ) external onlyAuthor {
    require(startAt < endAt, "INVALID_TERM");
    rights = scope;
    territory = territory_;
    rightsStartAt = startAt;
    rightsEndAt = endAt;
  }

  // ============ 版权登记 + 审核流程 ============

  // 供前端兼容：registerCopyright(dramaId, contentHash, metadata)
  function registerCopyright(
    uint256 dramaId,
    string calldata contentHash,
    string calldata metadataJson
  ) external returns (bool) {
    require(author.account != address(0), "AUTHOR_NOT_SET");
    require(msg.sender == author.account, "ONLY_AUTHOR_SUBMIT");
    Record storage r = records[dramaId];
    require(!r.exists, "ALREADY_EXISTS");
    r.exists = true;
    r.submitter = msg.sender;
    r.contentHash = contentHash;
    r.metadataJson = metadataJson;
    r.submittedAt = uint64(block.timestamp);
    emit Submitted(dramaId, msg.sender);
    return true;
  }

  function approve(uint256 dramaId) external onlyProvider {
    Record storage r = records[dramaId];
    require(r.exists, "NOT_FOUND");
    require(!r.isActive, "ALREADY_ACTIVE");
    r.isActive = true;
    r.approvedAt = uint64(block.timestamp);
    emit Approved(dramaId, msg.sender);
  }

  function reject(uint256 dramaId, string calldata reason) external onlyProvider {
    Record storage r = records[dramaId];
    require(r.exists, "NOT_FOUND");
    require(!r.isActive, "ALREADY_ACTIVE");
    // 保留记录但不激活
    emit Rejected(dramaId, msg.sender, reason);
  }

  // 兼容前端查询方法
  function getCopyrightInfo(uint256 dramaId) external view returns (
    address _author,
    string memory _contentHash,
    string memory _metadataJson,
    bool _isActive,
    uint64 _submittedAt,
    uint64 _approvedAt
  ) {
    Record storage r = records[dramaId];
    require(r.exists, "NOT_FOUND");
    return (author.account, r.contentHash, r.metadataJson, r.isActive, r.submittedAt, r.approvedAt);
  }

  // 合约概要（用于“智能合约”卡片展示）
  function getSummary() external view returns (
    string memory _number,
    string memory _version,
    string memory _networkName,
    uint256 _chainId,
    address _address,
    uint64 _deployedAt
  ) {
    return (contractNumber, VERSION, networkName, chainId, address(this), deployedAt);
  }
}


