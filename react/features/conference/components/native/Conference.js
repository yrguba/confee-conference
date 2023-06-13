// @flow

import { useIsFocused } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { BackHandler, NativeModules, SafeAreaView, View } from 'react-native';
import { withSafeAreaInsets } from 'react-native-safe-area-context';

import { appNavigate } from '../../../app/actions';
import { FULLSCREEN_ENABLED, PIP_ENABLED, getFeatureFlag } from '../../../base/flags';
import { getParticipantCount } from '../../../base/participants';
import { Container, LoadingIndicator, TintedView } from '../../../base/react';
import { connect } from '../../../base/redux';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { TestConnectionInfo } from '../../../base/testing';
import { ConferenceNotification, isCalendarEnabled } from '../../../calendar-sync';
import { DisplayNameLabel } from '../../../display-name';
import { BrandingImageBackground } from '../../../dynamic-branding/components/native';
import {
    FILMSTRIP_SIZE,
    Filmstrip,
    TileView,
    isFilmstripVisible
} from '../../../filmstrip';
import { CalleeInfoContainer } from '../../../invite';
import { LargeVideo } from '../../../large-video';
import { startKnocking } from '../../../lobby/actions.any';
import { KnockingParticipantList } from '../../../lobby/components/native';
import { getIsLobbyVisible } from '../../../lobby/functions';
import { navigate }
    from '../../../mobile/navigation/components/conference/ConferenceNavigationContainerRef';
import { shouldEnableAutoKnock } from '../../../mobile/navigation/functions';
import { screen } from '../../../mobile/navigation/routes';
import { setPictureInPictureEnabled } from '../../../mobile/picture-in-picture';
import { Captions } from '../../../subtitles/components';
import { setToolboxVisible } from '../../../toolbox/actions';
import { Toolbox } from '../../../toolbox/components/native';
import { isToolboxVisible } from '../../../toolbox/functions';
import {
    AbstractConference,
    abstractMapStateToProps
} from '../AbstractConference';
import type { AbstractProps } from '../AbstractConference';
import { isConnecting } from '../functions';

import AlwaysOnLabels from './AlwaysOnLabels';
import ExpandedLabelPopup from './ExpandedLabelPopup';
import LonelyMeetingExperience from './LonelyMeetingExperience';
import TitleBar from './TitleBar';
import { EXPANDED_LABEL_TIMEOUT } from './constants';
import styles from './styles';


/**
 * The type of the React {@code Component} props of {@link Conference}.
 */
type Props = AbstractProps & {

    /**
     * Application's aspect ratio.
     */
    _aspectRatio: Symbol,

    /**
     * Whether the audio only is enabled or not.
     */
    _audioOnlyEnabled: boolean,

    /**
     * Branding styles for conference.
     */
    _brandingStyles: Object,

    /**
     * Whether the calendar feature is enabled or not.
     */
    _calendarEnabled: boolean,

    /**
     * The indicator which determines that we are still connecting to the
     * conference which includes establishing the XMPP connection and then
     * joining the room. If truthy, then an activity/loading indicator will be
     * rendered.
     */
    _connecting: boolean,

    /**
     * Set to {@code true} when the filmstrip is currently visible.
     */
    _filmstripVisible: boolean,

    /**
     * The indicator which determines whether fullscreen (immersive) mode is enabled.
     */
    _fullscreenEnabled: boolean,

    /**
     * The indicator which determines if the conference type is one to one.
     */
    _isOneToOneConference: boolean,

    /**
     * The indicator which determines if the participants pane is open.
     */
    _isParticipantsPaneOpen: boolean,

    /**
     * The ID of the participant currently on stage (if any).
     */
    _largeVideoParticipantId: string,

    /**
     * Local participant's display name.
     */
    _localParticipantDisplayName: string,

    /**
     * Whether Picture-in-Picture is enabled.
     */
    _pictureInPictureEnabled: boolean,

    /**
     * The indicator which determines whether the UI is reduced (to accommodate
     * smaller display areas).
     */
    _reducedUI: boolean,

    /**
     * The indicator which determines whether the Toolbox is visible.
     */
    _toolboxVisible: boolean,

    /**
     * Indicates if we should auto-knock.
     */
    _shouldEnableAutoKnock: boolean,

    /**
     * Indicates whether the lobby screen should be visible.
     */
    _showLobby: boolean,

    /**
     * Indicates whether the car mode is enabled.
     */
    _startCarMode: boolean,

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: Function,

    /**
    * Object containing the safe area insets.
    */
    insets: Object,

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: Object
};

type State = {

    /**
     * The label that is currently expanded.
     */
    visibleExpandedLabel: ?string
}

/**
 * The conference page of the mobile (i.e. React Native) application.
 */
class Conference extends AbstractConference<Props, State> {
    /**
     * Timeout ref.
     */
    _expandedLabelTimeout: Object;

    /**
     * Initializes a new Conference instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props) {
        super(props);

        this.state = {
            visibleExpandedLabel: undefined
        };

        this._expandedLabelTimeout = React.createRef();

        // Bind event handlers so they are only bound once per instance.
        this._onClick = this._onClick.bind(this);
        this._onHardwareBackPress = this._onHardwareBackPress.bind(this);
        this._setToolboxVisible = this._setToolboxVisible.bind(this);
        this._createOnPress = this._createOnPress.bind(this);
    }

    /**
     * Implements {@link Component#componentDidMount()}. Invoked immediately
     * after this component is mounted.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        const {
            _audioOnlyEnabled,
            _startCarMode,
            navigation
        } = this.props;

        BackHandler.addEventListener('hardwareBackPress', this._onHardwareBackPress);

        if (_audioOnlyEnabled && _startCarMode) {
            navigation.navigate(screen.conference.carmode);
        }
    }

    /**
     * Implements {@code Component#componentDidUpdate}.
     *
     * @inheritdoc
     */
    componentDidUpdate(prevProps) {
        const {
            _shouldEnableAutoKnock,
            _showLobby,
            dispatch
        } = this.props;

        if (!prevProps._showLobby && _showLobby) {
            navigate(screen.lobby.root);

            if (_shouldEnableAutoKnock) {
                dispatch(startKnocking());
            }
        }

        if (prevProps._showLobby && !_showLobby) {
            navigate(screen.conference.main);
        }
    }

    /**
     * Implements {@link Component#componentWillUnmount()}. Invoked immediately
     * before this component is unmounted and destroyed. Disconnects the
     * conference described by the redux store/state.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // Tear handling any hardware button presses for back navigation down.
        BackHandler.removeEventListener('hardwareBackPress', this._onHardwareBackPress);

        clearTimeout(this._expandedLabelTimeout.current);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _brandingStyles
        } = this.props;

        return (
            <Container
                style = { [
                    styles.conference,
                    _brandingStyles
                ] }>
                <BrandingImageBackground />
                { this._renderContent() }
            </Container>
        );
    }

    _onClick: () => void;

    /**
     * Changes the value of the toolboxVisible state, thus allowing us to switch
     * between Toolbox and Filmstrip and change their visibility.
     *
     * @private
     * @returns {void}
     */
    _onClick() {
        this._setToolboxVisible(!this.props._toolboxVisible);
    }

    _onHardwareBackPress: () => boolean;

    /**
     * Handles a hardware button press for back navigation. Enters Picture-in-Picture mode
     * (if supported) or leaves the associated {@code Conference} otherwise.
     *
     * @returns {boolean} Exiting the app is undesired, so {@code true} is always returned.
     */
    _onHardwareBackPress() {
        let p;

        if (this.props._pictureInPictureEnabled) {
            const { PictureInPicture } = NativeModules;

            p = PictureInPicture.enterPictureInPicture();
        } else {
            p = Promise.reject(new Error('PiP not enabled'));
        }

        p.catch(() => {
            this.props.dispatch(appNavigate(undefined));
        });

        return true;
    }

    /**
     * Renders the conference notification badge if the feature is enabled.
     *
     * @private
     * @returns {React$Node}
     */
    _renderConferenceNotification() {
        const { _calendarEnabled, _reducedUI } = this.props;

        return (
            _calendarEnabled && !_reducedUI
                ? <ConferenceNotification />
                : undefined);
    }

    _createOnPress: (string) => void;

    /**
     * Creates a function to be invoked when the onPress of the touchables are
     * triggered.
     *
     * @param {string} label - The identifier of the label that's onLayout is
     * triggered.
     * @returns {Function}
     */
    _createOnPress(label) {
        return () => {
            const { visibleExpandedLabel } = this.state;

            const newVisibleExpandedLabel
                = visibleExpandedLabel === label ? undefined : label;

            clearTimeout(this._expandedLabelTimeout.current);
            this.setState({
                visibleExpandedLabel: newVisibleExpandedLabel
            });

            if (newVisibleExpandedLabel) {
                this._expandedLabelTimeout.current = setTimeout(() => {
                    this.setState({
                        visibleExpandedLabel: undefined
                    });
                }, EXPANDED_LABEL_TIMEOUT);
            }
        };
    }

    /**
     * Renders the content for the Conference container.
     *
     * @private
     * @returns {React$Element}
     */
    _renderContent() {
        const {
            _connecting,
            _isOneToOneConference,
            _largeVideoParticipantId,
            _reducedUI,
            _shouldDisplayTileView,
            _toolboxVisible
        } = this.props;

        if (_reducedUI) {
            return this._renderContentForReducedUi();
        }

        return (
            <>
                {/*
                  * The LargeVideo is the lowermost stacking layer.
                  */
                    _shouldDisplayTileView
                        ? <TileView onClick = { this._onClick } />
                        : <LargeVideo onClick = { this._onClick } />
                }

                {/*
                  * If there is a ringing call, show the callee's info.
                  */
                    <CalleeInfoContainer />
                }

                {/*
                  * The activity/loading indicator goes above everything, except
                  * the toolbox/toolbars and the dialogs.
                  */
                    _connecting
                        && <TintedView>
                            <LoadingIndicator />
                        </TintedView>
                }

                <View
                    pointerEvents = 'box-none'
                    style = { styles.toolboxAndFilmstripContainer }>

                    <Captions onPress = { this._onClick } />

                    {
                        _shouldDisplayTileView || (
                            !_isOneToOneConference
                            && <Container style = { styles.displayNameContainer }>
                                <DisplayNameLabel
                                    participantId = { _largeVideoParticipantId } />
                            </Container>
                        )
                    }

                    <LonelyMeetingExperience />

                    { _shouldDisplayTileView || <><Filmstrip /><Toolbox /></> }
                </View>

                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = {
                        _toolboxVisible
                            ? styles.titleBarSafeViewColor
                            : styles.titleBarSafeViewTransparent }>
                    <TitleBar _createOnPress = { this._createOnPress } />
                </SafeAreaView>
                <SafeAreaView
                    pointerEvents = 'box-none'
                    style = {
                        _toolboxVisible
                            ? [ styles.titleBarSafeViewTransparent, { top: this.props.insets.top + 50 } ]
                            : styles.titleBarSafeViewTransparent
                    }>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.expandedLabelWrapper }>
                        <ExpandedLabelPopup visibleExpandedLabel = { this.state.visibleExpandedLabel } />
                    </View>
                    <View
                        pointerEvents = 'box-none'
                        style = { styles.alwaysOnTitleBar }>
                        {/* eslint-disable-next-line react/jsx-no-bind */}
                        <AlwaysOnLabels createOnPress = { this._createOnPress } />
                    </View>
                    { this._renderNotificationsContainer() }
                    <KnockingParticipantList />
                </SafeAreaView>

                <TestConnectionInfo />
                { this._renderConferenceNotification() }

                {_shouldDisplayTileView && <Toolbox />}
            </>
        );
    }

    /**
     * Renders the content for the Conference container when in "reduced UI" mode.
     *
     * @private
     * @returns {React$Element}
     */
    _renderContentForReducedUi() {
        const { _connecting } = this.props;

        return (
            <>
                <LargeVideo onClick = { this._onClick } />

                {
                    _connecting
                        && <TintedView>
                            <LoadingIndicator />
                        </TintedView>
                }
            </>
        );
    }

    /**
     * Renders a container for notifications to be displayed by the
     * base/notifications feature.
     *
     * @private
     * @returns {React$Element}
     */
    _renderNotificationsContainer() {
        const notificationsStyle = {};

        // In the landscape mode (wide) there's problem with notifications being
        // shadowed by the filmstrip rendered on the right. This makes the "x"
        // button not clickable. In order to avoid that a margin of the
        // filmstrip's size is added to the right.
        //
        // Pawel: after many attempts I failed to make notifications adjust to
        // their contents width because of column and rows being used in the
        // flex layout. The only option that seemed to limit the notification's
        // size was explicit 'width' value which is not better than the margin
        // added here.
        const { _aspectRatio, _filmstripVisible } = this.props;

        if (_filmstripVisible && _aspectRatio !== ASPECT_RATIO_NARROW) {
            notificationsStyle.marginRight = FILMSTRIP_SIZE;
        }

        return super.renderNotificationsContainer(
            {
                style: notificationsStyle
            }
        );
    }

    _setToolboxVisible: (boolean) => void;

    /**
     * Dispatches an action changing the visibility of the {@link Toolbox}.
     *
     * @private
     * @param {boolean} visible - Pass {@code true} to show the
     * {@code Toolbox} or {@code false} to hide it.
     * @returns {void}
     */
    _setToolboxVisible(visible) {
        this.props.dispatch(setToolboxVisible(visible));
    }
}

/**
 * Maps (parts of) the redux state to the associated {@code Conference}'s props.
 *
 * @param {Object} state - The redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state) {
    const { isOpen } = state['features/participants-pane'];
    const { aspectRatio, reducedUI } = state['features/base/responsive-ui'];
    const { backgroundColor } = state['features/dynamic-branding'];
    const { startCarMode } = state['features/base/settings'];
    const { enabled: audioOnlyEnabled } = state['features/base/audio-only'];
    const participantCount = getParticipantCount(state);
    const brandingStyles = backgroundColor ? {
        backgroundColor
    } : undefined;

    return {
        ...abstractMapStateToProps(state),
        _aspectRatio: aspectRatio,
        _audioOnlyEnabled: Boolean(audioOnlyEnabled),
        _brandingStyles: brandingStyles,
        _calendarEnabled: isCalendarEnabled(state),
        _connecting: isConnecting(state),
        _filmstripVisible: isFilmstripVisible(state),
        _fullscreenEnabled: getFeatureFlag(state, FULLSCREEN_ENABLED, true),
        _isOneToOneConference: Boolean(participantCount === 2),
        _isParticipantsPaneOpen: isOpen,
        _largeVideoParticipantId: state['features/large-video'].participantId,
        _pictureInPictureEnabled: getFeatureFlag(state, PIP_ENABLED),
        _reducedUI: reducedUI,
        _shouldEnableAutoKnock: shouldEnableAutoKnock(state),
        _showLobby: getIsLobbyVisible(state),
        _startCarMode: startCarMode,
        _toolboxVisible: isToolboxVisible(state)
    };
}

export default withSafeAreaInsets(connect(_mapStateToProps)(props => {
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            setPictureInPictureEnabled(true);
        } else {
            setPictureInPictureEnabled(false);
        }

        // We also need to disable PiP when we are back on the WelcomePage
        return () => setPictureInPictureEnabled(false);
    }, [ isFocused ]);

    return (
        <Conference { ...props } />
    );
}));
