import { IStore } from '../app/types';
import { getLocalJitsiAudioTrack } from '../base/tracks/functions';
import { showErrorNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';
import { NoiseSuppressionEffect } from '../stream-effects/noise-suppression/NoiseSuppressionEffect';

import { SET_NOISE_SUPPRESSION_ENABLED } from './actionTypes';
import { canEnableNoiseSuppression, isNoiseSuppressionEnabled } from './functions';
import logger from './logger';

/**
 * Updates the noise suppression active state.
 *
 * @param {boolean} enabled - Is noise suppression enabled.
 * @returns {{
 *      type: SET_NOISE_SUPPRESSION_STATE,
 *      enabled: boolean
 * }}
 */
export function setNoiseSuppressionEnabledState(enabled: boolean): any {
    return {
        type: SET_NOISE_SUPPRESSION_ENABLED,
        enabled
    };
}

/**
 *  Enabled/disable noise suppression depending on the current state.
 *
 * @returns {Function}
 */
export function toggleNoiseSuppression(): any {
    return (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        if (isNoiseSuppressionEnabled(getState())) {
            dispatch(setNoiseSuppressionEnabled(false));
        } else {
            dispatch(setNoiseSuppressionEnabled(true));
        }
    };
}

/**
 * Attempt to enable or disable noise suppression using the {@link NoiseSuppressionEffect}.
 *
 * @param {boolean} enabled - Enable or disable noise suppression.
 *
 * @returns {Function}
 */
export function setNoiseSuppressionEnabled(enabled: boolean): any {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const state = getState();

        const localAudio = getLocalJitsiAudioTrack(state);
        const noiseSuppressionEnabled = isNoiseSuppressionEnabled(state);

        logger.info(`Attempting to set noise suppression enabled state: ${enabled}`);

        try {
            if (enabled && !noiseSuppressionEnabled) {
                if (!canEnableNoiseSuppression(state, dispatch, localAudio)) {
                    return;
                }

                await localAudio.setEffect(new NoiseSuppressionEffect());
                dispatch(setNoiseSuppressionEnabledState(true));
                logger.info('Noise suppression enabled.');

            } else if (!enabled && noiseSuppressionEnabled) {
                await localAudio.setEffect(undefined);
                dispatch(setNoiseSuppressionEnabledState(false));
                logger.info('Noise suppression disabled.');
            } else {
                logger.warn(`Noise suppression enabled state already: ${enabled}`);
            }
        } catch (error) {
            logger.error(
                `Failed to set noise suppression enabled to: ${enabled}`,
                error
            );

            // @ts-ignore
            dispatch(showErrorNotification({
                titleKey: 'notify.noiseSuppressionFailedTitle'
            }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        }
    };
}
