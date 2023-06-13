import React from 'react';
import { Text, View } from 'react-native';

import { Avatar } from '../../../base/avatar';
import { translate } from '../../../base/i18n';
import { Linkify } from '../../../base/react';
import { connect } from '../../../base/redux';
import { isGifMessage } from '../../../gifs/functions';
import { MESSAGE_TYPE_ERROR, MESSAGE_TYPE_LOCAL } from '../../constants';
import { replaceNonUnicodeEmojis } from '../../functions';
import AbstractChatMessage, { type Props } from '../AbstractChatMessage';

import GifMessage from './GifMessage';
import PrivateMessageButton from './PrivateMessageButton';
import styles from './styles';


/**
 * Renders a single chat message.
 */
class ChatMessage extends AbstractChatMessage<Props> {
    /**
     * Implements {@code Component#render}.
     *
     * @inheritdoc
     */
    render() {
        const { message, knocking } = this.props;
        const localMessage = message.messageType === MESSAGE_TYPE_LOCAL;
        const { privateMessage, lobbyChat } = message;

        // Style arrays that need to be updated in various scenarios, such as
        // error messages or others.
        const detailsWrapperStyle = [
            styles.detailsWrapper
        ];
        const messageBubbleStyle = [
            styles.messageBubble
        ];

        if (localMessage) {
            // This is a message sent by the local participant.

            // The wrapper needs to be aligned to the right.
            detailsWrapperStyle.push(styles.ownMessageDetailsWrapper);

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.localMessageBubble);
        } else if (message.messageType === MESSAGE_TYPE_ERROR) {
            // This is a system message.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.systemMessageBubble);
        } else {
            // This is a remote message sent by a remote participant.

            // The bubble needs some additional styling
            messageBubbleStyle.push(styles.remoteMessageBubble);
        }

        if (privateMessage) {
            messageBubbleStyle.push(styles.privateMessageBubble);
        }

        if (lobbyChat && !knocking) {
            messageBubbleStyle.push(styles.lobbyMessageBubble);
        }

        const messageText = replaceNonUnicodeEmojis(this._getMessageText());

        return (
            <View style = { styles.messageWrapper } >
                { this._renderAvatar() }
                <View style = { detailsWrapperStyle }>
                    <View style = { messageBubbleStyle }>
                        <View style = { styles.textWrapper } >
                            { this._renderDisplayName() }
                            { isGifMessage(messageText)
                                ? <GifMessage message = { messageText } />
                                : (
                                    <Linkify
                                        linkStyle = { styles.chatLink }
                                        style = { styles.chatMessage }>
                                        { messageText }
                                    </Linkify>
                                )}
                            { this._renderPrivateNotice() }
                        </View>
                        { this._renderPrivateReplyButton() }
                    </View>
                    { this._renderTimestamp() }
                </View>
            </View>
        );
    }

    _getFormattedTimestamp: () => string;

    _getMessageText: () => string;

    _getPrivateNoticeMessage: () => string;

    /**
     * Renders the avatar of the sender.
     *
     * @returns {React$Element<*>}
     */
    _renderAvatar() {
        const { message } = this.props;

        return (
            <View style = { styles.avatarWrapper }>
                { this.props.showAvatar && <Avatar
                    displayName = { message.displayName }
                    participantId = { message.id }
                    size = { styles.avatarWrapper.width } />
                }
            </View>
        );
    }

    /**
     * Renders the display name of the sender if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderDisplayName() {
        const { message, showDisplayName } = this.props;

        if (!showDisplayName) {
            return null;
        }

        return (
            <Text style = { styles.senderDisplayName }>
                { message.displayName }
            </Text>
        );
    }

    /**
     * Renders the message privacy notice, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderPrivateNotice() {
        const { message, knocking } = this.props;

        if (!(message.privateMessage || (message.lobbyChat && !knocking))) {
            return null;
        }

        return (
            <Text style = { message.lobbyChat ? styles.lobbyMsgNotice : styles.privateNotice }>
                { this._getPrivateNoticeMessage() }
            </Text>
        );
    }

    /**
     * Renders the private reply button, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderPrivateReplyButton() {
        const { message, knocking } = this.props;
        const { messageType, privateMessage, lobbyChat } = message;

        if (!(privateMessage || lobbyChat) || messageType === MESSAGE_TYPE_LOCAL || knocking) {
            return null;
        }

        return (
            <View style = { styles.replyContainer }>
                <PrivateMessageButton
                    isLobbyMessage = { lobbyChat }
                    participantID = { message.id }
                    reply = { true }
                    showLabel = { false }
                    toggledStyles = { styles.replyStyles } />
            </View>
        );
    }

    /**
     * Renders the time at which the message was sent, if necessary.
     *
     * @returns {React$Element<*> | null}
     */
    _renderTimestamp() {
        if (!this.props.showTimestamp) {
            return null;
        }

        return (
            <Text style = { styles.timeText }>
                { this._getFormattedTimestamp() }
            </Text>
        );
    }
}

/**
 * Maps part of the redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Props}
 */
function _mapStateToProps(state) {
    return {
        knocking: state['features/lobby'].knocking
    };
}

export default translate(connect(_mapStateToProps)(ChatMessage));
