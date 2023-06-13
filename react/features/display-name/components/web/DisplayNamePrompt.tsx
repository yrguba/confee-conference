import React from 'react';

import { translate } from '../../../base/i18n/functions';
import { connect } from '../../../base/redux/functions';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import AbstractDisplayNamePrompt, { IProps } from '../AbstractDisplayNamePrompt';

/**
 * The type of the React {@code Component} props of {@link DisplayNamePrompt}.
 */
interface IState {

    /**
     * The name to show in the display name text field.
     */
    displayName: string;
}

/**
 * Implements a React {@code Component} for displaying a dialog with an field
 * for setting the local participant's display name.
 *
 * @augments Component
 */
class DisplayNamePrompt extends AbstractDisplayNamePrompt<IState> {
    /**
     * Initializes a new {@code DisplayNamePrompt} instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            displayName: ''
        };

        // Bind event handlers so they are only bound once for every instance.
        this._onDisplayNameChange = this._onDisplayNameChange.bind(this);
        this._onSubmit = this._onSubmit.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        return (
            <Dialog
                cancel = {{ translationKey: 'dialog.Cancel' }}
                ok = {{ translationKey: 'dialog.Ok' }}
                onSubmit = { this._onSubmit }
                titleKey = 'dialog.displayNameRequired'>
                <Input
                    id="display-name-required-field"
                    autoFocus = { true }
                    className = 'dialog-bottom-margin'
                    label = { this.props.t('dialog.enterDisplayName') }
                    name = 'displayName'
                    onChange = { this._onDisplayNameChange }
                    type = 'text'
                    value = { this.state.displayName } />
            </Dialog>);
    }

    /**
     * Updates the entered display name.
     *
     * @param {string} value - The new value of the input.
     * @private
     * @returns {void}
     */
    _onDisplayNameChange(value: string) {
        this.setState({
            displayName: value
        });
    }

    /**
     * Dispatches an action to update the local participant's display name. A
     * name must be entered for the action to dispatch.
     *
     * @private
     * @returns {boolean}
     */
    _onSubmit() {
        return this._onSetDisplayName(this.state.displayName);
    }
}

export default translate(connect()(DisplayNamePrompt));
