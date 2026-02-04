// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MoltVote Presale Contract
 * @dev 私募合約：前1000名免費，後9000名 $1 USDC
 */
contract MoltVotePresale is Ownable, ReentrancyGuard {
    
    // 代幣
    IERC20 public voteToken;
    IERC20 public usdc;
    
    // 常數
    uint256 public constant TOKENS_PER_USER = 100_000 * 10**18;  // 每人10萬顆
    uint256 public constant FREE_SLOTS = 1000;                    // 免費名額
    uint256 public constant PAID_SLOTS = 9000;                    // 付費名額
    uint256 public constant TOTAL_SLOTS = 10000;                  // 總名額
    uint256 public constant PRICE_USDC = 1 * 10**6;              // $1 USDC (6 decimals)
    uint256 public constant PRESALE_DURATION = 30 days;          // 30天
    
    // 狀態
    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    uint256 public freeClaimCount;
    uint256 public paidClaimCount;
    bool public presaleActive;
    bool public presaleFinalized;
    
    // 用戶狀態
    mapping(address => bool) public hasClaimed;
    mapping(address => bool) public isVerified;      // X 驗證通過
    mapping(address => string) public xHandle;       // X 帳號
    mapping(address => uint256) public claimOrder;   // 領取順序
    
    // 事件
    event Verified(address indexed user, string xHandle);
    event FreeClaim(address indexed user, uint256 order, uint256 amount);
    event PaidClaim(address indexed user, uint256 order, uint256 amount);
    event PresaleStarted(uint256 startTime, uint256 endTime);
    event PresaleFinalized(uint256 totalRaised, uint256 totalParticipants);
    
    constructor(
        address _voteToken,
        address _usdc,
        address _owner
    ) Ownable(_owner) {
        voteToken = IERC20(_voteToken);
        usdc = IERC20(_usdc);
    }
    
    // ============ 管理功能 ============
    
    /**
     * @dev 開始私募
     */
    function startPresale() external onlyOwner {
        require(!presaleActive, "Already started");
        presaleStartTime = block.timestamp;
        presaleEndTime = block.timestamp + PRESALE_DURATION;
        presaleActive = true;
        emit PresaleStarted(presaleStartTime, presaleEndTime);
    }
    
    /**
     * @dev 後台驗證用戶 X 帳號（由後端調用）
     */
    function verifyUser(address user, string calldata _xHandle) external onlyOwner {
        require(!isVerified[user], "Already verified");
        isVerified[user] = true;
        xHandle[user] = _xHandle;
        emit Verified(user, _xHandle);
    }
    
    /**
     * @dev 批量驗證
     */
    function batchVerifyUsers(
        address[] calldata users, 
        string[] calldata handles
    ) external onlyOwner {
        require(users.length == handles.length, "Length mismatch");
        for (uint i = 0; i < users.length; i++) {
            if (!isVerified[users[i]]) {
                isVerified[users[i]] = true;
                xHandle[users[i]] = handles[i];
                emit Verified(users[i], handles[i]);
            }
        }
    }
    
    // ============ 用戶功能 ============
    
    /**
     * @dev 檢查用戶是否可以免費領取
     */
    function canClaimFree(address user) public view returns (bool) {
        return presaleActive && 
               isVerified[user] && 
               !hasClaimed[user] && 
               freeClaimCount < FREE_SLOTS &&
               block.timestamp <= presaleEndTime;
    }
    
    /**
     * @dev 檢查用戶是否可以付費購買
     */
    function canClaimPaid(address user) public view returns (bool) {
        return presaleActive && 
               isVerified[user] && 
               !hasClaimed[user] && 
               freeClaimCount >= FREE_SLOTS &&
               paidClaimCount < PAID_SLOTS &&
               block.timestamp <= presaleEndTime;
    }
    
    /**
     * @dev 領取代幣（前1000免費，之後付費）
     */
    function claim() external nonReentrant {
        require(presaleActive, "Presale not active");
        require(block.timestamp <= presaleEndTime, "Presale ended");
        require(isVerified[msg.sender], "Not verified");
        require(!hasClaimed[msg.sender], "Already claimed");
        
        uint256 totalClaimed = freeClaimCount + paidClaimCount;
        require(totalClaimed < TOTAL_SLOTS, "Sold out");
        
        hasClaimed[msg.sender] = true;
        claimOrder[msg.sender] = totalClaimed + 1;
        
        if (freeClaimCount < FREE_SLOTS) {
            // 免費領取
            freeClaimCount++;
            voteToken.transfer(msg.sender, TOKENS_PER_USER);
            emit FreeClaim(msg.sender, claimOrder[msg.sender], TOKENS_PER_USER);
        } else {
            // 付費購買
            require(usdc.balanceOf(msg.sender) >= PRICE_USDC, "Insufficient USDC");
            require(usdc.allowance(msg.sender, address(this)) >= PRICE_USDC, "USDC not approved");
            
            usdc.transferFrom(msg.sender, address(this), PRICE_USDC);
            paidClaimCount++;
            voteToken.transfer(msg.sender, TOKENS_PER_USER);
            emit PaidClaim(msg.sender, claimOrder[msg.sender], TOKENS_PER_USER);
        }
    }
    
    // ============ 結束私募 ============
    
    /**
     * @dev 結束私募（額滿或30天後）
     */
    function finalizePresale() external onlyOwner {
        require(presaleActive, "Not active");
        require(!presaleFinalized, "Already finalized");
        require(
            block.timestamp > presaleEndTime || 
            (freeClaimCount + paidClaimCount) >= TOTAL_SLOTS,
            "Cannot finalize yet"
        );
        
        presaleActive = false;
        presaleFinalized = true;
        
        uint256 totalRaised = paidClaimCount * PRICE_USDC;
        uint256 totalParticipants = freeClaimCount + paidClaimCount;
        
        emit PresaleFinalized(totalRaised, totalParticipants);
    }
    
    /**
     * @dev 提取募集的 USDC（用於建立流動性）
     */
    function withdrawUSDC(address to) external onlyOwner {
        require(presaleFinalized, "Not finalized");
        uint256 balance = usdc.balanceOf(address(this));
        usdc.transfer(to, balance);
    }
    
    /**
     * @dev 提取剩餘代幣
     */
    function withdrawRemainingTokens(address to) external onlyOwner {
        require(presaleFinalized, "Not finalized");
        uint256 balance = voteToken.balanceOf(address(this));
        voteToken.transfer(to, balance);
    }
    
    // ============ 查詢功能 ============
    
    function getPresaleStatus() external view returns (
        bool active,
        bool finalized,
        uint256 freeClaimed,
        uint256 paidClaimed,
        uint256 totalRaised,
        uint256 timeRemaining
    ) {
        uint256 remaining = 0;
        if (presaleActive && block.timestamp < presaleEndTime) {
            remaining = presaleEndTime - block.timestamp;
        }
        return (
            presaleActive,
            presaleFinalized,
            freeClaimCount,
            paidClaimCount,
            paidClaimCount * PRICE_USDC,
            remaining
        );
    }
    
    function getUserStatus(address user) external view returns (
        bool verified,
        bool claimed,
        uint256 order,
        string memory handle
    ) {
        return (
            isVerified[user],
            hasClaimed[user],
            claimOrder[user],
            xHandle[user]
        );
    }
}
