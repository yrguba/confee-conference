import ReducerRegistry from '../../base/redux/ReducerRegistry';

import {
    APP_STATE_CHANGED,
    _SET_APP_STATE_LISTENER
} from './actionTypes';

export interface IBackgroundState {
    appState: string;
    appStateListener?: Function;
}

/**
 * The default/initial redux state of the feature background.
 */
const DEFAULT_STATE = {
    appState: 'active'
};

ReducerRegistry.register<IBackgroundState>('features/background', (state = DEFAULT_STATE, action): IBackgroundState => {
    switch (action.type) {
    case _SET_APP_STATE_LISTENER:
        return {
            ...state,
            appStateListener: action.listener
        };

    case APP_STATE_CHANGED:
        return {
            ...state,
            appState: action.appState
        };
    }

    return state;
});
