// @flow

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { isMobileBrowser } from '../../../../../base/environment/utils';
import { isLocalParticipantModerator } from '../../../../../base/participants';
import { equals } from '../../../../../base/redux';
import useContextMenu from '../../../../../base/ui/hooks/useContextMenu.web';
import {
    getBreakoutRooms,
    getBreakoutRoomsConfig,
    getCurrentRoomId,
    isAutoAssignParticipantsVisible,
    isInBreakoutRoom
} from '../../../../../breakout-rooms/functions';
import { showOverflowDrawer } from '../../../../../toolbox/functions';

import { AutoAssignButton } from './AutoAssignButton';
import { CollapsibleRoom } from './CollapsibleRoom';
import JoinActionButton from './JoinQuickActionButton';
import { LeaveButton } from './LeaveButton';
import RoomActionEllipsis from './RoomActionEllipsis';
import { RoomContextMenu } from './RoomContextMenu';
import { RoomParticipantContextMenu } from './RoomParticipantContextMenu';

type Props = {

    /**
     * Participants search string.
     */
    searchString: string
}

export const RoomList = ({ searchString }: Props) => {
    const currentRoomId = useSelector(getCurrentRoomId);
    const rooms = Object.values(useSelector(getBreakoutRooms, equals))
                    .filter((room: Object) => room.id !== currentRoomId)
                    .sort((p1: Object, p2: Object) => (p1?.name || '').localeCompare(p2?.name || ''));
    const inBreakoutRoom = useSelector(isInBreakoutRoom);
    const isLocalModerator = useSelector(isLocalParticipantModerator);
    const showAutoAssign = useSelector(isAutoAssignParticipantsVisible);
    const { hideJoinRoomButton } = useSelector(getBreakoutRoomsConfig);
    const overflowDrawer = useSelector(showOverflowDrawer);
    const [ lowerMenu, raiseMenu, toggleMenu, menuEnter, menuLeave, raiseContext ] = useContextMenu();
    const [ lowerParticipantMenu, raiseParticipantMenu, toggleParticipantMenu,
        participantMenuEnter, participantMenuLeave, raiseParticipantContext ] = useContextMenu();
    const hideMenu = useCallback(() => !overflowDrawer && lowerMenu(), [ overflowDrawer, lowerMenu ]);
    const onRaiseMenu = useCallback(room => target => raiseMenu(room, target), [ raiseMenu ]);

    return (
        <>
            {inBreakoutRoom && <LeaveButton />}
            {showAutoAssign && <AutoAssignButton />}
            <div id = 'breakout-rooms-list'>
                {rooms.map((room: Object) => (
                    <React.Fragment key = { room.id }>
                        <CollapsibleRoom
                            isHighlighted = { raiseContext.entity === room }
                            onLeave = { hideMenu }
                            onRaiseMenu = { onRaiseMenu(room) }
                            participantContextEntity = { raiseParticipantContext.entity }
                            raiseParticipantContextMenu = { raiseParticipantMenu }
                            room = { room }
                            searchString = { searchString }
                            toggleParticipantMenu = { toggleParticipantMenu }>
                            {!isMobileBrowser() && <>
                                {!hideJoinRoomButton && <JoinActionButton room = { room } />}
                                {isLocalModerator && !room.isMainRoom
                                    && <RoomActionEllipsis onClick = { toggleMenu(room) } />}
                            </>}
                        </CollapsibleRoom>
                    </React.Fragment>
                ))}
            </div>
            <RoomContextMenu
                onEnter = { menuEnter }
                onLeave = { menuLeave }
                onSelect = { lowerMenu }
                { ...raiseContext } />
            <RoomParticipantContextMenu
                onEnter = { participantMenuEnter }
                onLeave = { participantMenuLeave }
                onSelect = { lowerParticipantMenu }
                { ...raiseParticipantContext } />
        </>
    );
};
