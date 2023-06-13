/* eslint-disable lines-around-comment */
import { Theme } from '@mui/material';
import { withStyles } from '@mui/styles';
import clsx from 'clsx';
import debounce from 'lodash/debounce';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import { createScreenSharingIssueEvent } from '../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../analytics/functions';
import { IReduxState } from '../../../app/types';
// @ts-ignore
import { Avatar } from '../../../base/avatar';
import { isMobileBrowser } from '../../../base/environment/utils';
import { JitsiTrackEvents } from '../../../base/lib-jitsi-meet';
// @ts-ignore
import { VideoTrack } from '../../../base/media';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { pinParticipant } from '../../../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantByIdOrUndefined,
    hasRaisedHand,
    isLocalScreenshareParticipant,
    isScreenShareParticipant,
    isWhiteboardParticipant
} from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import { ASPECT_RATIO_NARROW } from '../../../base/responsive-ui/constants';
import { isTestModeEnabled } from '../../../base/testing/functions';
import { trackStreamingStatusChanged, updateLastTrackVideoMediaEvent } from '../../../base/tracks/actions';
import {
    getLocalAudioTrack,
    getTrackByMediaTypeAndParticipant,
    getVideoTrackByParticipant
} from '../../../base/tracks/functions';
import { getVideoObjectPosition } from '../../../face-landmarks/functions';
import { hideGif, showGif } from '../../../gifs/actions';
import { getGifDisplayMode, getGifForParticipant } from '../../../gifs/functions';
// @ts-ignore
import { PresenceLabel } from '../../../presence-status';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import { togglePinStageParticipant } from '../../actions';
import {
    DISPLAY_MODE_TO_CLASS_NAME,
    DISPLAY_VIDEO,
    FILMSTRIP_TYPE,
    SHOW_TOOLBAR_CONTEXT_MENU_AFTER,
    THUMBNAIL_TYPE,
    VIDEO_TEST_EVENTS
} from '../../constants';
import {
    computeDisplayModeFromInput,
    getActiveParticipantsIds,
    getDisplayModeInput,
    getThumbnailTypeFromLayout,
    isStageFilmstripAvailable,
    isVideoPlayable,
    showGridInVerticalView
} from '../../functions';

// @ts-ignore
import ThumbnailAudioIndicator from './ThumbnailAudioIndicator';
import ThumbnailBottomIndicators from './ThumbnailBottomIndicators';
import ThumbnailTopIndicators from './ThumbnailTopIndicators';
// @ts-ignore
import VirtualScreenshareParticipant from './VirtualScreenshareParticipant';
/* eslint-enable lines-around-comment */

/**
 * The type of the React {@code Component} state of {@link Thumbnail}.
 */
export interface IState {

    /**
     * Indicates that the canplay event has been received.
     */
    canPlayEventReceived: boolean;

    /**
     * The current display mode of the thumbnail.
     */
    displayMode: number;

    /**
     * Indicates whether the thumbnail is hovered or not.
     */
    isHovered: boolean;

    /**
     * Whether popover is visible or not.
     */
    popoverVisible: boolean;
}

/**
 * The type of the React {@code Component} props of {@link Thumbnail}.
 */
export interface IProps {

    /**
     * The audio track related to the participant.
     */
    _audioTrack?: Object;

    /**
     * Indicates whether the local video flip feature is disabled or not.
     */
    _disableLocalVideoFlip: boolean;

    /**
     * Indicates whether enlargement of tiles to fill the available space is disabled.
     */
    _disableTileEnlargement: boolean;

    /**
     * URL of GIF sent by this participant, null if there's none.
     */
    _gifSrc?: string;

    /**
     * The height of the Thumbnail.
     */
    _height: number;

    /**
     * Whether or not the participant is displayed on the stage filmstrip.
     * Used to hide the video from the vertical filmstrip.
     */
    _isActiveParticipant: boolean;

    /**
     * Indicates whether audio only mode is enabled.
     */
    _isAudioOnly: boolean;

    /**
     * Indicates whether the participant associated with the thumbnail is displayed on the large video.
     */
    _isCurrentlyOnLargeVideo: boolean;

    /**
     * Disable/enable the dominant speaker indicator.
     */
    _isDominantSpeakerDisabled: boolean;

    /**
     * Indicates whether the thumbnail should be hidden or not.
     */
    _isHidden: boolean;

    /**
     * Whether we are currently running in a mobile browser.
     */
    _isMobile: boolean;

    /**
     * Whether we are currently running in a mobile browser in portrait orientation.
     */
    _isMobilePortrait: boolean;

    /**
     * Indicates whether the participant is screen sharing.
     */
    _isScreenSharing: boolean;

    /**
     * Indicates whether testing mode is enabled.
     */
    _isTestModeEnabled: boolean;

    /**
     * Indicates whether the video associated with the thumbnail is playable.
     */
    _isVideoPlayable: boolean;

    /**
     * Indicates whether the participant is a virtual screen share participant. This prop is behind the
     * sourceNameSignaling feature flag.
     */
    _isVirtualScreenshareParticipant: boolean;

    /**
     * The current local video flip setting.
     */
    _localFlipX: boolean;

    /**
     * An object with information about the participant related to the thumbnail.
     */
    _participant: IParticipant;

    /**
     * Whether or not the participant has the hand raised.
     */
    _raisedHand: boolean;

    /**
     * Whether or not to display a tint background over tile.
     */
    _shouldDisplayTintBackground: boolean;

    /**
     * Whether or not the current layout is stage filmstrip layout.
     */
    _stageFilmstripLayout: boolean;

    /**
     * Whether or not the participants are displayed on stage.
     * (and not screensharing or shared video; used to determine
     * whether or not the display the participant video in the vertical filmstrip).
     */
    _stageParticipantsVisible: boolean;

    /**
     * The type of thumbnail to display.
     */
    _thumbnailType: string;

    /**
     * The video object position for the participant.
     */
    _videoObjectPosition: string;

    /**
     * The video track that will be displayed in the thumbnail.
     */
    _videoTrack?: any;

    /**
     * The width of the thumbnail.
     */
    _width: number;

    /**
     * An object containing CSS classes.
     */
    classes: any;

    /**
     * The redux dispatch function.
     */
    dispatch: Function;

    /**
     * The type of filmstrip the tile is displayed in.
     */
    filmstripType: string;

    /**
     * The horizontal offset in px for the thumbnail. Used to center the thumbnails from the last row in tile view.
     */
    horizontalOffset: number;

    /**
     * The ID of the participant related to the thumbnail.
     */
    participantID?: string;

    /**
     * Styles that will be set to the Thumbnail's main span element.
     */
    style?: any;

    /**
     * The width of the thumbnail. Used for expanding the width of the thumbnails on last row in case
     * there is empty space.
     */
    width?: number;
}

const defaultStyles = (theme: Theme) => {
    return {
        indicatorsContainer: {
            position: 'absolute' as const,
            padding: theme.spacing(1),
            zIndex: 10,
            width: '100%',
            boxSizing: 'border-box' as const,
            display: 'flex',
            left: 0,

            '&.tile-view-mode': {
                padding: theme.spacing(2)
            }
        },

        indicatorsTopContainer: {
            top: 0,
            justifyContent: 'space-between'
        },

        indicatorsBottomContainer: {
            bottom: 0
        },

        indicatorsBackground: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            maxWidth: '100%',
            overflow: 'hidden',

            '&:not(:empty)': {
                padding: '4px 8px'
            },

            '& > *:not(:last-child)': {
                marginRight: '8px'
            }
        },

        containerBackground: {
            position: 'absolute' as const,
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
            borderRadius: '4px',
            backgroundColor: theme.palette.ui02
        },

        borderIndicator: {
            position: 'absolute' as const,
            width: '100%',
            height: '100%',
            zIndex: 9,
            borderRadius: '4px',
            pointerEvents: 'none' as const
        },

        borderIndicatorOnTop: {
            zIndex: 11
        },

        activeSpeaker: {
            '& .active-speaker-indicator': {
                boxShadow: `inset 0px 0px 0px 3px ${theme.palette.action01Hover} !important`
            }
        },

        raisedHand: {
            '& .raised-hand-border': {
                boxShadow: `inset 0px 0px 0px 2px ${theme.palette.warning02} !important`
            }
        },

        gif: {
            position: 'absolute' as const,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: theme.palette.ui02,

            '& img': {
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                flexGrow: '1'
            }
        },

        tintBackground: {
            position: 'absolute' as const,
            zIndex: 1,
            width: '100%',
            height: '100%',
            backgroundColor: `${theme.palette.uiBackground}`,
            opacity: 0.8
        }
    };
};

/**
 * Implements a thumbnail.
 *
 * @augments Component
 */
class Thumbnail extends Component<IProps, IState> {
    /**
     * The long touch setTimeout handler.
     */
    timeoutHandle?: number;

    /**
     * Timeout used to detect double tapping.
     * It is active while user has tapped once.
     */
    _firstTap?: number;

    /**
     * Initializes a new Thumbnail instance.
     *
     * @param {Object} props - The read-only React Component props with which
     * the new instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        const state = {
            canPlayEventReceived: false,
            displayMode: DISPLAY_VIDEO,
            popoverVisible: false,
            isHovered: false
        };

        this.state = {
            ...state,
            displayMode: computeDisplayModeFromInput(getDisplayModeInput(props, state))
        };
        this.timeoutHandle = undefined;

        this._clearDoubleClickTimeout = this._clearDoubleClickTimeout.bind(this);
        this._onCanPlay = this._onCanPlay.bind(this);
        this._onClick = this._onClick.bind(this);
        this._onMouseEnter = this._onMouseEnter.bind(this);
        this._onMouseMove = debounce(this._onMouseMove.bind(this), 100, {
            leading: true,
            trailing: false
        });
        this._onMouseLeave = this._onMouseLeave.bind(this);
        this._onTestingEvent = this._onTestingEvent.bind(this);
        this._onTouchStart = this._onTouchStart.bind(this);
        this._onTouchEnd = this._onTouchEnd.bind(this);
        this._onTouchMove = this._onTouchMove.bind(this);
        this._showPopover = this._showPopover.bind(this);
        this._hidePopover = this._hidePopover.bind(this);
        this._onGifMouseEnter = this._onGifMouseEnter.bind(this);
        this._onGifMouseLeave = this._onGifMouseLeave.bind(this);
        this.handleTrackStreamingStatusChanged = this.handleTrackStreamingStatusChanged.bind(this);
    }

    /**
     * Starts listening for track streaming status updates after the initial render.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidMount() {
        this._onDisplayModeChanged();


        // Listen to track streaming status changed event to keep it updated.
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Remove listeners for track streaming status update.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentWillUnmount() {
        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (_videoTrack && !_videoTrack.local) {
            _videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                this.handleTrackStreamingStatusChanged);
            dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                _videoTrack.jitsiTrack.getTrackStreamingStatus()));
        }
    }

    /**
     * Stops listening for track streaming status updates on the old track and starts
     * listening instead on the new track.
     *
     * @inheritdoc
     * @returns {void}
     */
    componentDidUpdate(prevProps: IProps, prevState: IState) {
        if (prevState.displayMode !== this.state.displayMode) {
            this._onDisplayModeChanged();
        }

        // TODO: after converting this component to a react function component,
        // use a custom hook to update local track streaming status.
        const { _videoTrack, dispatch } = this.props;

        if (prevProps._videoTrack?.jitsiTrack?.getSourceName() !== _videoTrack?.jitsiTrack?.getSourceName()) {
            if (prevProps._videoTrack && !prevProps._videoTrack.local) {
                prevProps._videoTrack.jitsiTrack.off(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(prevProps._videoTrack.jitsiTrack,
                    prevProps._videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
            if (_videoTrack && !_videoTrack.local) {
                _videoTrack.jitsiTrack.on(JitsiTrackEvents.TRACK_STREAMING_STATUS_CHANGED,
                    this.handleTrackStreamingStatusChanged);
                dispatch(trackStreamingStatusChanged(_videoTrack.jitsiTrack,
                    _videoTrack.jitsiTrack.getTrackStreamingStatus()));
            }
        }
    }

    /**
     * Handle track streaming status change event by
     * by dispatching an action to update track streaming status for the given track in app state.
     *
     * @param {JitsiTrack} jitsiTrack - The track with streaming status updated.
     * @param {JitsiTrackStreamingStatus} streamingStatus - The updated track streaming status.
     * @returns {void}
     */
    handleTrackStreamingStatusChanged(jitsiTrack: any, streamingStatus: any) {
        this.props.dispatch(trackStreamingStatusChanged(jitsiTrack, streamingStatus));
    }

    /**
     * Handles display mode changes.
     *
     * @returns {void}
     */
    _onDisplayModeChanged() {
        const input = getDisplayModeInput(this.props, this.state);

        this._maybeSendScreenSharingIssueEvents(input);
    }

    /**
     * Sends screen sharing issue event if an issue is detected.
     *
     * @param {Object} input - The input used to compute the thumbnail display mode.
     * @returns {void}
     */
    _maybeSendScreenSharingIssueEvents(input: any) {
        const {
            _isAudioOnly,
            _isScreenSharing,
            _thumbnailType
        } = this.props;
        const { displayMode } = this.state;
        const isTileType = _thumbnailType === THUMBNAIL_TYPE.TILE;

        if (!(DISPLAY_VIDEO === displayMode)
            && isTileType
            && _isScreenSharing
            && !_isAudioOnly) {
            sendAnalytics(createScreenSharingIssueEvent({
                source: 'thumbnail',
                ...input
            }));
        }
    }

    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, prevState: IState) {
        if (!props._videoTrack && prevState.canPlayEventReceived) {
            const newState = {
                ...prevState,
                canPlayEventReceived: false
            };

            return {
                ...newState,
                displayMode: computeDisplayModeFromInput(getDisplayModeInput(props, newState))
            };
        }

        const newDisplayMode = computeDisplayModeFromInput(getDisplayModeInput(props, prevState));

        if (newDisplayMode !== prevState.displayMode) {
            return {
                ...prevState,
                displayMode: newDisplayMode
            };
        }

        return null;
    }

    /**
     * Clears the first click timeout.
     *
     * @returns {void}
     */
    _clearDoubleClickTimeout() {
        clearTimeout(this._firstTap);
        this._firstTap = undefined;
    }

    /**
     * Shows popover.
     *
     * @private
     * @returns {void}
     */
    _showPopover() {
        this.setState({
            popoverVisible: true
        });
    }

    /**
     * Hides popover.
     *
     * @private
     * @returns {void}
     */
    _hidePopover() {
        const { _thumbnailType } = this.props;

        if (_thumbnailType === THUMBNAIL_TYPE.VERTICAL) {
            this.setState({
                isHovered: false
            });
        }
        this.setState({
            popoverVisible: false
        });
    }

    /**
     * Returns an object with the styles for thumbnail.
     *
     * @returns {Object} - The styles for the thumbnail.
     */
    _getStyles(): any {
        const { canPlayEventReceived } = this.state;
        const {
            _disableTileEnlargement,
            _height,
            _isVirtualScreenshareParticipant,
            _isHidden,
            _isScreenSharing,
            _participant,
            _thumbnailType,
            _videoObjectPosition,
            _videoTrack,
            _width,
            horizontalOffset,
            style
        } = this.props;

        const isTileType = _thumbnailType === THUMBNAIL_TYPE.TILE;
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const track = jitsiVideoTrack?.track;
        const isPortraitVideo = (track?.getSettings()?.aspectRatio || 1) < 1;

        let styles: {
            avatar: Object;
            thumbnail: any;
            video: Object;
        } = {
            thumbnail: {},
            avatar: {},
            video: {}
        };

        const avatarSize = Math.min(_height / 2, _width - 30, 200);
        let { left } = style || {};

        if (typeof left === 'number' && horizontalOffset) {
            left += horizontalOffset;
        }

        let videoStyles: any = null;
        const doNotStretchVideo = (isPortraitVideo && isTileType)
            || _disableTileEnlargement
            || _isScreenSharing;

        if (canPlayEventReceived || _participant.local || _isVirtualScreenshareParticipant) {
            videoStyles = {
                objectFit: doNotStretchVideo ? 'contain' : 'cover'
            };
        } else {
            videoStyles = {
                display: 'none'
            };
        }

        if (videoStyles.objectFit === 'cover') {
            videoStyles.objectPosition = _videoObjectPosition;
        }

        styles = {
            thumbnail: {
                ...style,
                left,
                height: `${_height}px`,
                minHeight: `${_height}px`,
                minWidth: `${_width}px`,
                width: `${_width}px`
            },
            avatar: {
                height: `${avatarSize}px`,
                width: `${avatarSize}px`
            },
            video: videoStyles
        };

        if (_isHidden) {
            styles.thumbnail.display = 'none';
        }

        return styles;
    }

    /**
     * On click handler.
     *
     * @returns {void}
     */
    _onClick() {
        const { _participant, dispatch, _stageFilmstripLayout } = this.props;
        const { id, pinned } = _participant;

        if (_stageFilmstripLayout) {
            dispatch(togglePinStageParticipant(id));
        } else {
            dispatch(pinParticipant(pinned ? null : id));
        }
    }

    /**
     * Mouse enter handler.
     *
     * @returns {void}
     */
    _onMouseEnter() {
        this.setState({ isHovered: true });
    }

    /**
     * Mouse move handler.
     *
     * @returns {void}
     */
    _onMouseMove() {
        if (!this.state.isHovered) {
            // Workaround for the use case where the layout changes (for example the participant pane is closed)
            // and as a result the mouse appears on top of the thumbnail. In these use cases the mouse enter
            // event on the thumbnail is not triggered in Chrome.
            this.setState({ isHovered: true });
        }
    }

    /**
     * Mouse leave handler.
     *
     * @returns {void}
     */
    _onMouseLeave() {
        this.setState({ isHovered: false });
    }

    /**
     * Handler for touch start.
     *
     * @returns {void}
     */
    _onTouchStart() {
        this.timeoutHandle = window.setTimeout(this._showPopover, SHOW_TOOLBAR_CONTEXT_MENU_AFTER);

        if (this._firstTap) {
            this._clearDoubleClickTimeout();
            this._onClick();

            return;
        }

        this._firstTap = window.setTimeout(this._clearDoubleClickTimeout, 300);
    }

    /**
     * Cancel showing popover context menu after x milliseconds if the no. Of milliseconds is not reached yet,
     * or just clears the timeout.
     *
     * @returns {void}
     */
    _onTouchEnd() {
        clearTimeout(this.timeoutHandle);
    }

    /**
     * Cancel showing Context menu after x milliseconds if the number of milliseconds is not reached
     * before a touch move(drag), or just clears the timeout.
     *
     * @returns {void}
     */
    _onTouchMove() {
        clearTimeout(this.timeoutHandle);
    }

    /**
     * Renders a fake participant (youtube video) thumbnail.
     *
     * @param {string} id - The id of the participant.
     * @returns {ReactElement}
     */
    _renderFakeParticipant() {
        const { _isMobile, _participant: { avatarURL } } = this.props;
        const styles = this._getStyles();
        const containerClassName = this._getContainerClassName();

        return (
            <span
                className = { containerClassName }
                id = 'sharedVideoContainer'
                onClick = { this._onClick }
                { ...(_isMobile ? {} : {
                    onMouseEnter: this._onMouseEnter,
                    onMouseMove: this._onMouseMove,
                    onMouseLeave: this._onMouseLeave
                }) }
                style = { styles.thumbnail }>
                {avatarURL ? (
                    <img
                        className = 'sharedVideoAvatar'
                        src = { avatarURL } />
                )
                    : this._renderAvatar(styles.avatar)}
            </span>
        );
    }

    /**
     * Renders the avatar.
     *
     * @param {Object} styles - The styles that will be applied to the avatar.
     * @returns {ReactElement}
     */
    _renderAvatar(styles: Object) {
        const { _participant } = this.props;
        const { id } = _participant;

        return (
            <div
                className = 'avatar-container'
                style = { styles }>
                <Avatar
                    className = 'userAvatar'
                    participantId = { id } />
            </div>
        );
    }

    /**
     * Returns the container class name.
     *
     * @returns {string} - The class name that will be used for the container.
     */
    _getContainerClassName() {
        let className = 'videocontainer';
        const { displayMode } = this.state;
        const {
            _isDominantSpeakerDisabled,
            _participant,
            _raisedHand,
            _thumbnailType,
            classes
        } = this.props;

        className += ` ${DISPLAY_MODE_TO_CLASS_NAME[displayMode]}`;

        if (_raisedHand) {
            className += ` ${classes.raisedHand}`;
        }

        if (!_isDominantSpeakerDisabled && _participant?.dominantSpeaker) {
            className += ` ${classes.activeSpeaker} dominant-speaker`;
        }
        if (_thumbnailType !== THUMBNAIL_TYPE.TILE && _participant?.pinned) {
            className += ' videoContainerFocused';
        }

        return className;
    }

    /**
     * Keep showing the GIF for the current participant.
     *
     * @returns {void}
     */
    _onGifMouseEnter() {
        const { dispatch, _participant: { id } } = this.props;

        dispatch(showGif(id));
    }

    /**
     * Keep showing the GIF for the current participant.
     *
     * @returns {void}
     */
    _onGifMouseLeave() {
        const { dispatch, _participant: { id } } = this.props;

        dispatch(hideGif(id));
    }

    /**
     * Renders GIF.
     *
     * @returns {Component}
     */
    _renderGif() {
        const { _gifSrc, classes } = this.props;

        return _gifSrc && (
            <div className = { classes.gif }>
                <img
                    alt = 'GIF'
                    src = { _gifSrc } />
            </div>
        );
    }

    /**
     * Canplay event listener.
     *
     * @param {SyntheticEvent} event - The event.
     * @returns {void}
     */
    _onCanPlay(event: any) {
        this.setState({ canPlayEventReceived: true });

        const {
            _isTestModeEnabled,
            _videoTrack
        } = this.props;

        if (_videoTrack && _isTestModeEnabled) {
            this._onTestingEvent(event);
        }
    }

    /**
     * Event handler for testing events.
     *
     * @param {SyntheticEvent} event - The event.
     * @returns {void}
     */
    _onTestingEvent(event: any) {
        const {
            _videoTrack,
            dispatch
        } = this.props;
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;

        dispatch(updateLastTrackVideoMediaEvent(jitsiVideoTrack, event.type));
    }

    /**
     * Renders a remote participant's 'thumbnail.
     *
     * @param {boolean} local - Whether or not it's the local participant.
     * @returns {ReactElement}
     */
    _renderParticipant(local = false) {
        const {
            _audioTrack,
            _disableLocalVideoFlip,
            _gifSrc,
            _isMobile,
            _isMobilePortrait,
            _isScreenSharing,
            _isTestModeEnabled,
            _localFlipX,
            _participant,
            _shouldDisplayTintBackground,
            _thumbnailType,
            _videoTrack,
            classes,
            filmstripType
        } = this.props;
        const { id } = _participant || {};
        const { isHovered, popoverVisible } = this.state;
        const styles = this._getStyles();
        let containerClassName = this._getContainerClassName();
        const videoTrackClassName
            = !_disableLocalVideoFlip && _videoTrack && !_isScreenSharing && _localFlipX ? 'flipVideoX' : '';
        const jitsiVideoTrack = _videoTrack?.jitsiTrack;
        const videoTrackId = jitsiVideoTrack?.getId();
        const videoEventListeners: any = {};

        if (local) {
            if (_isMobilePortrait) {
                styles.thumbnail.height = styles.thumbnail.width;
                containerClassName = `${containerClassName} self-view-mobile-portrait`;
            }
        } else {
            if (_videoTrack && _isTestModeEnabled) {
                VIDEO_TEST_EVENTS.forEach(attribute => {
                    videoEventListeners[attribute] = this._onTestingEvent;
                });
            }
            videoEventListeners.onCanPlay = this._onCanPlay;
        }

        const video = _videoTrack && <VideoTrack
            className = { local ? videoTrackClassName : '' }
            eventHandlers = { videoEventListeners }
            id = { local ? 'localVideo_container' : `remoteVideo_${videoTrackId || ''}` }
            muted = { local ? undefined : true }
            style = { styles.video }
            videoTrack = { _videoTrack } />;

        return (
            <span
                className = { containerClassName }
                id = { local
                    ? `localVideoContainer${filmstripType === FILMSTRIP_TYPE.MAIN ? '' : `_${filmstripType}`}`
                    : `participant_${id}${filmstripType === FILMSTRIP_TYPE.MAIN ? '' : `_${filmstripType}`}`
                }
                { ...(_isMobile
                    ? {
                        onTouchEnd: this._onTouchEnd,
                        onTouchMove: this._onTouchMove,
                        onTouchStart: this._onTouchStart
                    }
                    : {
                        onClick: this._onClick,
                        onMouseEnter: this._onMouseEnter,
                        onMouseMove: this._onMouseMove,
                        onMouseLeave: this._onMouseLeave
                    }
                ) }
                style = { styles.thumbnail }>
                {!_gifSrc && (local
                    ? <span id = 'localVideoWrapper'>{video}</span>
                    : video)}
                <div className = { classes.containerBackground } />
                <div
                    className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsTopContainer,
                        _thumbnailType === THUMBNAIL_TYPE.TILE && 'tile-view-mode'
                    ) }>
                    <ThumbnailTopIndicators
                        disableConnectionIndicator = { isWhiteboardParticipant(_participant) }
                        hidePopover = { this._hidePopover }
                        indicatorsClassName = { classes.indicatorsBackground }
                        isHovered = { isHovered }
                        local = { local }
                        participantId = { id }
                        popoverVisible = { popoverVisible }
                        showPopover = { this._showPopover }
                        thumbnailType = { _thumbnailType } />
                </div>
                {_shouldDisplayTintBackground && <div className = { classes.tintBackground } />}
                <div
                    className = { clsx(classes.indicatorsContainer,
                        classes.indicatorsBottomContainer,
                        _thumbnailType === THUMBNAIL_TYPE.TILE && 'tile-view-mode'
                    ) }>
                    <ThumbnailBottomIndicators
                        className = { classes.indicatorsBackground }
                        local = { local }
                        participantId = { id }
                        showStatusIndicators = { !isWhiteboardParticipant(_participant) }
                        thumbnailType = { _thumbnailType } />
                </div>
                {!_gifSrc && this._renderAvatar(styles.avatar) }
                { !local && (
                    <div className = 'presence-label-container'>
                        <PresenceLabel
                            className = 'presence-label'
                            participantID = { id } />
                    </div>
                )}
                <ThumbnailAudioIndicator _audioTrack = { _audioTrack } />
                {this._renderGif()}
                <div
                    className = { clsx(classes.borderIndicator,
                    _gifSrc && classes.borderIndicatorOnTop,
                    'raised-hand-border') } />
                <div
                    className = { clsx(classes.borderIndicator,
                    _gifSrc && classes.borderIndicatorOnTop,
                    'active-speaker-indicator') } />
                {_gifSrc && (
                    <div
                        className = { clsx(classes.borderIndicator, classes.borderIndicatorOnTop) }
                        onMouseEnter = { this._onGifMouseEnter }
                        onMouseLeave = { this._onGifMouseLeave } />
                )}
            </span>
        );
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _isTestModeEnabled,
            _isVirtualScreenshareParticipant,
            _participant,
            _shouldDisplayTintBackground
        } = this.props;
        const videoEventListeners: any = {};

        if (!_participant) {
            return null;
        }

        const { fakeParticipant, local } = _participant;

        if (local) {
            return this._renderParticipant(true);
        }

        if (fakeParticipant
            && !isWhiteboardParticipant(_participant)
            && !_isVirtualScreenshareParticipant
        ) {
            return this._renderFakeParticipant();
        }

        if (_isVirtualScreenshareParticipant) {
            const { isHovered } = this.state;
            const { _videoTrack, _isMobile, classes, _thumbnailType } = this.props;

            if (_isTestModeEnabled) {
                VIDEO_TEST_EVENTS.forEach(attribute => {
                    videoEventListeners[attribute] = this._onTestingEvent;
                });
                videoEventListeners.onCanPlay = this._onCanPlay;
            }

            return (
                <VirtualScreenshareParticipant
                    classes = { classes }
                    containerClassName = { this._getContainerClassName() }
                    isHovered = { isHovered }
                    isLocal = { isLocalScreenshareParticipant(_participant) }
                    isMobile = { _isMobile }
                    onClick = { this._onClick }
                    onMouseEnter = { this._onMouseEnter }
                    onMouseLeave = { this._onMouseLeave }
                    onMouseMove = { this._onMouseMove }
                    onTouchEnd = { this._onTouchEnd }
                    onTouchMove = { this._onTouchMove }
                    onTouchStart = { this._onTouchStart }
                    participantId = { _participant.id }
                    shouldDisplayTintBackground = { _shouldDisplayTintBackground }
                    styles = { this._getStyles() }
                    thumbnailType = { _thumbnailType }
                    videoTrack = { _videoTrack } />
            );
        }

        return this._renderParticipant();
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @param {Object} ownProps - The own props of the component.
 * @private
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState, ownProps: any): Object {
    const { participantID, filmstripType = FILMSTRIP_TYPE.MAIN } = ownProps;

    const participant = getParticipantByIdOrUndefined(state, participantID);
    const id = participant?.id ?? '';
    const isLocal = participant?.local ?? true;
    const _isVirtualScreenshareParticipant = isScreenShareParticipant(participant);
    const tracks = state['features/base/tracks'];
    const _videoTrack = getVideoTrackByParticipant(state, participant);
    const _audioTrack = isLocal
        ? getLocalAudioTrack(tracks)
        : getTrackByMediaTypeAndParticipant(tracks, MEDIA_TYPE.AUDIO, id);
    const _currentLayout = getCurrentLayout(state) ?? '';
    let size: any = {};
    let _isMobilePortrait = false;
    const {
        defaultLocalDisplayName,
        disableLocalVideoFlip,
        disableTileEnlargement,
        iAmRecorder,
        iAmSipGateway
    } = state['features/base/config'];
    const { localFlipX } = state['features/base/settings'];
    const _isMobile = isMobileBrowser();
    const activeParticipants = getActiveParticipantsIds(state);
    const tileType = getThumbnailTypeFromLayout(_currentLayout, filmstripType);

    switch (tileType) {
    case THUMBNAIL_TYPE.VERTICAL:
    case THUMBNAIL_TYPE.HORIZONTAL: {
        const {
            horizontalViewDimensions = {
                local: {},
                remote: {}
            },
            verticalViewDimensions = {
                local: {},
                remote: {},
                gridView: {}
            }
        } = state['features/filmstrip'];
        const _verticalViewGrid = showGridInVerticalView(state);
        const { local, remote }
            = tileType === THUMBNAIL_TYPE.VERTICAL
                ? verticalViewDimensions : horizontalViewDimensions;

        // @ts-ignore
        const { width, height } = (isLocal ? local : remote) ?? {};

        size = {
            _width: width,
            _height: height
        };

        if (_verticalViewGrid) {
            // @ts-ignore
            const { width: _width, height: _height } = verticalViewDimensions.gridView.thumbnailSize;

            size = {
                _width,
                _height
            };
        }

        _isMobilePortrait = _isMobile && state['features/base/responsive-ui'].aspectRatio === ASPECT_RATIO_NARROW;

        break;
    }
    case THUMBNAIL_TYPE.TILE: {
        // @ts-ignore
        const { thumbnailSize } = state['features/filmstrip'].tileViewDimensions;
        const {
            stageFilmstripDimensions = {
                thumbnailSize: {}
            },
            screenshareFilmstripDimensions
        } = state['features/filmstrip'];

        size = {
            _width: thumbnailSize?.width,
            _height: thumbnailSize?.height
        };

        if (filmstripType === FILMSTRIP_TYPE.STAGE) {
            // @ts-ignore
            const { width: _width, height: _height } = stageFilmstripDimensions.thumbnailSize;

            size = {
                _width,
                _height
            };
        } else if (filmstripType === FILMSTRIP_TYPE.SCREENSHARE) {
            // @ts-ignore
            const { width: _width, height: _height } = screenshareFilmstripDimensions.thumbnailSize;

            size = {
                _width,
                _height
            };
        }
        break;
    }
    }

    if (ownProps.width) {
        size._width = ownProps.width;
    }

    const { gifUrl: gifSrc } = getGifForParticipant(state, id ?? '');
    const mode = getGifDisplayMode(state);
    const participantId = isLocal ? getLocalParticipant(state)?.id : participantID;
    const isActiveParticipant = activeParticipants.find((pId: string) => pId === participantId);
    const participantCurrentlyOnLargeVideo = state['features/large-video']?.participantId === id;
    const shouldDisplayTintBackground
        = _currentLayout !== LAYOUTS.TILE_VIEW && filmstripType === FILMSTRIP_TYPE.MAIN
        && (isActiveParticipant || participantCurrentlyOnLargeVideo);

    return {
        _audioTrack,
        _currentLayout,
        _defaultLocalDisplayName: defaultLocalDisplayName,
        _disableLocalVideoFlip: Boolean(disableLocalVideoFlip),
        _disableTileEnlargement: Boolean(disableTileEnlargement),
        _isActiveParticipant: isActiveParticipant,
        _isHidden: isLocal && iAmRecorder && !iAmSipGateway,
        _isAudioOnly: Boolean(state['features/base/audio-only'].enabled),
        _isCurrentlyOnLargeVideo: participantCurrentlyOnLargeVideo,
        _isDominantSpeakerDisabled: interfaceConfig.DISABLE_DOMINANT_SPEAKER_INDICATOR,
        _isMobile,
        _isMobilePortrait,
        _isScreenSharing: _videoTrack?.videoType === 'desktop',
        _isTestModeEnabled: isTestModeEnabled(state),
        _isVideoPlayable: id && isVideoPlayable(state, id),
        _isVirtualScreenshareParticipant,
        _localFlipX: Boolean(localFlipX),
        _participant: participant,
        _raisedHand: hasRaisedHand(participant),
        _stageFilmstripLayout: isStageFilmstripAvailable(state),
        _stageParticipantsVisible: _currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW,
        _shouldDisplayTintBackground: shouldDisplayTintBackground,
        _thumbnailType: tileType,
        _videoObjectPosition: getVideoObjectPosition(state, participant?.id),
        _videoTrack,
        ...size,
        _gifSrc: mode === 'chat' ? null : gifSrc
    };
}

export default connect(_mapStateToProps)(withStyles(defaultStyles)(Thumbnail));
