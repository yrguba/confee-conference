import React from 'react';
import { WithTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { IReduxState } from '../../app/types';
import CopyButton from '../../base/buttons/CopyButton.web';
import { getInviteURL } from '../../base/connection/functions';
import { translate } from '../../base/i18n/functions';
import Dialog from '../../base/ui/components/web/Dialog';
import Input from '../../base/ui/components/web/Input';

interface IProps extends WithTranslation {

    /**
     * The URL of the conference.
     */
    url: string;
}

/**
 * Allow users to embed a jitsi meeting in an iframe.
 *
 * @returns {React$Element<any>}
 */
function EmbedMeeting({ t, url }: IProps) {
    /**
     * Get the embed code for a jitsi meeting.
     *
     * @returns {string} The iframe embed code.
     */
    const getEmbedCode = () =>
        `<iframe allow="camera; microphone; fullscreen; display-capture; autoplay" src="${url}"`
        + ' style="height: 100%; width: 100%; border: 0px;"></iframe>';

    return (
        <Dialog
            cancel = {{ hidden: true }}
            ok = {{ hidden: true }}
            titleKey = { 'embedMeeting.title' }>
            <div className = 'embed-meeting-dialog'>
                <Input
                    accessibilityLabel = { t('dialog.embedMeeting') }
                    readOnly = { true }
                    textarea = { true }
                    value = { getEmbedCode() } />
                <CopyButton
                    aria-label = { t('addPeople.copyLink') }
                    className = 'embed-meeting-copy'
                    displayedText = { t('dialog.copy') }
                    textOnCopySuccess = { t('dialog.copied') }
                    textOnHover = { t('dialog.copy') }
                    textToCopy = { getEmbedCode() } />
            </div>
        </Dialog>
    );
}

const mapStateToProps = (state: IReduxState) => {
    return {
        url: getInviteURL(state)
    };
};

export default translate(connect(mapStateToProps)(EmbedMeeting));
