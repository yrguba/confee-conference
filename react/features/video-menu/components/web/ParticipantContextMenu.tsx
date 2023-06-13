/* eslint-disable lines-around-comment */

import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isSupported as isAvModerationSupported } from '../../../av-moderation/functions';
// @ts-ignore
import { Avatar } from '../../../base/avatar';
import { isIosMobileBrowser, isMobileBrowser } from '../../../base/environment/utils';
import { MEDIA_TYPE } from '../../../base/media/constants';
import { PARTICIPANT_ROLE } from '../../../base/participants/constants';
import { getLocalParticipant } from '../../../base/participants/functions';
import { IParticipant } from '../../../base/participants/types';
import { isParticipantAudioMuted } from '../../../base/tracks/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import ContextMenuItemGroup from '../../../base/ui/components/web/ContextMenuItemGroup';
import { getBreakoutRooms, getCurrentRoomId, isInBreakoutRoom } from '../../../breakout-rooms/functions';
import { displayVerification } from '../../../e2ee/functions';
import { setVolume } from '../../../filmstrip/actions.web';
import { isStageFilmstripAvailable } from '../../../filmstrip/functions.web';
import { isForceMuted } from '../../../participants-pane/functions';
// @ts-ignore
import { requestRemoteControl, stopController } from '../../../remote-control';
import { showOverflowDrawer } from '../../../toolbox/functions.web';

import CustomOptionButton from './CustomOptionButton';
// @ts-ignore
import { REMOTE_CONTROL_MENU_STATES } from './RemoteControlButton';
// @ts-ignore
import SendToRoomButton from './SendToRoomButton';
import VerifyParticipantButton from './VerifyParticipantButton';

import {
    AskToUnmuteButton,
    ConnectionStatusButton,
    GrantModeratorButton,
    KickButton,
    MuteButton,
    MuteEveryoneElseButton,
    MuteEveryoneElsesVideoButton,
    MuteVideoButton,
    PrivateMessageMenuButton,
    RemoteControlButton,
    TogglePinToStageButton,
    VolumeSlider
    // @ts-ignore
} from './';
/* eslint-enable lines-around-comment */

interface IProps {

    /**
     * Class name for the context menu.
     */
    className?: string;

    /**
     * Closes a drawer if open.
     */
    closeDrawer?: () => void;

    /**
     * The participant for which the drawer is open.
     * It contains the displayName & participantID.
     */
    drawerParticipant?: {
        displayName: string;
        participantID: string;
    };

    /**
     * Target elements against which positioning calculations are made.
     */
    offsetTarget?: HTMLElement;

    /**
     * Callback for the mouse entering the component.
     */
    onEnter?: (e?: React.MouseEvent) => void;

    /**
     * Callback for the mouse leaving the component.
     */
    onLeave?: (e?: React.MouseEvent) => void;

    /**
     * Callback for making a selection in the menu.
     */
    onSelect: (value?: boolean | React.MouseEvent) => void;

    /**
     * Participant reference.
     */
    participant: IParticipant;

    /**
     * The current state of the participant's remote control session.
     */
    remoteControlState?: number;

    /**
     * Whether or not the menu is displayed in the thumbnail remote video menu.
     */
    thumbnailMenu?: boolean;
}

const useStyles = makeStyles()(theme => {
    return {
        text: {
            color: theme.palette.text02,
            padding: '10px 16px',
            height: '40px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box'
        }
    };
});

const ParticipantContextMenu = ({
    className,
    closeDrawer,
    drawerParticipant,
    offsetTarget,
    onEnter,
    onLeave,
    onSelect,
    participant,
    remoteControlState,
    thumbnailMenu
}: IProps) => {
    const dispatch = useDispatch();
    const { t } = useTranslation();
    const { classes: styles } = useStyles();

    const localParticipant = useSelector(getLocalParticipant);
    //const _isModerator = Boolean(localParticipant?.role === PARTICIPANT_ROLE.MODERATOR);
    const _isModerator = true;
    const _isAudioForceMuted = useSelector<IReduxState>(state =>
        isForceMuted(participant, MEDIA_TYPE.AUDIO, state));
    const _isVideoForceMuted = useSelector<IReduxState>(state =>
        isForceMuted(participant, MEDIA_TYPE.VIDEO, state));
    const _isAudioMuted = useSelector((state: IReduxState) => isParticipantAudioMuted(participant, state));
    const _overflowDrawer: boolean = useSelector(showOverflowDrawer);
    const { remoteVideoMenu = {}, disableRemoteMute, startSilent, customParticipantMenuButtons }
        = useSelector((state: IReduxState) => state['features/base/config']);
    const { disableKick, disableGrantModerator, disablePrivateChat } = remoteVideoMenu;
    const { participantsVolume } = useSelector((state: IReduxState) => state['features/filmstrip']);
    const _volume = (participant?.local ?? true ? undefined
        : participant?.id ? participantsVolume[participant?.id] : undefined) ?? 1;
    const isBreakoutRoom = useSelector(isInBreakoutRoom);
    const isModerationSupported = useSelector((state: IReduxState) => isAvModerationSupported()(state));
    const stageFilmstrip = useSelector(isStageFilmstripAvailable);
    const shouldDisplayVerification = useSelector((state: IReduxState) => displayVerification(state, participant?.id));

    const _currentRoomId = useSelector(getCurrentRoomId);
    const _rooms: Array<{ id: string; }> = Object.values(useSelector(getBreakoutRooms));

    const _onVolumeChange = useCallback(value => {
        dispatch(setVolume(participant.id, value));
    }, [ setVolume, dispatch ]);

    const clickHandler = useCallback(() => onSelect(true), [ onSelect ]);

    const _getCurrentParticipantId = useCallback(() => {
        const drawer = _overflowDrawer && !thumbnailMenu;

        return (drawer ? drawerParticipant?.participantID : participant?.id) ?? '';
    }
    , [ thumbnailMenu, _overflowDrawer, drawerParticipant, participant ]);

    const buttons: JSX.Element[] = [];
    const buttons2: JSX.Element[] = [];

    const showVolumeSlider = !startSilent
        && !isIosMobileBrowser()
        && (_overflowDrawer || thumbnailMenu)
        && typeof _volume === 'number'
        && !isNaN(_volume);

    if (_isModerator) {
        if ((thumbnailMenu || _overflowDrawer) && isModerationSupported && _isAudioMuted) {
            buttons.push(<AskToUnmuteButton
                isAudioForceMuted = { _isAudioForceMuted }
                isVideoForceMuted = { _isVideoForceMuted }
                key = 'ask-unmute'
                participantID = { _getCurrentParticipantId() } />
            );
        }
        if (!disableRemoteMute) {
            buttons.push(
                <MuteButton
                    key = 'mute'
                    participantID = { _getCurrentParticipantId() } />
            );
            buttons.push(
                <MuteEveryoneElseButton
                    key = 'mute-others'
                    participantID = { _getCurrentParticipantId() } />
            );
            buttons.push(
                <MuteVideoButton
                    key = 'mute-video'
                    participantID = { _getCurrentParticipantId() } />
            );
            buttons.push(
                <MuteEveryoneElsesVideoButton
                    key = 'mute-others-video'
                    participantID = { _getCurrentParticipantId() } />
            );
        }

        // if (!disableGrantModerator && !isBreakoutRoom) {
        //     buttons2.push(
        //         <GrantModeratorButton
        //             key = 'grant-moderator'
        //             participantID = { _getCurrentParticipantId() } />
        //     );
        // }

        if (!disableKick) {
            buttons2.push(
                <KickButton
                    key = 'kick'
                    participantID = { _getCurrentParticipantId() } />
            );
        }

        if (shouldDisplayVerification) {
            buttons2.push(
                <VerifyParticipantButton
                    key = 'verify'
                    participantID = { _getCurrentParticipantId() } />
            );
        }

    }

    if (stageFilmstrip) {
        buttons2.push(<TogglePinToStageButton
            key = 'pinToStage'
            participantID = { _getCurrentParticipantId() } />);
    }

    if (!disablePrivateChat) {
        buttons2.push(<PrivateMessageMenuButton
            key = 'privateMessage'
            participantID = { _getCurrentParticipantId() } />
        );
    }

    if (thumbnailMenu && isMobileBrowser()) {
        buttons2.push(
            <ConnectionStatusButton
                key = 'conn-status'
                participantId = { _getCurrentParticipantId() } />
        );
    }

    if (thumbnailMenu && remoteControlState) {
        let onRemoteControlToggle = null;

        if (remoteControlState === REMOTE_CONTROL_MENU_STATES.STARTED) {
            onRemoteControlToggle = () => dispatch(stopController(true));
        } else if (remoteControlState === REMOTE_CONTROL_MENU_STATES.NOT_STARTED) {
            onRemoteControlToggle = () => dispatch(requestRemoteControl(_getCurrentParticipantId()));
        }

        buttons2.push(
            <RemoteControlButton
                key = 'remote-control'
                onClick = { onRemoteControlToggle }
                participantID = { _getCurrentParticipantId() }
                remoteControlState = { remoteControlState } />
        );
    }

    if (customParticipantMenuButtons) {
        customParticipantMenuButtons.forEach(
            ({ icon, id, text }) => {
                const onClick = useCallback(
                    () => APP.API.notifyParticipantMenuButtonClicked(id, _getCurrentParticipantId()), []);

                buttons2.push(
                    <CustomOptionButton
                        icon = { icon }
                        key = { id }
                        onClick = { onClick }
                        text = { text } />
                );
            }
        );
    }

    const breakoutRoomsButtons: any = [];

    if (!thumbnailMenu && _isModerator) {
        _rooms.forEach(room => {
            if (room.id !== _currentRoomId) {
                breakoutRoomsButtons.push(
                    <SendToRoomButton
                        key = { room.id }
                        onClick = { clickHandler }
                        participantID = { _getCurrentParticipantId() }
                        room = { room } />
                );
            }
        });
    }

    return (
        <ContextMenu
            className = { className }
            entity = { participant }
            hidden = { thumbnailMenu ? false : undefined }
            inDrawer = { thumbnailMenu && _overflowDrawer }
            isDrawerOpen = { Boolean(drawerParticipant) }
            offsetTarget = { offsetTarget }
            onClick = { onSelect }
            onDrawerClose = { thumbnailMenu ? onSelect : closeDrawer }
            onMouseEnter = { onEnter }
            onMouseLeave = { onLeave }>
            {!thumbnailMenu && _overflowDrawer && drawerParticipant && <ContextMenuItemGroup
                actions = { [ {
                    accessibilityLabel: drawerParticipant.displayName,
                    customIcon: <Avatar
                        participantId = { drawerParticipant.participantID }
                        size = { 20 } />,
                    text: drawerParticipant.displayName
                } ] } />}
            {buttons.length > 0 && (
                <ContextMenuItemGroup>
                    {buttons}
                </ContextMenuItemGroup>
            )}
            <ContextMenuItemGroup>
                {buttons2}
            </ContextMenuItemGroup>
            {showVolumeSlider && (
                <ContextMenuItemGroup>
                    <VolumeSlider
                        initialValue = { _volume }
                        key = 'volume-slider'
                        onChange = { _onVolumeChange } />
                </ContextMenuItemGroup>
            )}
            {breakoutRoomsButtons.length > 0 && (
                <ContextMenuItemGroup>
                    <div className = { styles.text }>
                        {t('breakoutRooms.actions.sendToBreakoutRoom')}
                    </div>
                    {breakoutRoomsButtons}
                </ContextMenuItemGroup>
            )}
        </ContextMenu>
    );
};

export default ParticipantContextMenu;
