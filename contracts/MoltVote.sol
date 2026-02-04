// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MoltVote Token
 * @dev ERC-20 Token for MoltVote platform
 * @custom:security-contact security@moltvote.io
 */
contract MoltVote is ERC20, ERC20Burnable, Ownable {
    
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 10億顆
    
    // 分配比例
    uint256 public constant TEAM_UNLOCKED = 100_000_000 * 10**18;     // 10% 項目方可動
    uint256 public constant TEAM_LOCKED = 100_000_000 * 10**18;       // 10% 項目方鎖倉
    uint256 public constant PRESALE = 150_000_000 * 10**18;           // 15% 私募
    uint256 public constant LIQUIDITY = 150_000_000 * 10**18;         // 15% 流動性
    uint256 public constant COMMUNITY = 150_000_000 * 10**18;         // 15% 社群
    uint256 public constant TREASURY = 350_000_000 * 10**18;          // 35% 金庫
    
    // 鎖倉
    uint256 public teamLockEndTime;
    bool public teamLockReleased;
    
    // 地址
    address public presaleContract;
    address public treasuryWallet;
    address public communityWallet;
    
    constructor(
        address _owner,
        address _treasuryWallet,
        address _communityWallet
    ) ERC20("MoltVote", "VOTE") Ownable(_owner) {
        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        
        // 鎖倉1年
        teamLockEndTime = block.timestamp + 365 days;
        teamLockReleased = false;
        
        // 鑄造並分配
        _mint(_owner, TEAM_UNLOCKED);           // 10% 給項目方（可動）
        _mint(address(this), TEAM_LOCKED);      // 10% 鎖在合約裡
        _mint(_treasuryWallet, TREASURY);       // 35% 金庫
        _mint(_communityWallet, COMMUNITY);     // 15% 社群
        // PRESALE 和 LIQUIDITY 由 Presale 合約管理
    }
    
    /**
     * @dev 設定私募合約地址並轉移代幣
     */
    function setPresaleContract(address _presale) external onlyOwner {
        require(presaleContract == address(0), "Presale already set");
        presaleContract = _presale;
        _mint(_presale, PRESALE + LIQUIDITY); // 15% + 15% = 30%
    }
    
    /**
     * @dev 1年後釋放鎖倉代幣
     */
    function releaseTeamLock() external onlyOwner {
        require(block.timestamp >= teamLockEndTime, "Still locked");
        require(!teamLockReleased, "Already released");
        
        teamLockReleased = true;
        _transfer(address(this), owner(), TEAM_LOCKED);
    }
    
    /**
     * @dev 查詢鎖倉狀態
     */
    function getLockInfo() external view returns (
        uint256 lockEndTime,
        uint256 lockedAmount,
        bool released
    ) {
        return (teamLockEndTime, TEAM_LOCKED, teamLockReleased);
    }
}
