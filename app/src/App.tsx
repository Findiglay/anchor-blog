import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import * as config from "./utils/config";
import Main from "./components/Main";

// Default styles that can be overridden by your app
require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  return (
    <ConnectionProvider endpoint={config.endpoint}>
      <WalletProvider wallets={config.wallets} autoConnect>
        <WalletModalProvider>
          <WalletMultiButton />
          <WalletDisconnectButton />
          <Main />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
