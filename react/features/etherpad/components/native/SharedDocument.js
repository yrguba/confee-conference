import React, { PureComponent } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';

import { translate } from '../../../base/i18n';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import { LoadingIndicator } from '../../../base/react';
import { connect } from '../../../base/redux';
import { getSharedDocumentUrl } from '../../functions';

import styles, { INDICATOR_COLOR } from './styles';

/**
 * The type of the React {@code Component} props of {@code ShareDocument}.
 */
type Props = {

    /**
     * URL for the shared document.
     */
    _documentUrl: string,

    /**
     * Default prop for navigation between screen components(React Navigation).
     */
    navigation: Object,

    /**
     * Function to be used to translate i18n labels.
     */
    t: Function
};

/**
 * Implements a React native component that renders the shared document window.
 */
class SharedDocument extends PureComponent<Props> {
    /**
     * Instantiates a new instance.
     *
     * @inheritdoc
     */
    constructor(props: Props) {
        super(props);

        this._renderLoading = this._renderLoading.bind(this);
    }

    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        const { _documentUrl } = this.props;

        return (
            <JitsiScreen
                addHeaderHeightValue = { true }
                style = { styles.sharedDocContainer }>
                <WebView
                    hideKeyboardAccessoryView = { true }
                    renderLoading = { this._renderLoading }
                    source = {{ uri: _documentUrl }}
                    startInLoadingState = { true }
                    style = { styles.sharedDoc } />
            </JitsiScreen>
        );
    }

    /**
     * Renders the loading indicator.
     *
     * @returns {React$Component<any>}
     */
    _renderLoading() {
        return (
            <View style = { styles.indicatorWrapper }>
                <LoadingIndicator
                    color = { INDICATOR_COLOR }
                    size = 'large' />
            </View>
        );
    }
}

/**
 * Maps (parts of) the redux state to {@link SharedDocument} React {@code Component} props.
 *
 * @param {Object} state - The redux store/state.
 * @private
 * @returns {Object}
 */
export function _mapStateToProps(state: Object) {
    const documentUrl = getSharedDocumentUrl(state);

    return {
        _documentUrl: documentUrl
    };
}

export default translate(connect(_mapStateToProps)(SharedDocument));
