const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

if (!content.includes('deposit_bonus')) {
  content = content.replace(/\| 'bonus_coins';/g, "| 'bonus_coins'\n  | 'deposit_bonus';");
}

if (!content.includes('export interface BonusSettings')) {
  content += `

export interface BonusSettings {
  depositBonusEnabled: boolean;
  depositBonusType: 'fixed' | 'percentage';
  depositBonusValue: number;
  minimumDeposit: number;
  maximumDeposit?: number;
  maximumBonus?: number;
  referralBonusEnabled: boolean;
  referrerBonusAmount: number;
  referredUserBonusAmount: number;
  minimumReferralDeposit: number;
  updatedAt: string;
}

export interface BonusHistory {
  id: string;
  userId: string;
  userName: string;
  bonusType: 'deposit_bonus' | 'referral_bonus';
  depositAmount?: number;
  bonusAmount: number;
  referralCode?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}
`;
}
fs.writeFileSync('src/types.ts', content);
