import { IStore } from "./react/features/app/types";
import { IConfig } from "./react/features/base/config/configType";

export {};

declare global {
    const APP: {
        store: IStore;
        UI: any;
        API: any;
        conference: any;
        debugLogs: any;
        keyboardshortcut: {
            registerShortcut: Function;
            unregisterShortcut: Function;
            openDialog: Function;
            enable: Function;
        }
    };
    const interfaceConfig: any;

    interface Window {
        config: IConfig;
        JITSI_MEET_LITE_SDK?: boolean;
        interfaceConfig?: any;
        JitsiMeetJS?: any;
        JitsiMeetElectron?: any;
    }

    const config: IConfig;

    const JitsiMeetJS: any;
}
