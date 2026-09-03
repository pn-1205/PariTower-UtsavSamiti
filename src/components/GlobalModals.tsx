'use client';

import React from 'react';
import LoginModal from './LoginModal';
import AddDepositModal from './AddDepositModal';
import AddExpenseModal from './AddExpenseModal';
import AddDonationModal from './AddDonationModal';
import LightboxModal from './LightboxModal';

export default function GlobalModals() {
  return (
    <>
      <LoginModal />
      <AddDepositModal />
      <AddExpenseModal />
      <AddDonationModal />
      <LightboxModal />
    </>
  );
}