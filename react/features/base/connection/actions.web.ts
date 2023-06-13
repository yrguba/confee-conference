import { IStore } from '../../app/types';
import { configureInitialDevices } from '../devices/actions';
import { getBackendSafeRoomName } from '../util/uri';

export {
    connectionDisconnected,
    connectionEstablished,
    connectionFailed,
    setLocationURL
} from './actions.any';
import logger from './logger';

export * from './actions.any';

/**
 * Opens new connection.
 *
 * @returns {Promise<JitsiConnection>}
 */
export function connect() {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const room = getBackendSafeRoomName(getState()['features/base/conference'].room);

        // XXX For web based version we use conference initialization logic
        // from the old app (at the moment of writing).
        return dispatch(configureInitialDevices()).then(
            () => APP.conference.init({
                roomName: room
            }).catch((error: Error) => {
                APP.API.notifyConferenceLeft(APP.conference.roomName);
                logger.error(error);
            }));
    };
}

/**
 * Closes connection.
 *
 * @param {boolean} [requestFeedback] - Whether or not to attempt showing a
 * request for call feedback.
 * @returns {Function}
 */
export function disconnect(requestFeedback = false) {
    // XXX For web based version we use conference hanging up logic from the old
    // app.
    return () => APP.conference.hangup(requestFeedback);
}
