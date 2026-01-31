"use client";

import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
} from "@coinbase/onchainkit/wallet";
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from "@coinbase/onchainkit/identity";

export default function ConnectWalletComponent() {
  return (
    <div className="flex items-center justify-end">
      <Wallet>
        <ConnectWallet className="bg-white text-black font-semibold rounded-xl px-4 py-2 hover:bg-gray-200 transition">
          <Avatar className="h-6 w-6" />
          <Name />
        </ConnectWallet>
        
        <WalletDropdown>
          <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
            <Avatar />
            <Name />
            <Address />
            <EthBalance />
          </Identity>
          
          <WalletDropdownLink
            icon="wallet"
            href="https://keys.coinbase.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Wallet
          </WalletDropdownLink>
          
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
}