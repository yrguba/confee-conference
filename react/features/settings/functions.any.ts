import { IReduxState } from '../app/types';
import { IStateful } from '../base/app/types';
import { isNameReadOnly } from '../base/config/functions';
import { SERVER_URL_CHANGE_ENABLED } from '../base/flags/constants';
import { getFeatureFlag } from '../base/flags/functions';
import i18next, { DEFAULT_LANGUAGE, LANGUAGES } from '../base/i18n/i18next';
import {
    getLocalParticipant,
    isLocalParticipantModerator
} from '../base/participants/functions';
import { toState } from '../base/redux/functions';
import { getHideSelfView } from '../base/settings/functions';
import { parseStandardURIString } from '../base/util/uri';
import { isStageFilmstripEnabled } from '../filmstrip/functions';
import { isFollowMeActive } from '../follow-me/functions';
import { getParticipantsPaneConfig } from '../participants-pane/functions';
import { isReactionsEnabled } from '../reactions/functions.any';

import { SS_DEFAULT_FRAME_RATE, SS_SUPPORTED_FRAMERATES } from './constants';

/**
 * Used for web. Indicates if the setting section is enabled.
 *
 * @param {string} settingName - The name of the setting section as defined in
 * interface_config.js and SettingsMenu.js.
 * @returns {boolean} True to indicate that the given setting section
 * is enabled, false otherwise.
 */
export function isSettingEnabled(settingName: string) {
    return interfaceConfig.SETTINGS_SECTIONS.includes(settingName);
}

/**
 * Returns true if user is allowed to change Server URL.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that user can change Server URL, false otherwise.
 */
export function isServerURLChangeEnabled(stateful: IStateful) {
    const state = toState(stateful);
    const flag = getFeatureFlag(state, SERVER_URL_CHANGE_ENABLED, true);

    return flag;
}

/**
 * Normalizes a URL entered by the user.
 * FIXME: Consider adding this to base/util/uri.
 *
 * @param {string} url - The URL to validate.
 * @returns {string|null} - The normalized URL, or null if the URL is invalid.
 */
export function normalizeUserInputURL(url: string) {
    /* eslint-disable no-param-reassign */

    if (url) {
        url = url.replace(/\s/g, '').toLowerCase();

        const urlRegExp = new RegExp('^(\\w+://)?(.+)$');
        const urlComponents = urlRegExp.exec(url);

        if (urlComponents && (!urlComponents[1]
                || !urlComponents[1].startsWith('http'))) {
            url = `https://${urlComponents[2]}`;
        }

        const parsedURI = parseStandardURIString(url);

        if (!parsedURI.host) {
            return null;
        }

        return parsedURI.toString();
    }

    return url;

    /* eslint-enable no-param-reassign */
}

/**
 * Returns the notification types and their user selected configuration.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The section of notifications to be configured.
 */
export function getNotificationsMap(stateful: IStateful) {
    const state = toState(stateful);
    const { notifications } = state['features/base/config'];
    const { userSelectedNotifications } = state['features/base/settings'];

    if (!userSelectedNotifications) {
        return {};
    }

    return Object.keys(userSelectedNotifications)
        .filter(key => !notifications || notifications.includes(key))
        .reduce((notificationsMap, key) => {
            return {
                ...notificationsMap,
                [key]: userSelectedNotifications[key]
            };
        }, {});
}

/**
 * Returns the properties for the "More" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "More" tab from settings dialog.
 */
export function getMoreTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const framerate = state['features/screen-share'].captureFrameRate ?? SS_DEFAULT_FRAME_RATE;
    const language = i18next.language || DEFAULT_LANGUAGE;
    const configuredTabs = interfaceConfig.SETTINGS_SECTIONS || [];
    const enabledNotifications = getNotificationsMap(stateful);
    const stageFilmstripEnabled = isStageFilmstripEnabled(state);

    // when self view is controlled by the config we hide the settings
    const { disableSelfView, disableSelfViewSettings } = state['features/base/config'];

    return {
        currentFramerate: framerate,
        currentLanguage: language,
        desktopShareFramerates: SS_SUPPORTED_FRAMERATES,
        disableHideSelfView: disableSelfViewSettings || disableSelfView,
        hideSelfView: getHideSelfView(state),
        languages: LANGUAGES,
        showLanguageSettings: configuredTabs.includes('language'),
        enabledNotifications,
        showNotificationsSettings: Object.keys(enabledNotifications).length > 0,
        showPrejoinPage: !state['features/base/settings'].userSelectedSkipPrejoin,
        showPrejoinSettings: state['features/base/config'].prejoinConfig?.enabled,
        maxStageParticipants: state['features/base/settings'].maxStageParticipants,
        stageFilmstripEnabled
    };
}

/**
 * Returns the properties for the "More" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "More" tab from settings dialog.
 */
export function getModeratorTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const {
        conference,
        followMeEnabled,
        startAudioMutedPolicy,
        startVideoMutedPolicy,
        startReactionsMuted
    } = state['features/base/conference'];
    const { disableReactionsModeration } = state['features/base/config'];
    const followMeActive = isFollowMeActive(state);
    const showModeratorSettings = shouldShowModeratorSettings(state);

    // The settings sections to display.
    return {
        showModeratorSettings: Boolean(conference && showModeratorSettings),
        disableReactionsModeration: Boolean(disableReactionsModeration),
        followMeActive: Boolean(conference && followMeActive),
        followMeEnabled: Boolean(conference && followMeEnabled),
        startReactionsMuted: Boolean(conference && startReactionsMuted),
        startAudioMuted: Boolean(conference && startAudioMutedPolicy),
        startVideoMuted: Boolean(conference && startVideoMutedPolicy)
    };
}

/**
 * Returns true if moderator tab in settings should be visible/accessible.
 *
 * @param {(Function|Object)} stateful - The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {boolean} True to indicate that moderator tab should be visible, false otherwise.
 */
export function shouldShowModeratorSettings(stateful: IStateful) {
    const state = toState(stateful);
    const { hideModeratorSettingsTab } = getParticipantsPaneConfig(state);
    const hasModeratorRights = Boolean(isSettingEnabled('moderator') && isLocalParticipantModerator(state));

    return hasModeratorRights && !hideModeratorSettingsTab;
}

/**
 * Returns the properties for the "Profile" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "Profile" tab from settings
 * dialog.
 */
export function getProfileTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const {
        authEnabled,
        authLogin,
        conference
    } = state['features/base/conference'];
    const { hideEmailInSettings } = state['features/base/config'];
    const localParticipant = getLocalParticipant(state);

    return {
        authEnabled: Boolean(conference && authEnabled),
        authLogin,
        displayName: localParticipant?.name,
        email: localParticipant?.email,
        readOnlyName: isNameReadOnly(state),
        hideEmailInSettings
    };
}

/**
 * Returns the properties for the "Sounds" tab from settings dialog from Redux
 * state.
 *
 * @param {(Function|Object)} stateful -The (whole) redux state, or redux's
 * {@code getState} function to be used to retrieve the state.
 * @returns {Object} - The properties for the "Sounds" tab from settings
 * dialog.
 */
export function getSoundsTabProps(stateful: IStateful) {
    const state = toState(stateful);
    const {
        soundsIncomingMessage,
        soundsParticipantJoined,
        soundsParticipantKnocking,
        soundsParticipantLeft,
        soundsTalkWhileMuted,
        soundsReactions
    } = state['features/base/settings'];
    const enableReactions = isReactionsEnabled(state);
    const moderatorMutedSoundsReactions = state['features/base/conference'].startReactionsMuted ?? false;

    return {
        soundsIncomingMessage,
        soundsParticipantJoined,
        soundsParticipantKnocking,
        soundsParticipantLeft,
        soundsTalkWhileMuted,
        soundsReactions,
        enableReactions,
        moderatorMutedSoundsReactions
    };
}

/**
 * Returns the visibility state of the audio settings.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getAudioSettingsVisibility(state: IReduxState) {
    return state['features/settings'].audioSettingsVisible;
}

/**
 * Returns the visibility state of the video settings.
 *
 * @param {Object} state - The state of the application.
 * @returns {boolean}
 */
export function getVideoSettingsVisibility(state: IReduxState) {
    return state['features/settings'].videoSettingsVisible;
}
