/* eslint-disable lines-around-comment  */

import _ from 'lodash';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import {
    Alert,
    Linking,
    NativeModules,
    Platform,
    ScrollView,
    Text,
    View
} from 'react-native';
import { Divider } from 'react-native-paper';


import { getDefaultURL } from '../../../app/functions.native';
import { IReduxState } from '../../../app/types';
// @ts-ignore
import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n/functions';
// @ts-ignore
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { getLocalParticipant } from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';
import { updateSettings } from '../../../base/settings/actions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import Switch from '../../../base/ui/components/native/Switch';
// @ts-ignore
import { BUTTON_TYPES } from '../../../base/ui/constants.any';
// @ts-ignore
import { AVATAR_SIZE } from '../../../welcome/components/styles';
import { isServerURLChangeEnabled, normalizeUserInputURL } from '../../functions.native';

// @ts-ignore
import FormRow from './FormRow';
// @ts-ignore
import FormSection from './FormSection';
// @ts-ignore
import styles from './styles';

/**
 * Application information module.
 */
const { AppInfo } = NativeModules;

/**
 * The URL at which the terms (of service/use) are available to the user.
 */
const TERMS_URL = 'https://jitsi.org/meet/terms';

/**
 * The URL at which the privacy policy is available to the user.
 */
const PRIVACY_URL = 'https://jitsi.org/meet/privacy';


const DEFAULT_HELP_CENTRE_URL = 'https://web-cdn.jitsi.net/faq/meet-faq.html';

interface IState {

    /**
     * State variable for the disable call integration switch.
     */
    disableCallIntegration: boolean;

    /**
     * State variable for the disable crash reporting switch.
     */
    disableCrashReporting: boolean;

    /**
     * State variable for the disable p2p switch.
     */
    disableP2P: boolean;

    /**
     * Whether the self view is disabled or not.
     */
    disableSelfView: boolean;

    /**
     * State variable for the display name field.
     */
    displayName: string;

    /**
     * State variable for the email field.
     */
    email: string;

    /**
     * State variable for the server URL field.
     */
    serverURL: string;

    /**
     * State variable for start car mode.
     */
    startCarMode: boolean;

    /**
     * State variable for the start with audio muted switch.
     */
    startWithAudioMuted: boolean;

    /**
     * State variable for the start with video muted switch.
     */
    startWithVideoMuted: boolean;
}

/**
 * The type of the React {@code Component} props of
 * {@link SettingsView}.
 */
interface IProps extends WithTranslation {

    /**
     * The URL for when the help link.
     *
     * @protected
     */
    _helpCentreUrl: string;

    /**
     * The ID of the local participant.
     */
    _localParticipantId: string;

    /**
     * The default URL for when there is no custom URL set in the settings.
     *
     * @protected
     */
    _serverURL: string;

    /**
     * Flag indicating if URL can be changed by user.
     *
     * @protected
     */
    _serverURLChangeEnabled: boolean;

    /**
     * The current settings object.
     */
    _settings: {
        disableCallIntegration: boolean;
        disableCrashReporting: boolean;
        disableP2P: boolean;
        disableSelfView: boolean;
        displayName: string;
        email: string;
        serverURL: string;
        startCarMode: boolean;
        startWithAudioMuted: boolean;
        startWithVideoMuted: boolean;
    };

    /**
     * Whether {@link SettingsView} is visible.
     *
     * @protected
     */
    _visible: boolean;

    /**
     * Add bottom padding to the screen.
     */
    addBottomInset?: boolean;

    /**
     * Redux store dispatch function.
     */
    dispatch: Function;

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object;

    /**
     * Bounce when scrolling.
     */
    scrollBounces?: boolean;
}

/**
 * The native container rendering the app settings page.
 */
class SettingsView extends Component<IProps, IState> {
    _urlField: Object;

    /**
     *
     * Initializes a new {@code SettingsView} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        const {
            disableCallIntegration,
            disableCrashReporting,
            disableP2P,
            disableSelfView,
            displayName,
            email,
            serverURL,
            startCarMode,
            startWithAudioMuted,
            startWithVideoMuted
        } = props._settings || {};

        this.state = {
            disableCallIntegration,
            disableCrashReporting,
            disableP2P,
            disableSelfView,
            displayName: displayName || '',
            email: email || '',
            serverURL: serverURL || '',
            startCarMode,
            startWithAudioMuted,
            startWithVideoMuted
        };

        // Bind event handlers so they are only bound once per instance.
        this._onBlurServerURL = this._onBlurServerURL.bind(this);
        this._onChangeDisplayName = this._onChangeDisplayName.bind(this);
        this._onChangeEmail = this._onChangeEmail.bind(this);
        this._onChangeServerURL = this._onChangeServerURL.bind(this);
        this._onClose = this._onClose.bind(this);
        this._onDisableCallIntegration = this._onDisableCallIntegration.bind(this);
        this._onDisableCrashReporting = this._onDisableCrashReporting.bind(this);
        this._onDisableP2P = this._onDisableP2P.bind(this);
        this._onDisableSelfView = this._onDisableSelfView.bind(this);
        this._onStartAudioMutedChange
            = this._onStartAudioMutedChange.bind(this);
        this._onStartCarmodeInLowBandwidthMode
            = this._onStartCarmodeInLowBandwidthMode.bind(this);
        this._onStartVideoMutedChange
            = this._onStartVideoMutedChange.bind(this);
        this._setURLFieldReference = this._setURLFieldReference.bind(this);
        this._onShowHelpPressed = this._onShowHelpPressed.bind(this);
        this._onShowPrivacyPressed = this._onShowPrivacyPressed.bind(this);
        this._onShowTermsPressed = this._onShowTermsPressed.bind(this);
        this._showURLAlert = this._showURLAlert.bind(this);
    }

    /**
     * Updates and syncs settings.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps) {
        const { _settings } = this.props;

        if (!_.isEqual(prevProps._settings, _settings)) {
            // @ts-ignore
            // eslint-disable-next-line react/no-did-update-set-state
            this.setState(_settings);
        }
    }

    /**
     * Implements React's {@link Component#render()}, renders the settings page.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            disableCallIntegration,
            disableCrashReporting,
            disableP2P,
            disableSelfView,
            displayName,
            email,
            serverURL,
            startCarMode,
            startWithAudioMuted,
            startWithVideoMuted
        } = this.state;

        const {
            addBottomInset = false,
            scrollBounces = false,
            t
        } = this.props;

        return (
            <JitsiScreen
                disableForcedKeyboardDismiss = { true }
                safeAreaInsets = { [ addBottomInset && 'bottom', 'left', 'right' ].filter(Boolean) }
                style = { styles.settingsViewContainer }>
                <ScrollView bounces = { scrollBounces }>
                    <View style = { styles.avatarContainer }>
                        <Avatar
                            participantId = { this.props._localParticipantId }
                            size = { AVATAR_SIZE } />
                    </View>
                    {/* @ts-ignore */}
                    <FormSection
                        label = 'settingsView.profileSection'>
                        <Input
                            // @ts-ignore
                            customStyles = {{ container: styles.customContainer }}
                            label = { t('settingsView.displayName') }
                            onChange = { this._onChangeDisplayName }
                            placeholder = { t('settingsView.displayNamePlaceholderText') }
                            textContentType = { 'name' } // iOS only
                            value = { displayName } />
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        <Input
                            // @ts-ignore
                            autoCapitalize = 'none'
                            customStyles = {{ container: styles.customContainer }}
                            keyboardType = { 'email-address' }
                            label = { t('settingsView.email') }
                            onChange = { this._onChangeEmail }
                            placeholder = { t('settingsView.emailPlaceholderText') }
                            textContentType = { 'emailAddress' } // iOS only
                            value = { email } />
                    </FormSection>
                    {/* @ts-ignore */}
                    <FormSection
                        label = 'settingsView.conferenceSection'>
                        <Input
                            // @ts-ignore
                            autoCapitalize = 'none'
                            customStyles = {{ container: styles.customContainer }}
                            editable = { this.props._serverURLChangeEnabled }
                            keyboardType = { 'url' }
                            label = { t('settingsView.serverURL') }
                            onBlur = { this._onBlurServerURL }
                            onChange = { this._onChangeServerURL }
                            placeholder = { this.props._serverURL }
                            textContentType = { 'URL' } // iOS only
                            value = { serverURL } />
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        <FormRow label = 'settingsView.startCarModeInLowBandwidthMode'>
                            <Switch
                                checked = { startCarMode }
                                // @ts-ignore
                                onChange = { this._onStartCarmodeInLowBandwidthMode } />
                        </FormRow>
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        <FormRow
                            label = 'settingsView.startWithAudioMuted'>
                            <Switch
                                checked = { startWithAudioMuted }
                                // @ts-ignore
                                onChange = { this._onStartAudioMutedChange } />
                        </FormRow>
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        <FormRow label = 'settingsView.startWithVideoMuted'>
                            <Switch
                                checked = { startWithVideoMuted }
                                // @ts-ignore
                                onChange = { this._onStartVideoMutedChange } />
                        </FormRow>
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        {/*<FormRow label = 'videothumbnail.hideSelfView'>*/}
                        {/*    <Switch*/}
                        {/*        checked = { disableSelfView }*/}
                        {/*        // @ts-ignore*/}
                        {/*        onChange = { this._onDisableSelfView } />*/}
                        {/*</FormRow>*/}
                    </FormSection>
                    {/* @ts-ignore */}
                    <FormSection
                        label = 'settingsView.links'>
                        <Button
                            accessibilityLabel = 'settingsView.help'
                            labelKey = 'settingsView.help'
                            onClick = { this._onShowHelpPressed }
                            type = { BUTTON_TYPES.TERTIARY } />
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        <Button
                            accessibilityLabel = 'settingsView.terms'
                            labelKey = 'settingsView.terms'
                            onClick = { this._onShowTermsPressed }
                            type = { BUTTON_TYPES.TERTIARY } />
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        <Button
                            accessibilityLabel = 'settingsView.privacy'
                            labelKey = 'settingsView.privacy'
                            onClick = { this._onShowPrivacyPressed }
                            type = { BUTTON_TYPES.TERTIARY } />
                    </FormSection>
                    {/* @ts-ignore */}
                    <FormSection
                        label = 'settingsView.buildInfoSection'>
                        {/* @ts-ignore */}
                        <FormRow
                            label = 'settingsView.version'>
                            <Text style = { styles.text }>
                                {`${AppInfo.version} build ${AppInfo.buildNumber}`}
                            </Text>
                        </FormRow>
                    </FormSection>
                    {/* @ts-ignore */}
                    <FormSection
                        label = 'settingsView.advanced'>
                        { Platform.OS === 'android' && (
                            <>
                                <FormRow
                                    label = 'settingsView.disableCallIntegration'>
                                    <Switch
                                        checked = { disableCallIntegration }
                                        // @ts-ignore
                                        onChange = { this._onDisableCallIntegration } />
                                </FormRow>
                                {/* @ts-ignore */}
                                <Divider style = { styles.fieldSeparator } />
                            </>
                        )}
                        <FormRow
                            label = 'settingsView.disableP2P'>
                            <Switch
                                checked = { disableP2P }
                                // @ts-ignore
                                onChange = { this._onDisableP2P } />
                        </FormRow>
                        {/* @ts-ignore */}
                        <Divider style = { styles.fieldSeparator } />
                        {AppInfo.GOOGLE_SERVICES_ENABLED && (
                            <FormRow
                                fieldSeparator = { true }
                                label = 'settingsView.disableCrashReporting'>
                                <Switch
                                    checked = { disableCrashReporting }
                                    // @ts-ignore
                                    onChange = { this._onDisableCrashReporting } />
                            </FormRow>
                        )}
                    </FormSection>
                </ScrollView>
            </JitsiScreen>
        );
    }

    /**
     * Handler the server URL lose focus event. Here we validate the server URL
     * and update it to the normalized version, or show an error if incorrect.
     *
     * @private
     * @returns {void}
     */
    _onBlurServerURL() {
        this._processServerURL(false /* hideOnSuccess */);
    }

    /**
     * Handles the display name field value change.
     *
     * @param {string} displayName - The value typed in the name field.
     * @protected
     * @returns {void}
     */
    _onChangeDisplayName(displayName: string) {
        this.setState({
            displayName
        });

        this._updateSettings({
            displayName
        });
    }

    /**
     * Handles the email field value change.
     *
     * @param {string} email - The value typed in the email field.
     * @protected
     * @returns {void}
     */
    _onChangeEmail(email: string) {
        this.setState({
            email
        });

        this._updateSettings({
            email
        });
    }

    /**
     * Handles the server name field value change.
     *
     * @param {string} serverURL - The server URL typed in the server field.
     * @protected
     * @returns {void}
     */
    _onChangeServerURL(serverURL: string) {
        this.setState({
            serverURL
        });

        this._updateSettings({
            serverURL
        });
    }

    /**
     * Handles the disable call integration change event.
     *
     * @param {boolean} disableCallIntegration - The new value
     * option.
     * @private
     * @returns {void}
     */
    _onDisableCallIntegration(disableCallIntegration: boolean) {
        this.setState({
            disableCallIntegration
        });

        this._updateSettings({
            disableCallIntegration
        });
    }

    /**
     * Handles the disable P2P change event.
     *
     * @param {boolean} disableP2P - The new value
     * option.
     * @private
     * @returns {void}
     */
    _onDisableP2P(disableP2P: boolean) {
        this.setState({
            disableP2P
        });

        this._updateSettings({
            disableP2P
        });
    }

    /** .
     * Handles the disable self view change event.
     *
     * @param {boolean} disableSelfView - The new value.
     * @private
     * @returns {void}
     */
    _onDisableSelfView(disableSelfView: boolean) {
        this.setState({
            disableSelfView
        });

        this._updateSettings({
            disableSelfView
        });
    }

    /** .
     * Handles car mode in low bandwidth mode.
     *
     * @param {boolean} startCarMode - The new value.
     * @private
     * @returns {void}
     */
    _onStartCarmodeInLowBandwidthMode(startCarMode: boolean) {
        this.setState({
            startCarMode
        });

        this._updateSettings({
            startCarMode
        });
    }

    /**
     * Handles the disable crash reporting change event.
     *
     * @param {boolean} disableCrashReporting - The new value
     * option.
     * @private
     * @returns {void}
     */
    _onDisableCrashReporting(disableCrashReporting: boolean) {
        if (disableCrashReporting) {
            this._showCrashReportingDisableAlert();
        } else {
            this._disableCrashReporting(disableCrashReporting);
        }
    }

    /**
     * Callback to be invoked on closing the modal. Also invokes normalizeUserInputURL to validate
     * the URL entered by the user.
     *
     * @returns {boolean} - True if the modal can be closed.
     */
    _onClose() {
        return this._processServerURL(true /* hideOnSuccess */);
    }

    /**
     * Handles the start audio muted change event.
     *
     * @param {boolean} startWithAudioMuted - The new value for the start audio muted
     * option.
     * @protected
     * @returns {void}
     */
    _onStartAudioMutedChange(startWithAudioMuted: boolean) {
        this.setState({
            startWithAudioMuted
        });

        this._updateSettings({
            startWithAudioMuted
        });
    }

    /**
     * Handles the start video muted change event.
     *
     * @param {boolean} startWithVideoMuted - The new value for the start video muted
     * option.
     * @protected
     * @returns {void}
     */
    _onStartVideoMutedChange(startWithVideoMuted: boolean) {
        this.setState({
            startWithVideoMuted
        });

        this._updateSettings({
            startWithVideoMuted
        });
    }

    /**
     * Processes the server URL. It normalizes it and an error alert is
     * displayed in case it's incorrect.
     *
     * @param {boolean} hideOnSuccess - True if the dialog should be hidden if
     * normalization / validation succeeds, false otherwise.
     * @private
     * @returns {void}
     */
    _processServerURL(hideOnSuccess: boolean) {
        // @ts-ignore
        const { serverURL } = this.props._settings;
        const normalizedURL = normalizeUserInputURL(serverURL);

        if (normalizedURL === null) {
            this._showURLAlert();

            return false;
        }

        this._onChangeServerURL(normalizedURL);

        return hideOnSuccess;
    }

    /**
     *  Stores a reference to the URL field for later use.
     *
     * @param {Object} component - The field component.
     * @protected
     * @returns {void}
     */
    _setURLFieldReference(component: object) {
        this._urlField = component;
    }

    /**
     * Shows an alert telling the user that the URL he/she entered was invalid.
     *
     * @returns {void}
     */
    _showURLAlert() {
        const { t } = this.props;

        Alert.alert(
            t('settingsView.alertTitle'),
            t('settingsView.alertURLText'),
            [
                {
                    // @ts-ignore
                    onPress: () => this._urlField.focus(),
                    text: t('settingsView.alertOk')
                }
            ]
        );
    }

    /**
     * Opens the help url into the browser.
     *
     * @returns {void}
     */
    _onShowHelpPressed() {
        Linking.openURL(this.props._helpCentreUrl);
    }

    /**
     * Opens the privacy url into the browser.
     *
     * @returns {void}
     */
    _onShowPrivacyPressed() {
        Linking.openURL(PRIVACY_URL);
    }

    /**
     * Opens the terms url into the browser.
     *
     * @returns {void}
     */
    _onShowTermsPressed() {
        Linking.openURL(TERMS_URL);
    }

    /**
     * Shows an alert warning the user about disabling crash reporting.
     *
     * @returns {void}
     */
    _showCrashReportingDisableAlert() {
        const { t } = this.props;

        Alert.alert(
            t('settingsView.alertTitle'),
            t('settingsView.disableCrashReportingWarning'),
            [
                {
                    onPress: () => this._disableCrashReporting(true),
                    text: t('settingsView.alertOk')
                },
                {
                    text: t('settingsView.alertCancel')
                }
            ]
        );
    }

    /**
     * Updates the settings and sets state for disableCrashReporting.
     *
     * @param {boolean} disableCrashReporting - Whether crash reporting is disabled or not.
     * @returns {void}
     */
    _disableCrashReporting(disableCrashReporting: boolean) {
        this.setState({
            disableCrashReporting
        });

        this._updateSettings({
            disableCrashReporting
        });
    }

    /**
     * Updates the persisted settings on any change.
     *
     * @param {Object} updateObject - The partial update object for the
     * settings.
     * @private
     * @returns {void}
     */
    _updateSettings(updateObject: Object) {
        const { dispatch } = this.props;

        dispatch(updateSettings(updateObject));
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    const localParticipant = getLocalParticipant(state);

    return {
        _helpCentreUrl: state['features/base/config'].helpCentreURL || DEFAULT_HELP_CENTRE_URL,
        _localParticipantId: localParticipant?.id,
        _serverURL: getDefaultURL(state),
        _serverURLChangeEnabled: isServerURLChangeEnabled(state),
        _settings: state['features/base/settings'],
        _visible: state['features/settings'].visible
    };
}

export default translate(connect(_mapStateToProps)(SettingsView));
