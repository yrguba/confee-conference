// @flow

import { translate } from '../../../base/i18n';
import {
    type Props as AbstractProps,
    ExpandedLabel
} from '../../../base/label';
import { JitsiRecordingConstants } from '../../../base/lib-jitsi-meet';
import { connect } from '../../../base/redux';
import { getSessionStatusToShow } from '../../functions';

type Props = AbstractProps & {

    /**
     * The status of the highermost priority session.
     */
    _status: ?string,

    /**
     * The recording mode this indicator should display.
     */
    mode: string,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
}

/**
 * A react {@code Component} that implements an expanded label as tooltip-like
 * component to explain the meaning of the {@code RecordingLabel}.
 */
class RecordingExpandedLabel extends ExpandedLabel<Props> {

    /**
     * Returns the label specific text of this {@code ExpandedLabel}.
     *
     * @returns {string}
     */
    _getLabel() {
        const { _status, mode, t } = this.props;
        let postfix = 'recording', prefix = 'expandedOn'; // Default values.

        switch (mode) {
        case JitsiRecordingConstants.mode.STREAM:
            prefix = 'liveStreaming';
            break;
        case JitsiRecordingConstants.mode.FILE:
            prefix = 'recording';
            break;
        }

        switch (_status) {
        case JitsiRecordingConstants.status.OFF:
            postfix = 'expandedOff';
            break;
        case JitsiRecordingConstants.status.PENDING:
            postfix = 'expandedPending';
            break;
        case JitsiRecordingConstants.status.ON:
            postfix = 'expandedOn';
            break;
        }

        return t(`${prefix}.${postfix}`);
    }
}

/**
 * Maps (parts of) the Redux state to the associated
 * {@code RecordingExpandedLabel}'s props.
 *
 * @param {Object} state - The Redux state.
 * @param {Props} ownProps - The component's own props.
 * @private
 * @returns {{
 *     _status: ?string
 * }}
 */
function _mapStateToProps(state: Object, ownProps: Props) {
    const { mode } = ownProps;

    return {
        _status: getSessionStatusToShow(state, mode)
    };
}

export default translate(connect(_mapStateToProps)(RecordingExpandedLabel));
