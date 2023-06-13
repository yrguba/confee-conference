// @flow

import React from 'react';

import { translate } from '../../../base/i18n';
import { IconMicSlash } from '../../../base/icons';
import { connect } from '../../../base/redux';
import ContextMenuItem from '../../../base/ui/components/web/ContextMenuItem';
import AbstractMuteEveryoneElseButton, {
    type Props
} from '../AbstractMuteEveryoneElseButton';

/**
 * Implements a React {@link Component} which displays a button for audio muting
 * every participant in the conference except the one with the given
 * participantID.
 */
class MuteEveryoneElseButton extends AbstractMuteEveryoneElseButton {
    /**
     * Instantiates a new {@code Component}.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._handleClick = this._handleClick.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    render() {
        const { t } = this.props;

        return (
            <ContextMenuItem
                accessibilityLabel = { t('toolbar.accessibilityLabel.muteEveryoneElse') }
                icon = { IconMicSlash }
                // eslint-disable-next-line react/jsx-handler-names
                onClick = { this._handleClick }
                text = { t('videothumbnail.domuteOthers') } />
        );
    }

    _handleClick: () => void;
}

export default translate(connect()(MuteEveryoneElseButton));
