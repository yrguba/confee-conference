import React, { PureComponent } from 'react';

import { IReduxState } from '../../app/types';
import isInsecureRoomName from '../../base/util/isInsecureRoomName';

type Props = {

    /**
     * True of the label should be visible.
     */
    _visible: boolean;

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function;
};

/**
 * Abstract class for the {@Code InsecureRoomNameLabel} component.
 */
export default class AbstractInsecureRoomNameLabel extends PureComponent<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        if (!this.props._visible) {
            return null;
        }

        return this._render();
    }

    /**
     * Renders the platform dependent content.
     *
     * @returns {ReactElement}
     */
    _render() {
        return <></>;
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
export function _mapStateToProps(state: IReduxState) {
    const { locked, room } = state['features/base/conference'];
    const { lobbyEnabled } = state['features/lobby'];
    const { enableInsecureRoomNameWarning = false } = state['features/base/config'];

    return {
        _visible: Boolean(enableInsecureRoomNameWarning
            && room && isInsecureRoomName(room)
            && !(lobbyEnabled || Boolean(locked)))
    };
}
