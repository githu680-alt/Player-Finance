import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.playerfinance.app",
  appName: "Player Finance",
  webDir: "dist",

  plugins: {
    FirebaseAuthentication: {
      providers: ["google.com"],
    },
  },
};

export default config;