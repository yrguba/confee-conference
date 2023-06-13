import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';

import { translate } from '../../../../base/i18n/functions';
import Icon from '../../../../base/icons/components/Icon';
import { IconCopy } from '../../../../base/icons/svg';
import { copyText } from '../../../../base/util/copyText.web';
// eslint-disable-next-line lines-around-comment
// @ts-ignore
import { _formatConferenceIDPin } from '../../../_utils';

/**
 * The type of the React {@code Component} props of {@link DialInNumber}.
 */
interface IProps extends WithTranslation {

    /**
     * The numeric identifier for the current conference, used after dialing a
     * the number to join the conference.
     */
    conferenceID: string | number;

    /**
     * The phone number to dial to begin the process of dialing into a
     * conference.
     */
    phoneNumber: string;
}

/**
 * React {@code Component} responsible for displaying a telephone number and
 * conference ID for dialing into a conference.
 *
 * @augments Component
 */
class DialInNumber extends Component<IProps> {

    /**
     * Initializes a new DialInNumber instance.
     *
     * @param {Object} props - The read-only properties with which the new
     * instance is to be initialized.
     */
    constructor(props: IProps) {
        super(props);

        // Bind event handler so it is only bound once for every instance.
        this._onCopyText = this._onCopyText.bind(this);
        this._onCopyTextKeyPress = this._onCopyTextKeyPress.bind(this);
    }

    /**
     * Copies the dial-in information to the clipboard.
     *
     * @returns {void}
     */
    _onCopyText() {
        const { conferenceID, phoneNumber, t } = this.props;
        const dialInLabel = t('info.dialInNumber');
        const passcode = t('info.dialInConferenceID');
        const conferenceIDPin = `${_formatConferenceIDPin(conferenceID)}#`;
        const textToCopy = `${dialInLabel} ${phoneNumber} ${passcode} ${conferenceIDPin}`;

        copyText(textToCopy);
    }

    /**
     * KeyPress handler for accessibility.
     *
     * @param {Object} e - The key event to handle.
     *
     * @returns {void}
     */
    _onCopyTextKeyPress(e: React.KeyboardEvent) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this._onCopyText();
        }
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { conferenceID, phoneNumber, t } = this.props;

        return (
            <div className = 'dial-in-number'>
                <div>
                    <span className = 'phone-number'>
                        <span className = 'info-label'>
                            { t('info.dialInNumber') }
                        </span>
                        <span className = 'spacer'>&nbsp;</span>
                        <span className = 'info-value'>
                            { phoneNumber }
                        </span>
                    </span>
                    <span className = 'spacer'>&nbsp;</span>
                    <span className = 'conference-id'>
                        <span className = 'info-label'>
                            { t('info.dialInConferenceID') }
                        </span>
                        <span className = 'spacer'>&nbsp;</span>
                        <span className = 'info-value'>
                            { `${_formatConferenceIDPin(conferenceID)}#` }
                        </span>
                    </span>
                </div>
                <a
                    aria-label = { t('info.copyNumber') }
                    className = 'dial-in-copy'
                    onClick = { this._onCopyText }
                    onKeyPress = { this._onCopyTextKeyPress }
                    role = 'button'
                    tabIndex = { 0 }>
                    <Icon src = { IconCopy } />
                </a>
            </div>
        );
    }
}

export default translate(DialInNumber);
