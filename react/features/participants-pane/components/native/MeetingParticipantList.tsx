/* eslint-disable lines-around-comment */

import React, { PureComponent } from 'react';
import { WithTranslation } from 'react-i18next';
import { FlatList } from 'react-native';

import { IReduxState } from '../../../app/types';
import { translate } from '../../../base/i18n/functions';
// @ts-ignore
import { Icon, IconAddUser } from '../../../base/icons';
import {
    getLocalParticipant,
    getParticipantCountWithFake,
    getRemoteParticipants
} from '../../../base/participants/functions';
import { connect } from '../../../base/redux/functions';
import Button from '../../../base/ui/components/native/Button';
import Input from '../../../base/ui/components/native/Input';
import { BUTTON_TYPES } from '../../../base/ui/constants.native';
import { getBreakoutRooms, getCurrentRoomId } from '../../../breakout-rooms/functions';
import { doInvitePeople } from '../../../invite/actions.native';
import { toggleShareDialog } from '../../../share-room/actions';
import { getInviteOthersControl } from '../../../share-room/functions';
import { participantMatchesSearch, shouldRenderInviteButton } from '../../functions';

// @ts-ignore
import CollapsibleList from './CollapsibleList';
// @ts-ignore
import MeetingParticipantItem from './MeetingParticipantItem';
// @ts-ignore
import styles from './styles';


type Props = WithTranslation & {

    /**
     * Current breakout room, if we are in one.
     */
    _currentRoom: any;

    /**
     * Control for invite other button.
     */
    _inviteOthersControl: any;

    /**
     * The local participant.
     */
    _localParticipant: any;

    /**
     * The number of participants in the conference.
     */
    _participantsCount: number;

    /**
     * The remote participants.
     */
    _remoteParticipants: Map<string, Object>;

    /**
     * Whether or not to show the invite button.
     */
    _showInviteButton: boolean;

    /**
     * The remote participants.
     */
    _sortedRemoteParticipants: Map<string, string>;

    /**
     * List of breakout rooms that were created.
     */
    breakoutRooms: ArrayLike<any>;

    /**
     * The redux dispatch function.
     */
    dispatch: Function;

    /**
     * Is the local participant moderator?
     */
    isLocalModerator: boolean;

    /**
     * List of participants waiting in lobby.
     */
    lobbyParticipants: ArrayLike<any>;

    /**
     * Participants search string.
     */
    searchString: string;

    /**
     * Function to update the search string.
     */
    setSearchString: Function;

    /**
     * Translation function.
     */
    t: Function;
};

/**
 *  The meeting participant list component.
 */
class MeetingParticipantList extends PureComponent<Props> {

    /**
     * Creates new MeetingParticipantList instance.
     *
     * @param {Props} props - The props of the component.
     */
    constructor(props: Props) {
        super(props);

        this._keyExtractor = this._keyExtractor.bind(this);
        this._onInvite = this._onInvite.bind(this);
        this._renderParticipant = this._renderParticipant.bind(this);
        this._onSearchStringChange = this._onSearchStringChange.bind(this);
    }

    /**
     * Returns a key for a passed item of the list.
     *
     * @param {string} item - The user ID.
     * @returns {string} - The user ID.
     */
    _keyExtractor(item: string) {
        return item;
    }

    /**
     * Handles ivite button presses.
     *
     * @returns {void}
     */
    _onInvite() {
        this.props.dispatch(toggleShareDialog(true));
        this.props.dispatch(doInvitePeople());
    }

    /**
     * Renders a participant.
     *
     * @param {Object} flatListItem - Information about the item to be rendered.
     * @param {string} flatListItem.item - The ID of the participant.
     * @returns {ReactElement}
     */
    _renderParticipant({ item/* , index, separators */ }: any) {
        const { _localParticipant, _remoteParticipants, searchString } = this.props;
        const participant = item === _localParticipant?.id ? _localParticipant : _remoteParticipants.get(item);

        if (participantMatchesSearch(participant, searchString)) {
            return (
                <MeetingParticipantItem
                    key = { item }
                    participant = { participant } />
            );
        }

        return null;
    }

    /**
     * Handles search string changes.
     *
     * @param {string} text - New value of the search string.
     * @returns {void}
     */
    _onSearchStringChange(text: string) {
        this.props.setSearchString(text);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const {
            _currentRoom,
            _inviteOthersControl,
            _localParticipant,
            _participantsCount,
            _showInviteButton,
            _sortedRemoteParticipants,
            breakoutRooms,
            isLocalModerator,
            lobbyParticipants,
            t
        } = this.props;
        const title = _currentRoom?.name

            // $FlowExpectedError
            ? `${_currentRoom.name} (${_participantsCount})`
            : t('participantsPane.headings.participantsList',
                { count: _participantsCount });

        // Regarding the fact that we have 3 sections, we apply
        // a certain height percentage for every section in order for all to fit
        // inside the participants pane container
        // If there are only meeting participants available,
        // we take the full container height
        const onlyMeetingParticipants
            = breakoutRooms?.length === 0 && lobbyParticipants?.length === 0;
        const containerStyleModerator
            = onlyMeetingParticipants
                ? styles.meetingListFullContainer : styles.meetingListContainer;
        const containerStyle
            = isLocalModerator
                ? containerStyleModerator : styles.notLocalModeratorContainer;
        const finalContainerStyle
            = _participantsCount > 6 && containerStyle;
        const { color, shareDialogVisible } = _inviteOthersControl;

        return (
            <CollapsibleList
                containerStyle = { finalContainerStyle }
                title = { title } >
                {
                    _showInviteButton
                    && <Button
                        accessibilityLabel = 'participantsPane.actions.invite'
                        disabled = { shareDialogVisible }
                        // eslint-disable-next-line react/jsx-no-bind
                        icon = { () => (
                            <Icon
                                color = { color }
                                size = { 20 }
                                src = { IconAddUser } />
                        ) }
                        labelKey = 'participantsPane.actions.invite'
                        onClick = { this._onInvite }
                        style = { styles.inviteButton }
                        type = { BUTTON_TYPES.PRIMARY } />
                }
                <Input
                    clearable = { true }
                    // @ts-ignore
                    customStyles = {{
                        container: styles.inputContainer,
                        input: styles.centerInput }}
                    onChange = { this._onSearchStringChange }
                    placeholder = { t('participantsPane.search') }
                    value = { this.props.searchString } />
                <FlatList
                    bounces = { false }
                    data = { [ _localParticipant?.id, ..._sortedRemoteParticipants ] }
                    horizontal = { false }
                    keyExtractor = { this._keyExtractor }
                    renderItem = { this._renderParticipant }
                    scrollEnabled = { true }
                    showsHorizontalScrollIndicator = { false }
                    windowSize = { 2 } />
            </CollapsibleList>
        );
    }
}

/**
 * Maps (parts of) the redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {Props}
 */
function _mapStateToProps(state: IReduxState): Object {
    const _participantsCount = getParticipantCountWithFake(state);
    const { remoteParticipants } = state['features/filmstrip'];
    const { shareDialogVisible } = state['features/share-room'];
    const _inviteOthersControl = getInviteOthersControl(state);
    const _showInviteButton = shouldRenderInviteButton(state);
    const _remoteParticipants = getRemoteParticipants(state);
    const currentRoomId = getCurrentRoomId(state);
    const _currentRoom = getBreakoutRooms(state)[currentRoomId];

    return {
        _currentRoom,
        _inviteOthersControl,
        _participantsCount,
        _remoteParticipants,
        _showInviteButton,
        _sortedRemoteParticipants: remoteParticipants,
        _localParticipant: getLocalParticipant(state),
        _shareDialogVisible: shareDialogVisible
    };
}

export default translate(connect(_mapStateToProps)(MeetingParticipantList));
