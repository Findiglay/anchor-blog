import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import * as config from "./config";
import Main from "./components/Main";
import "./index.css";

require("@solana/wallet-adapter-react-ui/styles.css");

function App() {
  return (
    <ConnectionProvider endpoint={config.endpoint}>
      <WalletProvider wallets={config.wallets}>
        <WalletModalProvider>
          <Main />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
