import test from 'node:test';
import assert from 'node:assert/strict';
import { getAccountBalances } from './data.ts';

const baseAccounts = [{ id: 'Cash', name: 'Cash', icon: 'Wallet', color: 'bg-emerald-500', baseBalance: 1000 }];

test('business_to_owner transfers reduce the business account balance', () => {
  const balances = getAccountBalances([
    {
      id: 'tx-1',
      transactionType: 'owner',
      category: 'Owner Transfer',
      amount: 250,
      account: 'Cash',
      ownerTransferDirection: 'business_to_owner',
      date: '2026-01-01',
      remark: '',
      playerId: '',
      playerName: '',
    },
  ], baseAccounts as any);

  assert.equal(balances.Cash, 750);
});

test('owner_to_business transfers increase the business account balance', () => {
  const balances = getAccountBalances([
    {
      id: 'tx-2',
      transactionType: 'owner',
      category: 'Owner Transfer',
      amount: 250,
      account: 'Cash',
      ownerTransferDirection: 'owner_to_business',
      date: '2026-01-01',
      remark: '',
      playerId: '',
      playerName: '',
    },
  ], baseAccounts as any);

  assert.equal(balances.Cash, 1250);
});

test('legacy owner transfers without ownerCategory still apply the direction correctly', () => {
  const balances = getAccountBalances([
    {
      id: 'tx-3',
      transactionType: 'owner',
      category: 'Owner Transfer',
      amount: 250,
      account: 'Cash',
      ownerTransferDirection: 'business_to_owner',
      date: '2026-01-01',
      remark: '',
      playerId: '',
      playerName: '',
    },
  ], baseAccounts as any);

  assert.equal(balances.Cash, 750);
});

test('owner transfer updates the selected owner account balance', () => {
  const balances = getAccountBalances([
    {
      id: 'tx-4',
      transactionType: 'owner',
      category: 'Owner Transfer',
      amount: 250,
      account: 'Cash',
      ownerAccountId: 'owner-1',
      ownerTransferDirection: 'business_to_owner',
      date: '2026-01-01',
      remark: '',
      playerId: '',
      playerName: '',
    },
  ], [
    ...baseAccounts,
    { id: 'owner-1', name: 'Owner Wallet', icon: 'Wallet', color: 'bg-amber-500', baseBalance: 1000 },
  ] as any);

  assert.equal(balances.Cash, 750);
  assert.equal(balances['owner-1'], 1250);
});
