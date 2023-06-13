import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { createE2EEEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { IReduxState, IStore } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import { connect } from '../../base/redux/functions';
import Switch from '../../base/ui/components/web/Switch';
import { toggleE2EE } from '../actions';
import { MAX_MODE } from '../constants';
import { doesEveryoneSupportE2EE } from '../functions';

interface IProps extends WithTranslation {

    /**
     * The resource for the description, computed based on the maxMode and whether the switch is toggled or not.
     */
    _descriptionResource: string;

    /**
     * Custom e2ee labels.
     */
    _e2eeLabels: any;

    /**
     * Whether the switch is currently enabled or not.
     */
    _enabled: boolean;

    /**
     * Indicates whether all participants in the conference currently support E2EE.
     */
    _everyoneSupportE2EE: boolean;

    /**
     * Whether E2EE is currently enabled or not.
     */
    _toggled: boolean;

    /**
     * The redux {@code dispatch} function.
     */
    dispatch: IStore['dispatch'];
}

interface IState {

    /**
     * True if the switch is toggled on.
     */
    toggled: boolean;
}

/**
 * Implements a React {@code Component} for displaying a security dialog section with a field
 * for setting the E2EE key.
 *
 * @augments Component
 */
class E2EESection extends Component<IProps, IState> {
    /**
     * Implements React's {@link Component#getDerivedStateFromProps()}.
     *
     * @inheritdoc
     */
    static getDerivedStateFromProps(props: IProps, state: IState) {
        if (props._toggled !== state.toggled) {

            return {
                toggled: props._toggled
            };
        }

        return null;
    }

    /**
     * Instantiates a new component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            toggled: false
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onToggle = this._onToggle.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { _descriptionResource, _enabled, _e2eeLabels, _everyoneSupportE2EE, t } = this.props;
        const { toggled } = this.state;
        const description = _e2eeLabels?.description || t(_descriptionResource);
        const label = _e2eeLabels?.label || t('dialog.e2eeLabel');
        const warning = _e2eeLabels?.warning || t('dialog.e2eeWarning');

        return (
            <div id = 'e2ee-section'>
                <p
                    aria-live = 'polite'
                    className = 'description'
                    id = 'e2ee-section-description'>
                    { description }
                    { !_everyoneSupportE2EE && <br /> }
                    { !_everyoneSupportE2EE && warning }
                </p>
                <div className = 'control-row'>
                    <label htmlFor = 'e2ee-section-switch'>
                        { label }
                    </label>
                    <Switch
                        checked = { toggled }
                        disabled = { !_enabled }
                        id = 'e2ee-section-switch'
                        onChange = { this._onToggle } />
                </div>
            </div>
        );
    }

    /**
     * Callback to be invoked when the user toggles E2EE on or off.
     *
     * @private
     * @returns {void}
     */
    _onToggle() {
        const newValue = !this.state.toggled;

        this.setState({
            toggled: newValue
        });

        sendAnalytics(createE2EEEvent(`enabled.${String(newValue)}`));
        this.props.dispatch(toggleE2EE(newValue));
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for this component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const { enabled: e2eeEnabled, maxMode } = state['features/e2ee'];
    const { e2eeLabels } = state['features/base/config'];

    let descriptionResource: string | undefined = '';

    if (e2eeLabels) {
        // When e2eeLabels are present, the descriptionResouse is ignored.
        descriptionResource = undefined;
    } else if (maxMode === MAX_MODE.THRESHOLD_EXCEEDED) {
        descriptionResource = 'dialog.e2eeDisabledDueToMaxModeDescription';
    } else if (maxMode === MAX_MODE.ENABLED) {
        descriptionResource = e2eeEnabled
            ? 'dialog.e2eeWillDisableDueToMaxModeDescription' : 'dialog.e2eeDisabledDueToMaxModeDescription';
    } else {
        descriptionResource = 'dialog.e2eeDescription';
    }

    return {
        _descriptionResource: descriptionResource,
        _e2eeLabels: e2eeLabels,
        _enabled: maxMode === MAX_MODE.DISABLED || e2eeEnabled,
        _toggled: e2eeEnabled,
        _everyoneSupportE2EE: doesEveryoneSupportE2EE(state)
    };
}

export default translate(connect(mapStateToProps)(E2EESection));
