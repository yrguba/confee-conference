type ToolbarButtons = 'camera' |
    'chat' |
    'closedcaptions' |
    'desktop' |
    'download' |
    'embedmeeting' |
    'etherpad' |
    'feedback' |
    'filmstrip' |
    'fullscreen' |
    'hangup' |
    'help' |
    'highlight' |
    'invite' |
    'linktosalesforce' |
    'livestreaming' |
    'microphone' |
    'participants-pane' |
    'profile' |
    'raisehand' |
    'recording' |
    'security' |
    'select-background' |
    'settings' |
    'shareaudio' |
    'sharedvideo' |
    'shortcuts' |
    'stats' |
    'tileview' |
    'toggle-camera' |
    'videoquality' |
    '__end';

type ButtonsWithNotifyClick = 'camera' |
    'chat' |
    'closedcaptions' |
    'desktop' |
    'download' |
    'embedmeeting' |
    'end-meeting' |
    'etherpad' |
    'feedback' |
    'filmstrip' |
    'fullscreen' |
    'hangup' |
    'hangup-menu' |
    'help' |
    'invite' |
    'livestreaming' |
    'microphone' |
    'mute-everyone' |
    'mute-video-everyone' |
    'participants-pane' |
    'profile' |
    'raisehand' |
    'recording' |
    'security' |
    'select-background' |
    'settings' |
    'shareaudio' |
    'sharedvideo' |
    'shortcuts' |
    'stats' |
    'tileview' |
    'toggle-camera' |
    'videoquality' |
    'add-passcode' |
    '__end';

export type Sounds = 'ASKED_TO_UNMUTE_SOUND' |
    'E2EE_OFF_SOUND' |
    'E2EE_ON_SOUND' |
    'INCOMING_MSG_SOUND' |
    'KNOCKING_PARTICIPANT_SOUND' |
    'LIVE_STREAMING_OFF_SOUND' |
    'LIVE_STREAMING_ON_SOUND' |
    'NO_AUDIO_SIGNAL_SOUND' |
    'NOISY_AUDIO_INPUT_SOUND' |
    'OUTGOING_CALL_EXPIRED_SOUND' |
    'OUTGOING_CALL_REJECTED_SOUND' |
    'OUTGOING_CALL_RINGING_SOUND' |
    'OUTGOING_CALL_START_SOUND' |
    'PARTICIPANT_JOINED_SOUND' |
    'PARTICIPANT_LEFT_SOUND' |
    'RAISE_HAND_SOUND' |
    'REACTION_SOUND' |
    'RECORDING_OFF_SOUND' |
    'RECORDING_ON_SOUND' |
    'TALK_WHILE_MUTED_SOUND';


export interface IMobileDynamicLink {
    apn: string;
    appCode: string;
    customDomain?: string;
    ibi: string;
    isi: string;
}

export interface IDeeplinkingPlatformConfig {
    appName: string;
}

export interface IDeeplinkingMobileConfig extends IDeeplinkingPlatformConfig {
    appPackage?: string;
    appScheme: string;
    downloadLink: string;
    dynamicLink?: IMobileDynamicLink;
    fDroidUrl?: string;
}

export interface IDeeplinkingConfig {
    android?: IDeeplinkingMobileConfig;
    desktop?: IDeeplinkingPlatformConfig;
    disabled: boolean;
    hideLogo: boolean;
    ios?: IDeeplinkingMobileConfig;
}

export interface IConfig {
    _desktopSharingSourceDevice?: string;
    analytics?: {
        amplitudeAPPKey?: string;
        disabled?: boolean;
        googleAnalyticsTrackingId?: string;
        matomoEndpoint?: string;
        matomoSiteID?: string;
        obfuscateRoomName?: boolean;
        rtcstatsEnabled?: boolean;
        rtcstatsEndpoint?: string;
        rtcstatsPollInterval?: number;
        rtcstatsSendSdp?: boolean;
        rtcstatsUseLegacy?: boolean;
        scriptURLs?: Array<string>;
    };
    apiLogLevels?: Array<'warn' | 'log' | 'error' | 'info' | 'debug'>;
    appId?: string;
    audioLevelsInterval?: number;
    audioQuality?: {
        opusMaxAverageBitrate?: number | null;
        stereo?: boolean;
    };
    autoCaptionOnRecord?: boolean;
    autoKnockLobby?: boolean;
    backgroundAlpha?: number;
    bosh?: string;
    brandingDataUrl?: string;
    brandingRoomAlias?: string;
    breakoutRooms?: {
        hideAddRoomButton?: boolean;
        hideAutoAssignButton?: boolean;
        hideJoinRoomButton?: boolean;
    };
    buttonsWithNotifyClick?: Array<ButtonsWithNotifyClick | {
        key: ButtonsWithNotifyClick;
        preventExecution: boolean;
    }>;
    callDisplayName?: string;
    callFlowsEnabled?: boolean;
    callStatsConfigParams?: {
        additionalIDs?: {
            customerID?: string;
            fqExtensionID?: string;
            meetingsName?: string;
            pbxExtensionID?: string;
            pbxID?: string;
            productName?: string;
            serverName?: string;
            sessionID?: string;
            tenantID?: string;
        };
        applicationVersion?: string;
        collectIP?: boolean;
        collectLegacyStats?: boolean;
        disableBeforeUnloadHandler?: boolean;
        disablePrecalltest?: boolean;
        siteID?: string;
    };
    callStatsID?: string;
    callStatsSecret?: string;
    channelLastN?: number;
    chromeExtensionBanner?: {
        chromeExtensionsInfo?: Array<{ id: string; path: string; }>;
        edgeUrl?: string;
        url?: string;
    };
    conferenceInfo?: {
        alwaysVisible?: Array<string>;
        autoHide?: Array<string>;
    };
    conferenceRequestUrl?: string;
    connectionIndicators?: {
        autoHide?: boolean;
        autoHideTimeout?: number;
        disableDetails?: boolean;
        disabled?: boolean;
        inactiveDisabled?: boolean;
    };
    constraints?: {
        video?: {
            height?: {
                ideal?: number;
                max?: number;
                min?: number;
            };
        };
    };
    corsAvatarURLs?: Array<string>;
    customParticipantMenuButtons?: Array<{ icon: string; id: string; text: string; }>;
    customToolbarButtons?: Array<{ icon: string; id: string; text: string; }>;
    deeplinking?: IDeeplinkingConfig;
    defaultLanguage?: string;
    defaultLocalDisplayName?: string;
    defaultLogoUrl?: string;
    defaultRemoteDisplayName?: string;
    deploymentInfo?: {
        region?: string;
        shard?: string;
        userRegion?: string;
    };
    deploymentUrls?: {
        downloadAppsUrl?: string;
        userDocumentationURL?: string;
    };
    desktopSharingFrameRate?: {
        max?: number;
        min?: number;
    };
    dialInConfCodeUrl?: string;
    dialInNumbersUrl?: string;
    disable1On1Mode?: boolean | null;
    disableAddingBackgroundImages?: boolean;
    disableAudioLevels?: boolean;
    disableBeforeUnloadHandlers?: boolean;
    disableChatSmileys?: boolean;
    disableDeepLinking?: boolean;
    disableFilmstripAutohiding?: boolean;
    disableFocus?: boolean;
    disableIncomingMessageSound?: boolean;
    disableInitialGUM?: boolean;
    disableInviteFunctions?: boolean;
    disableJoinLeaveSounds?: boolean;
    disableLocalVideoFlip?: boolean;
    disableModeratorIndicator?: boolean;
    disablePolls?: boolean;
    disableProfile?: boolean;
    disableReactions?: boolean;
    disableReactionsModeration?: boolean;
    disableRecordAudioNotification?: boolean;
    disableRemoteMute?: boolean;
    disableRemoveRaisedHandOnFocus?: boolean;
    disableResponsiveTiles?: boolean;
    disableRtx?: boolean;
    disableScreensharingVirtualBackground?: boolean;
    disableSelfView?: boolean;
    disableSelfViewSettings?: boolean;
    disableShortcuts?: boolean;
    disableShowMoreStats?: boolean;
    disableSimulcast?: boolean;
    disableSpeakerStatsSearch?: boolean;
    disableThirdPartyRequests?: boolean;
    disableTileEnlargement?: boolean;
    disableTileView?: boolean;
    disabledNotifications?: Array<string>;
    disabledSounds?: Array<Sounds>;
    doNotFlipLocalVideo?: boolean;
    doNotStoreRoom?: boolean;
    dropbox?: {
        appKey: string;
        redirectURI?: string;
    };
    dynamicBrandingUrl?: string;
    e2ee?: {
        e2eeLabels?: {
            description?: string;
            label?: string;
            tooltip?: string;
            warning?: string;
        };
        externallyManagedKey?: boolean;
        labels?: {
            description?: string;
            label?: string;
            tooltip?: string;
            warning?: string;
        };
    };
    e2eeLabels?: {
        description?: string;
        label?: string;
        tooltip?: string;
        warning?: string;
    };
    e2eping?: {
        enabled?: boolean;
        maxConferenceSize?: number;
        maxMessagesPerSecond?: number;
        numRequests?: number;
    };
    enableAutomaticUrlCopy?: boolean;
    enableCalendarIntegration?: boolean;
    enableClosePage?: boolean;
    enableDisplayNameInStats?: boolean;
    enableEmailInStats?: boolean;
    enableEncodedTransformSupport?: boolean;
    enableForcedReload?: boolean;
    enableIceRestart?: boolean;
    enableInsecureRoomNameWarning?: boolean;
    enableLayerSuspension?: boolean;
    enableLipSync?: boolean;
    enableLobbyChat?: boolean;
    enableNoAudioDetection?: boolean;
    enableNoisyMicDetection?: boolean;
    enableOpusRed?: boolean;
    enableRemb?: boolean;
    enableSaveLogs?: boolean;
    enableTcc?: boolean;
    enableUnifiedOnChrome?: boolean;
    enableWelcomePage?: boolean;
    etherpad_base?: string;
    faceLandmarks?: {
        captureInterval?: number;
        enableDisplayFaceExpressions?: boolean;
        enableFaceCentering?: boolean;
        enableFaceExpressionsDetection?: boolean;
        enableRTCStats?: boolean;
        faceCenteringThreshold?: number;
    };
    feedbackPercentage?: number;
    fileRecordingsEnabled?: boolean;
    fileRecordingsServiceEnabled?: boolean;
    fileRecordingsServiceSharingEnabled?: boolean;
    filmstrip?: {
        disableResizable?: boolean;
        disableStageFilmstrip?: boolean;
        disableTopPanel?: boolean;
        minParticipantCountForTopPanel?: number;
    };
    firefox_fake_device?: string;
    flags?: {
        ssrcRewritingEnabled: boolean;
    };
    focusUserJid?: string;
    gatherStats?: boolean;
    giphy?: {
        displayMode?: 'all' | 'tile' | 'chat';
        enabled?: boolean;
        proxyUrl?: string;
        rating?: 'g' | 'pg' | 'pg-13' | 'r';
        sdkKey?: string;
        tileTime?: number;
    };
    googleApiApplicationClientID?: string;
    gravatar?: {
        baseUrl?: string;
        disabled?: boolean;
    };
    gravatarBaseURL?: string;
    guestDialOutStatusUrl?: string;
    guestDialOutUrl?: string;
    helpCentreURL?: string;
    hiddenPremeetingButtons?: Array<'microphone' | 'camera' | 'select-background' | 'invite' | 'settings'>;
    hideAddRoomButton?: boolean;
    hideConferenceSubject?: boolean;
    hideConferenceTimer?: boolean;
    hideDisplayName?: boolean;
    hideDominantSpeakerBadge?: boolean;
    hideEmailInSettings?: boolean;
    hideLobbyButton?: boolean;
    hideParticipantsStats?: boolean;
    hideRecordingLabel?: boolean;
    hosts?: {
        anonymousdomain?: string;
        authdomain?: string;
        domain: string;
        focus?: string;
        muc: string;
        visitorFocus: string;
    };
    iAmRecorder?: boolean;
    iAmSipGateway?: boolean;
    inviteAppName?: string | null;
    inviteServiceCallFlowsUrl?: string;
    inviteServiceUrl?: string;
    jaasActuatorUrl?: string;
    jaasFeedbackMetadataURL?: string;
    jaasTokenUrl?: string;
    lastNLimits?: {
        [key: number]: number;
    };
    liveStreaming?: {
        dataPrivacyLink?: string;
        enabled?: boolean;
        helpLink?: string;
        termsLink?: string;
        validatorRegExpString?: string;
    };
    liveStreamingEnabled?: boolean;
    lobby?: {
        autoKnock?: boolean;
        enableChat?: boolean;
    };
    localRecording?: {
        disable?: boolean;
        disableSelfRecording?: boolean;
        notifyAllParticipants?: boolean;
    };
    localSubject?: string;
    locationURL?: URL;
    maxFullResolutionParticipants?: number;
    microsoftApiApplicationClientID?: string;
    moderatedRoomServiceUrl?: string;
    mouseMoveCallbackInterval?: number;
    noticeMessage?: string;
    notificationTimeouts?: {
        long?: number;
        medium?: number;
        short?: number;
    };
    notifications?: Array<string>;
    openSharedDocumentOnJoin?: boolean;
    opusMaxAverageBitrate?: number;
    p2p?: {
        backToP2PDelay?: number;
        disabledCodec?: string;
        enableUnifiedOnChrome?: boolean;
        enabled?: boolean;
        iceTransportPolicy?: string;
        preferredCodec?: string;
        stunServers?: Array<{ urls: string; }>;
    };
    participantsPane?: {
        hideModeratorSettingsTab?: boolean;
        hideMoreActionsButton?: boolean;
        hideMuteAllButton?: boolean;
    };
    pcStatsInterval?: number;
    peopleSearchUrl?: string;
    preferredTranscribeLanguage?: string;
    prejoinConfig?: {
        enabled?: boolean;
        hideDisplayName?: boolean;
        hideExtraJoinButtons?: Array<string>;
    };
    prejoinPageEnabled?: boolean;
    readOnlyName?: boolean;
    recordingLimit?: {
        appName?: string;
        appURL?: string;
        limit?: number;
    };
    recordingService?: {
        enabled?: boolean;
        hideStorageWarning?: boolean;
        sharingEnabled?: boolean;
    };
    recordingSharingUrl?: string;
    remoteVideoMenu?: {
        disableGrantModerator?: boolean;
        disableKick?: boolean;
        disablePrivateChat?: boolean;
        disabled?: boolean;
    };
    replaceParticipant?: string;
    requireDisplayName?: boolean;
    resolution?: number;
    roomPasswordNumberOfDigits?: number;
    salesforceUrl?: string;
    screenshotCapture?: {
        enabled?: boolean;
        mode?: 'always' | 'recording';
    };
    securityUi?: {
        disableLobbyPassword?: boolean;
        hideLobbyButton?: boolean;
    };
    serviceUrl?: string;
    sipInviteUrl?: string;
    speakerStats?: {
        disableSearch?: boolean;
        disabled?: boolean;
        order?: Array<'role' | 'name' | 'hasLeft'>;
    };
    speakerStatsOrder?: Array<'role' | 'name' | 'hasLeft'>;
    startAudioMuted?: number;
    startAudioOnly?: boolean;
    startLastN?: number;
    startScreenSharing?: boolean;
    startSilent?: boolean;
    startVideoMuted?: number;
    startWithAudioMuted?: boolean;
    startWithVideoMuted?: boolean;
    stereo?: boolean;
    subject?: string;
    testing?: {
        callStatsThreshold?: number;
        disableE2EE?: boolean;
        mobileXmppWsThreshold?: number;
        noAutoPlayVideo?: boolean;
        p2pTestMode?: boolean;
        testMode?: boolean;
    };
    tileView?: {
        numberOfVisibleTiles?: number;
    };
    tokenAuthUrl?: string;
    toolbarButtons?: Array<ToolbarButtons>;
    toolbarConfig?: {
        alwaysVisible?: boolean;
        autoHideWhileChatIsOpen?: boolean;
        initialTimeout?: number;
        timeout?: number;
    };
    transcribeWithAppLanguage?: boolean;
    transcribingEnabled?: boolean;
    transcription?: {
        autoCaptionOnRecord?: boolean;
        disableStartForAll?: boolean;
        enabled?: boolean;
        preferredLanguage?: string;
        translationLanguages?: Array<string>;
        translationLanguagesHead?: Array<string>;
        useAppLanguage?: boolean;
    };
    useHostPageLocalStorage?: boolean;
    useTurnUdp?: boolean;
    videoQuality?: {
        disabledCodec?: string;
        enforcePreferredCodec?: boolean;
        maxBitratesVideo?: {
            [key: string]: {
                high?: number;
                low?: number;
                standard?: number;
            };
        };
        minHeightForQualityLvl?: {
            [key: number]: string;
        };
        persist?: boolean;
        preferredCodec?: string;
    };
    webhookProxyUrl?: string;
    webrtcIceTcpDisable?: boolean;
    webrtcIceUdpDisable?: boolean;
    websocket?: string;
    websocketKeepAliveUrl?: string;
    welcomePage?: {
        customUrl?: string;
        disabled?: boolean;
    };
    whiteboard?: {
        collabServerBaseUrl?: string;
        enabled?: boolean;
    };
}
